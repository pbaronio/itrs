"""
Genera le icone dell'app (PNG) dall'icona fornita da Paolo.
Uso: python3 scripts/make_icons.py  (richiede Pillow)

Sorgente: assets/icon/itrs-icon-source.png (256 px, angoli già arrotondati e trasparenti).
iOS e Android applicano la loro maschera, quindi qui gli angoli trasparenti vengono
riempiti col fondo dell'icona: ogni icona generata è un quadrato pieno.
Con una sorgente da 1024 px (o SVG) le icone grandi diventano più nitide.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets/icon/itrs-icon-source.png'
OUT = ROOT / 'public/icons'


def row_edges(src, w, y):
    opaque = [x for x in range(w) if src[x, y][3] == 255]
    return (src[opaque[0], y], src[opaque[-1], y]) if opaque else None


def full_bleed(im: Image.Image) -> Image.Image:
    """Riempie gli angoli trasparenti, riga per riga, col colore del fondo vicino."""
    im = im.convert('RGBA')
    w, h = im.size
    src = im.load()
    out = Image.new('RGB', (w, h))
    dst = out.load()
    for y in range(h):
        edges = row_edges(src, w, y)
        yy = y
        while edges is None:  # riga senza pixel pieni: cerca verso il centro
            yy += 1 if y < h // 2 else -1
            edges = row_edges(src, w, yy)
        left, right = edges
        for x in range(w):
            r, g, b, a = src[x, y]
            fill = left if x < w // 2 else right
            k = a / 255
            dst[x, y] = tuple(round(c * k + f * (1 - k)) for c, f in zip((r, g, b), fill[:3]))
    return out


def save(im: Image.Image, size: int, name: str):
    im.resize((size, size), Image.LANCZOS).save(OUT / name, optimize=True)
    print('✓', name)


source = Image.open(SRC)
square = full_bleed(source)

save(square, 192, 'icon-192.png')            # Android, purpose any
save(square, 512, 'icon-512.png')
save(square, 512, 'icon-maskable-512.png')   # il pentagono sta già nella zona sicura (80%)
save(square, 180, 'apple-touch-icon.png')    # iOS Home Screen
save(square, 144, 'icon-guide.png')          # anteprima nella guida (72 px @2x, angoli via CSS)
source.convert('RGBA').resize((64, 64), Image.LANCZOS).save(OUT / 'favicon-64.png', optimize=True)
print('✓ favicon-64.png')
