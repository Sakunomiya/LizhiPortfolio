"""Build lightweight WebP mirrors for every website raster image.

Original portfolio assets are deliberately left untouched. Run this script after
adding or replacing images; output is written below assets/optimized/ while
preserving the original directory layout.
"""

from pathlib import Path
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUTPUT = ASSETS / "optimized"
SOURCE_EXTENSIONS = {".png", ".jpg", ".jpeg"}


def maximum_edge(relative_path: Path) -> int:
    normalized = relative_path.as_posix().lower()
    if "/tcg/library/" in f"/{normalized}":
        return 720
    if "/tcg/cards/" in f"/{normalized}":
        return 1000
    if normalized == "profile-lizhi.jpg":
        return 960
    return 1920


def convert(source: Path) -> tuple[int, int]:
    relative = source.relative_to(ASSETS)
    target = (OUTPUT / relative).with_suffix(".webp")
    target.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened)
        image.thumbnail((maximum_edge(relative), maximum_edge(relative)), Image.Resampling.LANCZOS)
        has_alpha = image.mode in {"RGBA", "LA"} or "transparency" in image.info
        if has_alpha:
            image = image.convert("RGBA")
        else:
            image = image.convert("RGB")
        save_options = {"format": "WEBP", "method": 6, "quality": 82}
        if has_alpha and ("symbol" in relative.stem.lower() or "logo" in relative.stem.lower()):
            save_options.update(lossless=True, quality=100)
        image.save(target, **save_options)

    return source.stat().st_size, target.stat().st_size


def main() -> None:
    sources = sorted(
        path for path in ASSETS.rglob("*")
        if path.is_file()
        and OUTPUT not in path.parents
        and path.suffix.lower() in SOURCE_EXTENSIONS
    )
    original_total = optimized_total = 0
    for index, source in enumerate(sources, start=1):
        original, optimized = convert(source)
        original_total += original
        optimized_total += optimized
        if index % 25 == 0 or index == len(sources):
            print(f"Optimized {index}/{len(sources)}")

    reduction = 100 * (1 - optimized_total / original_total) if original_total else 0
    print(f"Original:  {original_total / 1024 / 1024:.2f} MB")
    print(f"Optimized: {optimized_total / 1024 / 1024:.2f} MB")
    print(f"Reduction: {reduction:.1f}%")


if __name__ == "__main__":
    main()
