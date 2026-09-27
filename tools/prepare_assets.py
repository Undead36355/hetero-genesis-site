"""Prepare compressed public assets for the Hetero-Genesis site.

Copies current-build media (landscape era, 2026-09) from the game repository
and the issuance material library into assets/, resized and re-encoded for
GitHub Pages.

Usage:
  python tools/prepare_assets.py
"""

from pathlib import Path

from PIL import Image, ImageOps

SITE = Path(__file__).resolve().parent.parent
ASSETS = SITE / "assets"
GAME = Path("F:/package/Hetero-Genesis")
ISSUANCE = Path("F:/package/game-issuance-and-operation")

XPOST = ISSUANCE / "pending-materials/x-post-landscape-en-30-20260912/screenshots"
GALLERY = ISSUANCE / "local/store-assets/steam/refresh-20260922/gallery-additions"
STEAM_GIFS = ISSUANCE / "local/store-assets/steam/refresh-20260922"
PROMO = GAME / "ArtSources/Promotional"
ICON = GAME / "ArtSources/AppIcon/hetero_genesis_app_icon_master_1024.png"
SPECIES_SRC = GAME / "Artifacts/SpeciesPreviews/pc_all_stages"
FLOORS = GAME / "Assets/Resources/Map/Backgrounds"

SCREENS = {
    "main-menu": XPOST / "01-run-main-menu.png",
    "dive-prep": XPOST / "02-run-prerun-selection.png",
    "species-select": GALLERY / "04-species_english.png",
    "organ-draft": GALLERY / "01-organ-draft_english.png",
    "body-slots": GALLERY / "02-body-slots_english.png",
    "evolution": GALLERY / "03-evolution_english.png",
    "boss-venom": XPOST / "09-venom-boss-pressure.png",
    "broken-armor": XPOST / "12-wave6-broken-armor.png",
    "crossfire": XPOST / "16-wave4-crossfire.png",
    "result": XPOST / "22-run-result-high-pressure.png",
    "synergy-detail": XPOST / "28-run-organ-codex-poison-nova.png",
    "growth": XPOST / "29-run-meta-progression.png",
}


def save_webp(src: Path, dst: Path, max_width: int, quality: int) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src)
    im = ImageOps.exif_transpose(im)
    if im.width > max_width:
        ratio = max_width / im.width
        im = im.resize((max_width, round(im.height * ratio)), Image.LANCZOS)
    if im.mode in ("RGBA", "P"):
        im = im.convert("RGB")
    im.save(dst, "WEBP", quality=quality, method=6)
    print(f"{dst.relative_to(SITE)}  {im.size}  {dst.stat().st_size // 1024}KB")


def save_png(src: Path, dst: Path, size: int) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(src).convert("RGBA")
    im = im.resize((size, size), Image.LANCZOS)
    im.save(dst, "PNG", optimize=True)
    print(f"{dst.relative_to(SITE)}  {im.size}  {dst.stat().st_size // 1024}KB")


def main() -> None:
    # key art
    save_webp(PROMO / "hetero_genesis_cinematic_poster_16x9_v1.png",
              ASSETS / "img/hero-poster.webp", 1600, 82)
    save_webp(PROMO / "hetero_genesis_cinematic_poster_16x9_v2_text.png",
              ASSETS / "img/poster-text.webp", 1600, 82)
    og = Image.open(PROMO / "hetero_genesis_cinematic_poster_16x9_v1.png")
    og = ImageOps.exif_transpose(og)
    if og.width > 1200:
        og = og.resize((1200, round(og.height * 1200 / og.width)), Image.LANCZOS)
    og.convert("RGB").save(ASSETS / "img/og-image.jpg", "JPEG", quality=85)
    print(f"assets/img/og-image.jpg  {og.size}  {(ASSETS / 'img/og-image.jpg').stat().st_size // 1024}KB")

    save_png(ICON, ASSETS / "img/app-icon-180.png", 180)
    save_png(ICON, ASSETS / "img/app-icon-512.png", 512)

    # screenshots
    for name, src in SCREENS.items():
        save_webp(src, ASSETS / "img/screens" / f"{name}.webp", 1280, 80)

    # species previews (10 playable species x 3 stages)
    for src in sorted(SPECIES_SRC.glob("*_stage_*.png")):
        save_webp(src, ASSETS / "species" / (src.stem + ".webp"), 512, 82)

    # biome floors
    for src in sorted(FLOORS.glob("*_floor.png")):
        save_webp(src, ASSETS / "img/biomes" / (src.stem.replace("_floor", "") + ".webp"), 1024, 78)

    # gameplay GIFs — two Steam-approved English-HUD cuts (refresh-20260922)
    # plus two Simplified-Chinese-HUD combat cuts from the 2026-09-24 recording
    gifs = ASSETS / "gif"
    gifs.mkdir(parents=True, exist_ok=True)
    for src in (
        STEAM_GIFS / "graft-sequence-en.gif",
        STEAM_GIFS / "combat-dodge-en.gif",
        ISSUANCE / "local/store-assets/steam/refresh-20260925/deep-sea-lightning.gif",
        ISSUANCE / "local/store-assets/steam/refresh-20260925/boss-encounter.gif",
    ):
        data = src.read_bytes()
        (gifs / src.name).write_bytes(data)
        print(f"assets/gif/{src.name}  {len(data) // 1024}KB")


if __name__ == "__main__":
    main()
