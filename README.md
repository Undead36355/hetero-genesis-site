# Hetero-Genesis Site

Lightweight static website for Hetero-Genesis / 异构进化 (deep-sea action roguelite, landscape PC build).

Expected GitHub Pages URL:

https://undead36355.github.io/hetero-genesis-site/

This repository is separate from the privacy policy repository. The privacy policy remains at:

https://undead36355.github.io/hetero-genesis-privacy-policy/

## Structure

- `index.html` - static homepage (dark deep-sea theme, five-language selector, English default)
- `assets/img/` - compressed key art, app icons, biome floors, and current-build screenshots (webp)
- `assets/img/og-image.jpg` - social card image
- `assets/gif/` - four gameplay GIFs: the two English-HUD cuts live on the Steam page, plus two Simplified-Chinese-HUD combat cuts (deep-sea lightning, boss encounter) from the 2026-09-24 recording — placeholders until English-UI re-records replace them
- `assets/species/` - the three growth stages of each playable species (webp, from in-game previews)
- `assets/data/game-catalog.json` - public gameplay subset generated from the game config JSON (species, organs, synergies)
- `assets/data/atlas-localization.json` - public atlas localization subset generated from the game localization packs
- `tools/generate_atlas.py` - regenerates both JSON files from `F:\package\Hetero-Genesis`
- `tools/prepare_assets.py` - re-copies and compresses all public media from source material libraries
- `robots.txt` / `sitemap.xml` - basic crawl and GitHub Pages sitemap metadata

## Page content

- Hero uses the official 16:9 cinematic poster (no-text version) with the store tagline, Steam CTA, and content chips (10 start species, 160+ organs, 119 synergies, 24 deep-dive contracts, A0-A10).
- The About section follows the approved Steam store copy (short description + four feature sections, five languages from the 2026-09 store refresh).
- Gameplay section shows the two Steam-approved English-HUD GIFs, two Simplified-Chinese-HUD combat GIFs (2026-09-24 recording, to be replaced with English-UI captures later), and the official key art poster.
- Species section shows the ten playable species with their three in-game growth stages (per-card stage switcher).
- World section shows the three arena biomes (reef shelf, hydrothermal vent, abyss bloom) plus a horizontally scrollable strip of current-build screenshots.
- The atlas section reads `assets/data/game-catalog.json` and `assets/data/atlas-localization.json` to browse/search species, organs, and synergies in the selected site language, with hash deep links such as `#atlas/organs/impact_horn`.
- FAQ states only verified facts: PC (Windows) via Steam, single-player, five languages, run length. No release dates, prices, or unimplemented features are promised.
- The page includes Open Graph, Twitter card, and `VideoGame` JSON-LD metadata using real in-repository assets.

## Regenerating data and assets

```bash
python tools/generate_atlas.py    # refreshes assets/data/*.json from the game repo
python tools/prepare_assets.py    # refreshes assets/img, assets/species, assets/gif
```

## Asset sources

- Key art / poster / app icon: `F:\package\Hetero-Genesis\ArtSources\Promotional`, `ArtSources\AppIcon`
- Species stage previews: `F:\package\Hetero-Genesis\Artifacts\SpeciesPreviews\pc_all_stages`
- Biome floors: `F:\package\Hetero-Genesis\Assets\Resources\Map\Backgrounds`
- Landscape English screenshots (2026-09 batch):
  - `F:\package\game-issuance-and-operation\pending-materials\x-post-landscape-en-30-20260912\screenshots`
  - `F:\package\game-issuance-and-operation\local\store-assets\steam\refresh-20260922\gallery-additions`
- Gameplay GIFs (live on Steam, revision 5): `F:\package\game-issuance-and-operation\local\store-assets\steam\refresh-20260922`
- Store copy in five languages: `F:\package\game-issuance-and-operation\local\store-assets\steam\refresh-20260922\store-copy.json`
- Config and localization sources for the atlas data pipeline: species/organ/synergy config JSON plus the five localization packs under `F:\package\Hetero-Genesis\Assets\Resources`

Do not use the July portrait-era material (vertical screenshots, vertical trailer, draft store copy) — it predates the 2026-09 landscape PC pivot.

The public catalog and atlas localization are reduced gameplay subsets for promotion and browsing. They do not include account, identity, payment, tax, signing, certificate, key, or 2FA material.

No private account, identity, tax, payment, certificate, key, or 2FA material belongs in this repository.

## GitHub Pages

Publish from the `main` branch root. The repository stays well under the 50 MB target (about 13 MB of media).
