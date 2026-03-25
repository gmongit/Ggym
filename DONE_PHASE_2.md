# Phase 2 – Frontend PWA: Abgeschlossen

## Implementiert

### 2.1 Vite + React Setup
- Vollständiges `package.json` mit allen Abhängigkeiten
- `vite.config.js` mit PWA-Plugin und Dev-Server Proxy zu Backend

### 2.2 PWA Konfiguration
- `vite-plugin-pwa` mit Service Worker (NetworkFirst für Workouts, StaleWhileRevalidate für Übungen)
- Web App Manifest: FitTrack AI, theme_color #007AFF
- Apple-spezifische Meta-Tags für Homescreen-Installation

### 2.3 Design System (iOS-ähnlich)
- Tailwind mit iOS-Farbpalette (ios-blue, ios-green, ios-orange, ios-red, ios-gray-*)
- Komponenten: `.ios-card`, `.ios-btn-primary`, `.ios-input`
- Safe-Area-Support für iPhone Notch/Home Bar (env(safe-area-inset-*))
- CSS-Transitions für Tap-Feedback (active:scale-95)

### 2.4 Screens
| Screen | Features |
|---|---|
| Login/Register | E-Mail + Passwort, Invite-Token-Support in URL |
| Training | Liste aller Workouts, "Training starten" → WorkoutDetail |
| WorkoutDetail | Übungsauswahl (Filter nach Muskelgruppe), Satz-Eingabe (Numpad), letztes Gewicht als Hint, RPE + Notizen beim Beenden |
| Progress | 1RM-Chart (Epley), Körpergewicht-Chart (30/90/180 Tage), Recharts |
| Coach | Wochenzusammenfassung, ML-Empfehlungen pro Übung, Feedback (👍/👎) |
| Ernährung | Kalorien-Ring SVG, Makro-Balken, Open Food Facts API-Suche, manuelle Eingabe |
| Profil | Gewicht eintragen, Freund einladen (Link generieren + kopieren), PWA-Installationsanleitung |

### 2.5 API Integration
- Axios mit JWT-Interceptor (auto-attach + 401→logout)
- React Query mit 5min stale time
- IndexedDB (via `idb`) für Offline-Cache von Workouts und Übungen

## Starten
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# → http://localhost:5173
```

## Deploy
- Frontend: `vercel.json` vorhanden, `VITE_API_URL` als Environment Variable setzen
- `npm run build` → dist/ Ordner
