"""
Remove the white/grey backgrounds from all baldin-ring sprite PNGs.
Uses rembg with the u2net model. Writes RGBA PNGs back to the sprites folder
(overwriting the originals, but only after a successful write).

Run: python remove_backgrounds.py
"""
import sys
import shutil
import tempfile
from pathlib import Path

try:
    from rembg import remove, new_session
except ImportError:
    print("rembg not installed. Run: pip install rembg", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parent.parent
SPRITE_DIR = ROOT / "assets" / "img" / "sprites"

if not SPRITE_DIR.exists():
    print(f"ERROR: sprite directory not found: {SPRITE_DIR}", file=sys.stderr)
    sys.exit(1)

# Only process character/object sprites - skip the background_arena which should stay opaque
SKIP = {"background_arena.png"}

pngs = sorted(p for p in SPRITE_DIR.glob("*.png") if p.name not in SKIP)
print(f"Found {len(pngs)} sprites to process (skipping background_arena)")

session = new_session("u2net")

with tempfile.TemporaryDirectory() as tmp:
    tmp_dir = Path(tmp)
    for i, png in enumerate(pngs, 1):
        print(f"  [{i}/{len(pngs)}] {png.name} ... ", end="", flush=True)
        with open(png, "rb") as f:
            inp = f.read()
        try:
            result = remove(inp, session=session)
        except Exception as e:
            print(f"FAIL: {e}")
            continue
        # Stage to temp file, then move into place
        tmp_path = tmp_dir / png.name
        with open(tmp_path, "wb") as f:
            f.write(result)
        shutil.move(str(tmp_path), str(png))
        size_kb = png.stat().st_size // 1024
        print(f"OK ({size_kb} KB)")

print("\nDone. Background removal complete on all character/object sprites.")
print("Hard refresh the browser to see the change.")
