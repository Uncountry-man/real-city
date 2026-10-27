"""Gera as versões web dos arquivos de "import assets" em assets/img.

Os originais não são alterados. Executar com:  python3 scripts/optimize-images.py
"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "import assets"
OUT = ROOT / "assets" / "img"

WORDMARK = SRC / "file_00000000d818820e9bc997d17e38215a.png"
MONOGRAM = SRC / "file_00000000e188820e92116fadd642ae40.png"
KEY_ART = SRC / "IMG-20261015-WA0650.jpg"
SCREENSHOTS = {
    "captura-orla": SRC / "IMG-20261026-WA0034.jpg",
    "captura-centro": SRC / "IMG-20261026-WA0040.jpg",
}


def trim(im: Image.Image) -> Image.Image:
    return im.crop(im.getchannel("A").getbbox())


def save_resized(im: Image.Image, name: str, widths, formats=("webp", "jpg")):
    for w in widths:
        h = round(im.height * w / im.width)
        resized = im.resize((w, h), Image.LANCZOS)
        for fmt in formats:
            path = OUT / f"{name}-{w}.{fmt}"
            if fmt == "webp":
                resized.save(path, "WEBP", quality=80, method=6)
            elif fmt == "jpg":
                resized.convert("RGB").save(path, "JPEG", quality=82, optimize=True, progressive=True)
            else:
                resized.save(path, "PNG", optimize=True)
            print(f"{path.relative_to(ROOT)}  {w}x{h}  {path.stat().st_size // 1024} KB")


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    wordmark = trim(Image.open(WORDMARK).convert("RGBA"))
    save_resized(wordmark, "logo-real-city", (160, 320, 480, 960), ("webp", "png"))

    monogram = trim(Image.open(MONOGRAM).convert("RGBA"))
    side = max(monogram.size)
    pad = round(side * 0.04)
    square = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    square.paste(monogram, ((square.width - monogram.width) // 2, (square.height - monogram.height) // 2))
    for size in (32, 192, 512):
        square.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}.png", optimize=True)
    # Apple touch icon não aceita transparência: fundo claro do site.
    apple = Image.new("RGBA", (180, 180), (8, 18, 31, 255))
    inner = square.resize((148, 148), Image.LANCZOS)
    apple.alpha_composite(inner, (16, 16))
    apple.convert("RGB").save(OUT / "apple-touch-icon.png", optimize=True)
    square.save(ROOT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

    key_art = Image.open(KEY_ART).convert("RGB")
    save_resized(key_art, "arte-oficial", (480, 800, 1024))

    for name, path in SCREENSHOTS.items():
        shot = Image.open(path).convert("RGB")
        save_resized(shot, name, (640, 1024, 1600))

    # Imagem de compartilhamento 1200x630 a partir da captura da orla.
    shot = Image.open(SCREENSHOTS["captura-orla"]).convert("RGB")
    target_ratio = 1200 / 630
    crop_w = round(shot.height * target_ratio)
    left = (shot.width - crop_w) // 2
    og = shot.crop((left, 0, left + crop_w, shot.height)).resize((1200, 630), Image.LANCZOS)
    og.save(OUT / "og-real-city.jpg", "JPEG", quality=84, optimize=True, progressive=True)
    grain()


def grain():
    """Textura de grão em tile (PNG cinza com alfa) para o fundo do site."""
    import random
    random.seed(7)
    size = 256
    tile = Image.new("LA", (size, size))
    px = tile.load()
    for y in range(size):
        for x in range(size):
            v = random.choice((0, 255))
            px[x, y] = (v, random.randint(0, 34))
    tile.save(OUT / "grao.png", optimize=True)


if __name__ == "__main__":
    main()
