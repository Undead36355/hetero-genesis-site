# Hetero-Genesis Site

Lightweight static website for Hetero-Genesis / 异构进化.

Expected GitHub Pages URL:

https://undead36355.github.io/hetero-genesis-site/

This repository is separate from the privacy policy repository. The privacy policy remains at:

https://undead36355.github.io/hetero-genesis-privacy-policy/

## Structure

- `index.html` - static homepage
- `assets/` - compressed public store images and current-build screenshots
- `assets/video/` - gameplay introduction video for the homepage
- `assets/data/game-catalog.json` - public gameplay catalog generated from selected current-build config JSON
- `assets/data/atlas-localization.json` - public atlas localization subset generated from the game localization packs

The homepage includes a top-right language selector for English, Simplified Chinese, Traditional Chinese, Japanese, and Korean.
It uses the current mantis-shrimp gameplay introduction video as the first-screen hero, followed by a richer combat rhythm section and expanded gameplay copy.
The gameplay section now summarizes five player-facing build routes adapted from the internal quick-start guide: ranged venom kiting, heavy melee regeneration, field control, camouflage first strike, and symbiotic support.
The combat system section now expands the body/damage model into dual health, damage context, defense layers, status pressure, synergy triggers, wave roles, movement handling, and feedback readability.
The atlas section reads `assets/data/game-catalog.json` and `assets/data/atlas-localization.json` to browse/search current-build species, organs, synergies, waves, and enemies in the selected site language. Detail panels include cross-links, so visitors can jump from species to organs, organs to synergies, synergies back to required organs, waves to enemies, and enemies to appearances or damage organs.

## Asset Sources

The site only copies public-facing store material candidates:

- `F:\package\game-issuance-and-operation\local\store-assets\steam\draft-v1`
- `F:\package\game-issuance-and-operation\local\store-assets\google-play\draft-v1`
- `F:\package\game-issuance-and-operation\local\store-assets\screenshots\current-build\dynamic-candidates\20260704_01`
- `F:\package\game-issuance-and-operation\local\store-assets\trailers\current-build\steam_trailer_recut_v6_user_source\hetero-genesis_mantis-shrimp_tactical-cut_v6_vertical.mp4`
- `F:\package\Hetero-Genesis\docs\_流派教学快速上手.html` for player-facing build route summaries
- `F:\package\Hetero-Genesis\docs\_肉鸽波次敌人速查表（实时配置版）.html`
- `F:\package\Hetero-Genesis\docs\_物种器官协同速查表（实时配置版）.html`
- `F:\package\Hetero-Genesis\docs\_战斗系统设计说明（高级策划向）.html`
- `F:\package\Hetero-Genesis\Assets\Resources\Configs\species_configs.json`
- `F:\package\Hetero-Genesis\Assets\Resources\Configs\species_trait_profiles.json`
- `F:\package\Hetero-Genesis\Assets\Resources\Configs\species_spawn_profiles.json`
- `F:\package\Hetero-Genesis\Assets\Resources\Configs\organ_configs.json`
- `F:\package\Hetero-Genesis\Assets\Resources\Configs\synergy_effects.json`
- `F:\package\Hetero-Genesis\Assets\Resources\Configs\wave_configs.json`
- `F:\package\Hetero-Genesis\Assets\Resources\Localization\zh-CN.json`
- `F:\package\Hetero-Genesis\Assets\Resources\Localization\zh-TW.json`
- `F:\package\Hetero-Genesis\Assets\Resources\Localization\en-US.json`
- `F:\package\Hetero-Genesis\Assets\Resources\Localization\ja-JP.json`
- `F:\package\Hetero-Genesis\Assets\Resources\Localization\ko-KR.json`

The gameplay video is based on the user-approved cut and compressed for GitHub Pages stability while keeping 1080x1920, about 60fps, and the original cut length. The site copy is under 50 MB.

The public catalog and atlas localization are reduced gameplay subsets for promotion and browsing. They do not include account, identity, payment, tax, signing, certificate, key, or 2FA material.

No private account, identity, tax, payment, certificate, key, or 2FA material belongs in this repository.

## GitHub Pages

Publish from the `main` branch root.
