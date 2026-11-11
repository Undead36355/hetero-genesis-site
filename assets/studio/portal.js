'use strict';
(() => {
  const root=document.documentElement, language=document.getElementById('portalLanguage');
  function setLanguage(lang){
    root.dataset.lang=lang==='en'?'en':'zh';root.lang=lang==='en'?'en':'zh-CN';
    const title=root.dataset['title'+(lang==='en'?'En':'Zh')];if(title)document.title=title;
    if(language)language.setAttribute('aria-label',lang==='en'?'切换为中文':'Switch to English');
  }
  setLanguage(root.dataset.lang||'zh');
  language?.addEventListener('click',()=>{const lang=root.dataset.lang==='en'?'zh':'en';setLanguage(lang);try{localStorage.setItem('tys-language',lang);}catch{}});
  const header=document.querySelector('.masthead'),menu=document.querySelector('.mobile-nav');
  menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));header.classList.toggle('nav-open',open);});
  header?.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>{header.classList.remove('nav-open');menu?.setAttribute('aria-expanded','false');}));
  const dialog=document.getElementById('mediaDialog'),close=dialog?.querySelector('.dialog-close'),dialogImage=dialog?.querySelector('img'),video=dialog?.querySelector('video');
  let opener=null;
  function openMedia(el){
    if(!dialog||!dialog.showModal)return;
    opener=el;
    const source=el.dataset.gallery;
    if(source&&dialogImage){dialogImage.src=source;dialogImage.alt=el.getAttribute('aria-label')||el.querySelector('img')?.alt||'';dialogImage.hidden=false;if(video)video.hidden=true;}
    else if(video){video.hidden=false;if(dialogImage)dialogImage.hidden=true;if(!video.getAttribute('src')){video.preload='metadata';video.src=el.dataset.trailer;video.load();}}
    dialog.showModal();document.body.classList.add('modal-open');close?.focus();
  }
  document.querySelectorAll('[data-trailer],[data-gallery]').forEach(el=>el.addEventListener('click',()=>openMedia(el)));
  close?.addEventListener('click',()=>dialog.close());
  dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog?.addEventListener('close',()=>{video?.pause();document.body.classList.remove('modal-open');opener?.focus();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video?.pause();});
})();
