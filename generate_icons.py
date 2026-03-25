"""
Einmalig ausführen um PWA-Icons zu generieren.
Benötigt: pip install Pillow
"""
from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = os.path.join("frontend", "public", "icons")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def make_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Abgerundeter Hintergrund
    radius = size // 5
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill="#06060e")

    # Lila Glow-Kreis
    glow_r = int(size * 0.38)
    cx, cy = size // 2, size // 2
    draw.ellipse(
        [cx - glow_r, cy - glow_r, cx + glow_r, cy + glow_r],
        fill="#3d1a7a"
    )

    # "FT" Text
    font_size = int(size * 0.38)
    try:
        font = ImageFont.truetype("arial.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    text = "FT"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        (cx - tw // 2, cy - th // 2 - bbox[1]),
        text,
        fill="#c084fc",
        font=font,
    )

    return img

for size in [192, 512]:
    icon = make_icon(size)
    path = os.path.join(OUTPUT_DIR, f"icon-{size}.png")
    icon.save(path, "PNG")
    print(f"✓ {path} erstellt")

print("\nIcons fertig! Jetzt 'npm run build' im frontend-Ordner ausführen.")
