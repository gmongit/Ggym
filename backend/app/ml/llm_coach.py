"""
Phase 4 – LLM Coach

Architektur:
- Groq API (llama-3.3-70b-versatile) als LLM – kostenlos, ~500ms Latenz
- Kontext wird pro Request aus der DB zusammengebaut:
    * Letzte 5 Sessions der angefragten Übung
    * ML-Empfehlung + Konfidenz
    * Körpergewicht-Trend
    * Kalorien der letzten Woche
- Chat-History wird clientseitig gehalten (kein DB-State nötig)
- Template-Fallback wenn kein API-Key vorhanden
"""

import httpx
from typing import Optional

SYSTEM_PROMPT = """Du bist ein erfahrener Krafttraining-Coach mit Fokus auf evidenzbasiertem Training.
Du analysierst die konkreten Trainingsdaten des Users und gibst präzise, personalisierte Empfehlungen.

Regeln:
- Antworte immer auf Deutsch
- Beziehe dich auf die konkreten Zahlen aus dem Kontext (Gewichte, Wiederholungen, Trend)
- Keine generischen Phrasen wie "Hör auf deinen Körper" ohne konkrete Ergänzung
- Halte Antworten kurz: 3-5 Sätze – außer der User fragt explizit nach mehr Details
- Sei motivierend aber realistisch
- Wenn du dir unsicher bist: sag es ehrlich"""

QUICK_QUESTIONS = [
    "Warum soll ich das Gewicht erhöhen?",
    "Bin ich im Plateau?",
    "Wie viele Sätze empfiehlst du?",
    "Brauche ich einen Deload?",
    "Was ist mein stärkster Fortschritt?",
]


def build_context_text(context: dict) -> str:
    """Baut den Kontext-String für das LLM aus den Trainingsdaten."""
    lines = []

    if context.get("exercise_name"):
        lines.append(f"Übung: {context['exercise_name']}")

    if context.get("recent_sessions"):
        lines.append(f"Letzte Sessions: {context['recent_sessions']}")

    if context.get("ml_recommendation"):
        conf = context.get("confidence", 0)
        lines.append(f"ML-Empfehlung: {context['ml_recommendation']} (Konfidenz: {conf:.0%})")

    if context.get("explanation"):
        lines.append(f"Begründung: {context['explanation']}")

    if context.get("suggested_weight_kg"):
        lines.append(f"Empfohlenes Gewicht: {context['suggested_weight_kg']} kg × {context.get('suggested_reps', '?')} Wdh.")

    if context.get("weight_trend"):
        lines.append(f"Körpergewicht-Trend: {context['weight_trend']}")

    if context.get("avg_calories"):
        lines.append(f"Kalorien letzte Woche: {context['avg_calories']} kcal/Tag")

    return "\n".join(lines) if lines else "Keine Trainingsdaten vorhanden."


async def get_llm_response(
    user_message: str,
    context: dict,
    chat_history: list,
    groq_api_key: Optional[str] = None,
) -> str:
    if groq_api_key:
        try:
            return await _call_groq(user_message, context, chat_history, groq_api_key)
        except Exception as e:
            return _template_response(context, str(e))
    return _template_response(context)


async def _call_groq(
    user_message: str,
    context: dict,
    chat_history: list,
    api_key: str,
) -> str:
    context_text = build_context_text(context)

    # System prompt + Kontext als erste Nachricht
    messages = [
        {
            "role": "system",
            "content": f"{SYSTEM_PROMPT}\n\n--- AKTUELLE TRAININGSDATEN ---\n{context_text}"
        }
    ]

    # Chat-History einbauen (max. letzte 6 Nachrichten um Tokens zu sparen)
    for msg in chat_history[-6:]:
        if msg.get("role") in ("user", "assistant") and msg.get("content"):
            messages.append({"role": msg["role"], "content": msg["content"]})

    # Aktuelle User-Nachricht
    messages.append({"role": "user", "content": user_message})

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": messages,
                "max_tokens": 400,
                "temperature": 0.7,
            },
            timeout=30.0,
        )
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"]


def _template_response(context: dict, error: str = "") -> str:
    """Fallback wenn kein API-Key oder Groq nicht erreichbar."""
    rec = context.get("ml_recommendation", "maintain")
    exercise = context.get("exercise_name", "dieser Übung")
    weight = context.get("suggested_weight_kg")
    reps = context.get("suggested_reps")

    templates = {
        "increase_weight": (
            f"Dein Trend bei {exercise} zeigt konstante Verbesserung – du bist bereit für mehr Gewicht. "
            + (f"Ich empfehle {weight} kg × {reps} Wdh. " if weight else "")
            + "Erhöhe schrittweise um 2.5 kg und halte die Wiederholungen."
        ),
        "increase_reps": (
            f"Bei {exercise} hast du noch Kapazität bei den Wiederholungen. "
            + "Erhöhe erst die Reps auf dein Ziel, bevor du das Gewicht steigerst – "
            + "das macht den Fortschritt nachhaltiger."
        ),
        "deload": (
            f"Du hast in letzter Zeit intensiv bei {exercise} trainiert. "
            + "Ein Deload (10-15% weniger Gewicht diese Woche) hilft dir, stärker zurückzukommen. "
            + "Das ist keine Schwäche, sondern Strategie."
        ),
        "volume_increase": (
            f"Deine Intensität bei {exercise} ist solide. "
            + "Füge einen zusätzlichen Arbeitssatz hinzu und beobachte deine Erholung – "
            + "mehr Volumen ist oft der nächste Schritt wenn das Gewicht stagniert."
        ),
        "maintain": (
            f"Halte das aktuelle Niveau bei {exercise} und fokussiere dich auf Konsistenz. "
            + "Saubere Ausführung und regelmäßiges Training sind jetzt wichtiger als Steigerungen."
        ),
    }

    base = templates.get(rec, templates["maintain"])
    if error:
        base += f" (Hinweis: LLM nicht verfügbar – Template-Antwort)"
    return base
