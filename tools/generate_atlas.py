"""Generate public atlas data for the Hetero-Genesis site.

Reads the current gameplay config JSONs and localization packs from the game
repository and writes reduced, public, player-facing subsets to assets/data/.

Usage:
  python tools/generate_atlas.py [--game F:/package/Hetero-Genesis]

Outputs:
  assets/data/game-catalog.json      structural data (species/organs/synergies)
  assets/data/atlas-localization.json per-language display strings
"""

import argparse
import collections
import json
import sys
from datetime import date, datetime
from pathlib import Path

DEFAULT_GAME = Path("F:/package/Hetero-Genesis")
LANG_MAP = {
    "en": "en-US",
    "zh-Hans": "zh-CN",
    "zh-Hant": "zh-TW",
    "ja": "ja-JP",
    "ko": "ko-KR",
}
SPECIES_IMAGE_IDS = {
    "octopus", "sea_snake", "jellyfish", "manta_ray", "hermit_crab",
    "anglerfish", "nautilus", "mantis_shrimp", "lionfish", "electric_eel",
}


def load_json(path: Path):
    with path.open(encoding="utf-8") as fh:
        return json.load(fh)


def items_of(config) -> list:
    """Config files wrap their arrays in an `Items`/`Synergies` key or are bare lists."""
    if isinstance(config, list):
        return config
    if isinstance(config, dict):
        for key in ("Items", "Synergies"):
            if isinstance(config.get(key), list):
                return config[key]
    return []


def loc_entries(game: Path) -> dict:
    packs = {}
    for site_lang, file_lang in LANG_MAP.items():
        path = game / "Assets/Resources/Localization" / f"{file_lang}.json"
        data = load_json(path)
        packs[site_lang] = {e["key"]: e["value"] for e in data.get("entries", [])}
    return packs


def lookup(packs: dict, key: str) -> dict:
    """Return {lang: value} for a localization key, skipping missing langs."""
    out = {}
    for lang, table in packs.items():
        value = table.get(key)
        if value:
            out[lang] = value
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--game", type=Path, default=DEFAULT_GAME)
    args = parser.parse_args()
    game: Path = args.game
    cfg = game / "Assets/Resources/Configs"
    res = game / "Assets/Resources"

    packs = loc_entries(game)

    # ---------- organs ----------
    organ_configs = items_of(load_json(cfg / "organ_configs.json"))
    organs = []
    organ_ids = set()
    for o in organ_configs:
        oid = o.get("Id")
        if not oid or oid in organ_ids:
            continue
        organ_ids.add(oid)
        effects = o.get("Effects") or o.get("ActiveSkillEffects") or []
        effect_types = sorted({e.get("Type") for e in effects if isinstance(e, dict) and e.get("Type")})
        organs.append({
            "id": oid,
            "name": lookup(packs, f"organ.{oid}.name") or {"zh-Hans": o.get("Name", oid)},
            "description": lookup(packs, f"organ.{oid}.description") or {"zh-Hans": o.get("Description", "")},
            "science": {"zh-Hans": o["ScienceIntro"]} if o.get("ScienceIntro") else {},
            "type": o.get("OrganType", ""),
            "mainSlot": o.get("MainSlot", ""),
            "hp": o.get("MaxHP"),
            "tags": [t for t in (o.get("OrganTags") or []) if t],
        })
    organs.sort(key=lambda x: (x["mainSlot"], x["id"]))
    print(f"organs: {len(organs)}")

    # ---------- synergies ----------
    synergy_configs = items_of(load_json(cfg / "synergy_effects.json"))
    synergies = []
    organ_synergy_map = collections.defaultdict(list)
    for s in synergy_configs:
        sid = s.get("Id")
        if not sid:
            continue
        req = [r for r in (s.get("RequiredOrgans") or []) if r in organ_ids]
        for rid in req:
            organ_synergy_map[rid].append(sid)
        trigger = s.get("Trigger") or {}
        effects = s.get("Effects") or []
        effect_types = sorted({e.get("Type") for e in effects if isinstance(e, dict) and e.get("Type")})
        synergies.append({
            "id": sid,
            "name": lookup(packs, f"synergy.{sid}.name") or {"zh-Hans": s.get("Name", sid)},
            "description": lookup(packs, f"synergy.{sid}.description") or {"zh-Hans": s.get("Description", "")},
            "category": s.get("SemanticCategory", ""),
            "trigger": trigger.get("EventType", ""),
            "cooldown": s.get("TriggerCooldown"),
            "requiredOrgans": req,
            "effectTypes": effect_types,
        })
    synergies.sort(key=lambda x: (x["category"], x["id"]))
    for entry in organs:
        entry["synergies"] = sorted(set(organ_synergy_map.get(entry["id"], [])))
    print(f"synergies: {len(synergies)}")

    # ---------- species ----------
    species_configs = items_of(load_json(cfg / "species_configs.json"))
    trait_profiles = items_of(load_json(cfg / "species_trait_profiles.json"))
    trait_by_species = {}
    for t in trait_profiles:
        trait_by_species[str(t.get("Species", "")).upper()] = t

    native_by_species = {}
    spawn_profiles = items_of(load_json(cfg / "species_spawn_profiles.json"))
    for p in spawn_profiles:
        sp = str(p.get("Species", "")).upper()
        mounted = [m.get("OrganId") for m in (p.get("DefaultMountedOrgans") or [])]
        native = [n for n in mounted if n in organ_ids]
        if native:
            native_by_species[sp] = native

    species = []
    for sp in species_configs:
        raw = str(sp.get("Species", "Default"))
        key = raw.upper()
        sid = raw.lower()
        stats = {
            "maxLoad": sp.get("MaxLoad"),
            "moveSpeed": sp.get("MoveSpeed"),
            "maxSpeed": sp.get("MaxSpeed"),
            "dashCharges": sp.get("DashBaseCharges"),
            "dashRegen": sp.get("DashChargeRegenTime"),
            "vision": sp.get("BaseVisionRadius"),
        }
        trait = trait_by_species.get(key, {})
        trait_id = trait.get("TraitId") or trait.get("Id") or ""
        entry = {
            "id": sid,
            "name": lookup(packs, f"species.{key}.name") or {"zh-Hans": sp.get("DisplayName", sid)},
            "description": lookup(packs, f"species.{key}.description") or {"zh-Hans": sp.get("DisplayDescription", "")},
            "primaryTag": lookup(packs, f"species.{key}.primaryTag") or {"zh-Hans": sp.get("DisplayPrimaryTag", "")},
            "secondaryTag": lookup(packs, f"species.{key}.secondaryTag") or {"zh-Hans": sp.get("DisplaySecondaryTag", "")},
            "stats": stats,
            "trait": {
                "id": trait_id,
                "name": lookup(packs, f"trait.{trait_id}.name") if trait_id else {},
            },
            "nativeOrgans": native_by_species.get(key, []),
            "image": f"assets/species/{sid}_stage_3.webp" if sid in SPECIES_IMAGE_IDS else "",
            "stages": [1, 2, 3] if sid in SPECIES_IMAGE_IDS else [],
        }
        species.append(entry)
    species.sort(key=lambda x: (x["id"] == "default", x["id"]))
    print(f"species: {len(species)}")

    catalog = {
        "generatedFrom": "Hetero-Genesis Assets/Resources/Configs public gameplay subset",
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "sourceDate": date.today().isoformat(),
        "counts": {
            "species": len(species),
            "organs": len(organs),
            "synergies": len(synergies),
        },
        "species": species,
        "organs": organs,
        "synergies": synergies,
    }

    # ---------- atlas localization ----------
    categories = sorted({s["category"] for s in synergies if s["category"]})
    slots = sorted({o["mainSlot"] for o in organs if o["mainSlot"]})
    organ_types = sorted({o["type"] for o in organs if o["type"]})
    localization = {
        "generatedFrom": "Hetero-Genesis Assets/Resources/Localization public atlas subset",
        "generatedAt": datetime.now().isoformat(timespec="seconds"),
        "sourceFiles": [f"Assets/Resources/Localization/{v}.json" for v in LANG_MAP.values()],
        "languages": LANG_MAP,
        "facets": {"categories": categories, "slots": slots, "organTypes": organ_types},
        "entries": {lang: {} for lang in LANG_MAP},
    }
    interesting_prefixes = (
        "category.", "damageType.", "trigger.", "event.", "common.", "slot.",
        "organType.", "affinity.",
    )
    for lang, table in packs.items():
        dest = localization["entries"][lang]
        for key, value in table.items():
            if key.startswith(interesting_prefixes):
                dest[key] = value
    covered = 0
    total = 0
    for section in (species, organs, synergies):
        for item in section:
            for field in ("name", "description"):
                langs = item.get(field) or {}
                if isinstance(langs, dict):
                    for lang, value in langs.items():
                        localization["entries"][lang][f"{section_key(section)}.{item['id']}.{field}"] = value

    # coverage report
    for lang in LANG_MAP:
        have = localization["entries"][lang]
        names = [e["name"] for e in species + organs + synergies]
        total = len(names)
        covered = sum(1 for n in names if lang in (n or {}))
        print(f"loc coverage {lang}: {covered}/{total} names")

    out_dir = Path(__file__).resolve().parent.parent / "assets/data"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "game-catalog.json").write_text(
        json.dumps(catalog, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (out_dir / "atlas-localization.json").write_text(
        json.dumps(localization, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"wrote {out_dir/'game-catalog.json'} and atlas-localization.json")
    return 0


def section_key(section):
    if section and "stats" in section[0]:
        return "species"
    if section and "trigger" in section[0]:
        return "synergy"
    return "organ"


if __name__ == "__main__":
    sys.exit(main())
