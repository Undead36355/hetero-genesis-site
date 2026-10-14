"""Publish only approved V3 assets, with web-sized video encodes."""
from pathlib import Path
import json, shutil, subprocess
import imageio_ffmpeg

SITE = Path(__file__).resolve().parent.parent
V3 = Path('F:/package/game-issuance-and-operation/local/store-assets/steam/refresh-20261011-v3')
GAME = Path('F:/package/Hetero-Genesis')
out = SITE / 'assets/v3'
out.mkdir(exist_ok=True)
for name in ['main_capsule_1232x706.png','library_hero_3840x1240.jpg','library_logo_1280x720.png']:
    shutil.copy2(V3/'capsules'/name,out/name)
shutil.copy2(V3/'video/trailer-poster-1920x1080.jpg',out/'trailer-poster.jpg')
for p in sorted((V3/'screenshots').glob('*.png')):
    shutil.copy2(p,out/p.name)
ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
sources = [V3/'video/hetero-genesis-trailer-v3-100s.mp4', *sorted((V3/'details').glob('*.mp4'))]
for source in sources:
    target = out / ('trailer.mp4' if source.parent.name=='video' else source.name)
    if target.exists() and target.stat().st_size<50_000_000: continue
    quality='26' if source.parent.name=='video' else '25'
    command=[ffmpeg,'-hide_banner','-loglevel','error','-y','-i',str(source),'-c:v','libx264','-preset','medium','-crf',quality,'-pix_fmt','yuv420p','-movflags','+faststart']
    if source.parent.name=='video': command+=['-c:a','aac','-b:a','160k']
    else: command+=['-an']
    subprocess.run([*command,str(target)],check=True)
    print(target.name, target.stat().st_size,flush=True)
for source in sources[1:]:
    poster=out/(source.stem+'.jpg')
    if not poster.exists():
        subprocess.run([ffmpeg,'-hide_banner','-loglevel','error','-y','-ss','1','-i',str(out/source.name),'-frames:v','1','-q:v','3',str(poster)],check=True)
shutil.copy2(V3/'copy/store-copy.json',out/'store-copy.json')
shutil.copy2(V3/'copy/gif-descriptions-5languages.json',out/'media-copy.json')
config=json.loads((GAME/'Assets/Resources/Configs/demo_content_config.json').read_text(encoding='utf-8-sig'))
catalog=json.loads((SITE/'assets/data/game-catalog.json').read_text(encoding='utf-8'))
locale=json.loads((SITE/'assets/data/atlas-localization.json').read_text(encoding='utf-8'))
current_locale={}
for lang,filename in {'en':'en-US','zh-Hans':'zh-CN','zh-Hant':'zh-TW','ja':'ja-JP','ko':'ko-KR'}.items():
    pack=json.loads((GAME/f'Assets/Resources/Localization/{filename}.json').read_text(encoding='utf-8-sig'))
    current_locale[lang]={entry['key']:entry['value'] for entry in pack['entries']}
organ_configs={item['Id']:item for item in json.loads((GAME/'Assets/Resources/Configs/organ_configs.json').read_text(encoding='utf-8-sig'))['Items']}
allowed={'species':['octopus','jellyfish','sea_snake','hermit_crab'],'organs':config['Organs'],'synergies':config['Synergies']}
demo={key:[item for item in catalog[key] if item['id'] in ids] for key,ids in allowed.items()}
for key,ids in allowed.items(): assert len(demo[key])==len(ids),(key,len(demo[key]))
for category,items in demo.items():
    prefix={'species':'species','organs':'organ','synergies':'synergy'}[category]
    for item in items:
        for lang,strings in locale['entries'].items():
            for field in ['name','description']:
                value=strings.get(f'{prefix}.{item["id"]}.{field}')
                value=current_locale[lang].get(f'{prefix}.{item["id"]}.{field}',value)
                if category=='organs' and lang=='zh-Hans':
                    value=organ_configs[item['id']].get({'name':'Name','description':'Description'}[field],value)
                if value: item.setdefault(field,{})[lang]=value
        # Public explorer avoids dated balance statistics and internal dependency tags.
        for field in list(item):
            if field not in ['id','name','description']: del item[field]
demo['source']='Demo content selection 2026-10-14; current localization and organ descriptions, with existing public species/synergy summaries'
(out/'demo-atlas.json').write_text(json.dumps(demo,ensure_ascii=False),encoding='utf-8')
manifest={'version':'v3','date':'2026-10-14','source':'Steam refresh-20261011-v3','trailer_seconds':100,'source_motion_unchanged':True,'web_encoding':'H.264 CRF26 trailer / CRF25 loops; no speed changes or interpolation','demo_announcement':'planned 2026-11-06T02:00:00+08:00; not available yet','files':[{'path':p.name,'bytes':p.stat().st_size} for p in sorted(out.iterdir()) if p.is_file() and p.name!='manifest.json']}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
assert all(p.stat().st_size<50_000_000 for p in out.iterdir() if p.is_file())
print('V3 web assets complete',flush=True)
