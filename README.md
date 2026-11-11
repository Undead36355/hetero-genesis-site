# Tianyang Studio official website

Public site: https://tianyangstudio.cn/
Current GitHub Pages address: https://undead36355.github.io/hetero-genesis-site/

The public domain is served by the existing Tencent Cloud Nginx host. GitHub stores the source and also has a separate Pages mirror. Static HTML, CSS and JavaScript; no build framework or account system. Do not change DNS to deploy this source.

## Studio site · 2026-11-11

- `/` is the redesigned Tianyang Studio portal: a full-bleed ocean hero, warm paper works section, two game entries, studio profile and contact links. Chinese / English, responsive menu, optional water particles and reduced-motion support. Local fonts; no external font CDN.
- `/hetero-genesis.html` is the preserved HG1 landing page (formerly `/index.html`). Its V3 art, media, five-language system and demo atlas are retained. Demo availability is corrected in all five languages, and the demo button opens Steam app 5446350. The full game (5014650) is still upcoming.
- `/hg2.html` is the Hetero-Genesis 2 development page. It uses real screenshots copied from `F:/package/hetero-genesis-2/docs/baseline` and `Logs/`, and milestone text from the project handoff. No release date, price or fabricated progress is published.
- `CNAME` and `.zcodeignore` are unrelated untracked local files and remain untouched. Tencent hosts the public domain; `/privacy/` and existing policy routes must be preserved during deployment. The footer retains 闽ICP备2026043421号-1.
- `sitemap.xml`, `robots.txt`, canonical and OG URLs use `https://tianyangstudio.cn` as the base.

Local preview: run `python -m http.server 8080` in this checkout and open `http://localhost:8080/`. JSON-driven HG1 sections require HTTP, not `file://`.

## V3 refresh · 2026-10-14

- V3 copper-red octopus key art, ocean background and social preview image.
- A 100-second gameplay trailer with manual playback, and eight silent loops covering species, mounting, melee, ranged fire, suction arms, mutation, later waves and boss weakpoints.
- Nine V3 screenshots with thumbnail selection, accessible image dialog and Escape close.
- English, Simplified Chinese, Traditional Chinese, Japanese and Korean, with saved language preference and optional `?lang=schinese` (or the other language keys).
- Demo contents: three default species plus unlockable hermit crab, ten waves, 38 organs and 18 synergies. The free demo is now publicly available (verified with Steam public app details on 2026-11-11). The full game is upcoming.
- Collapsible demo atlas with localized search. It uses the demo allowlist and public descriptions, without dated numeric balance stats or old species artwork.
- Steam wishlist CTAs carry source-specific UTM parameters. Steam community, public contact email, X and privacy policy links remain available.

The gameplay clips show the PC game, not an assertion that every item in the footage is obtainable in the demo. The page states this distinction. No final-game release date, price, mobile launch or unverified platform feature is promised.

## Files

- `index.html`, `assets/studio/portal.css`, `assets/studio/portal.js`: studio portal and shared shell.
- `hetero-genesis.html`, `assets/site.css`, `assets/site.js`: HG1 page, five-language UI and interactions.
- `hg2.html`, `assets/hg2/`: HG2 development page with real screenshots and a click-to-enlarge viewer.
- `assets/v3/`: selected public images, web video encodes, localized V3 copy and demo atlas. `manifest.json` records sources and sizes.
- `tools/prepare_v3_assets.py`: export approved media from the issuance workspace; does not modify or run the game project.
- `local/`: ignored browser-review screenshots and results. Not deployed or committed.
- Legacy image/catalog files remain available for recovery; the homepage no longer links the old GIFs or July/September promotional layout. The older preparation tools are historical, not the V3 export entry point.

## Media preparation

Run `python tools/prepare_v3_assets.py` in this checkout when the approved inputs change. The source is `F:/package/game-issuance-and-operation/local/store-assets/steam/refresh-20261011-v3`; the demo allowlist is read from `F:/package/Hetero-Genesis/Assets/Resources/Configs/demo_content_config.json`.

Trailer is H.264 CRF26/AAC; loops H.264 CRF25 without audio. No changes to source speed, shot order or duration. All files are below 50 MB. Clips load/play only when in view, pause outside the viewport or on a hidden tab, and respect reduced-motion preferences. The trailer never autoplays.

## Publishing

Review the changed desktop/mobile layouts, language switching and media interactions, then commit intended files and push to `origin/main`. Stage a new release on the existing Tencent Nginx host, preserving policy routes and retaining the previous release for rollback. Verify the server configuration before reload, then verify the literal public domain and its policy routes. A successful GitHub push alone does not deploy Tencent. Never copy `.git/`, local/private files or tools into the served directory.

Do not commit account credentials, identity/payment materials, raw desktop recordings, save files, logs or private publishing records. Preserve unrelated user edits.
