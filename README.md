# Hetero-Genesis official website

Public site: https://undead36355.github.io/hetero-genesis-site/

Published from the `main` branch root with GitHub Pages. Static HTML, CSS and JavaScript; no build framework or account system.

## V3 refresh · 2026-10-14

- V3 copper-red octopus key art, ocean background and social preview image.
- A 100-second gameplay trailer with manual playback, and eight silent loops covering species, mounting, melee, ranged fire, suction arms, mutation, later waves and boss weakpoints.
- Nine V3 screenshots with thumbnail selection, accessible image dialog and Escape close.
- English, Simplified Chinese, Traditional Chinese, Japanese and Korean, with saved language preference and optional `?lang=schinese` (or the other language keys).
- Demo contents: three default species plus unlockable hermit crab, ten waves, 38 organs and 18 synergies. Public release is **planned**, not marked playable: November 5, 2026 at 10 AM PST / November 6 at 02:00 UTC+8.
- Collapsible demo atlas with localized search. It uses the demo allowlist and public descriptions, without dated numeric balance stats or old species artwork.
- Steam wishlist CTAs carry source-specific UTM parameters. Steam community, public contact email, X and privacy policy links remain available.

The gameplay clips show the PC game, not an assertion that every item in the footage is obtainable in the demo. The page states this distinction. No final-game release date, price, mobile launch or unverified platform feature is promised.

## Files

- `index.html`, `assets/site.css`, `assets/site.js`: page, styling, five-language UI and interactions.
- `assets/v3/`: selected public images, web video encodes, localized V3 copy and demo atlas. `manifest.json` records sources and sizes.
- `tools/prepare_v3_assets.py`: export approved media from the issuance workspace; does not modify or run the game project.
- `local/`: ignored browser-review screenshots and results. Not deployed or committed.
- Legacy image/catalog files remain available for recovery; the homepage no longer links the old GIFs or July/September promotional layout. The older preparation tools are historical, not the V3 export entry point.

## Media preparation

Run `python tools/prepare_v3_assets.py` in this checkout when the approved inputs change. The source is `F:/package/game-issuance-and-operation/local/store-assets/steam/refresh-20261011-v3`; the demo allowlist is read from `F:/package/Hetero-Genesis/Assets/Resources/Configs/demo_content_config.json`.

Trailer is H.264 CRF26/AAC; loops H.264 CRF25 without audio. No changes to source speed, shot order or duration. All files are below 50 MB. Clips load/play only when in view, pause outside the viewport or on a hidden tab, and respect reduced-motion preferences. The trailer never autoplays.

## Publishing

Review desktop/mobile layout, language switching, gallery, demo atlas and actual video playback, then commit the intended files and push to `origin/main`. Confirm the resulting GitHub Pages deployment and public HTML/assets. Updating the launch date does not release the demo: change availability only after the Steam release is actually confirmed.

Do not commit account credentials, identity/payment materials, raw desktop recordings, save files, logs or private publishing records. Preserve unrelated user edits.
