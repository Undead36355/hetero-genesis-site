'use strict';
(() => {
  const root=document.documentElement, language=document.getElementById('portalLanguage');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  let motion=reduce.matches?'off':'on';
  try{motion=localStorage.getItem('tys-motion')||motion;}catch{}
  root.dataset.motion=motion;
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
  const reveals=[...document.querySelectorAll('.reveal')];
  if('IntersectionObserver' in window&&motion!=='off'){
    root.classList.add('motion-ready');
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}}),{threshold:.08});
    reveals.forEach(el=>io.observe(el));
  }
  const toggle=document.getElementById('motionToggle');
  function updateToggle(){toggle?.setAttribute('aria-pressed',String(root.dataset.motion==='off'));}
  updateToggle();
  toggle?.addEventListener('click',()=>{root.dataset.motion=root.dataset.motion==='off'?'on':'off';try{localStorage.setItem('tys-motion',root.dataset.motion);}catch{}updateToggle();restart();});
  reduce.addEventListener('change',e=>{if(e.matches){root.dataset.motion='off';updateToggle();}restart();});
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
  document.addEventListener('visibilitychange',()=>{if(document.hidden)video?.pause();restart();});
  const canvas=document.querySelector('.current-canvas');
  let raf=0,ctx=null,particles=[],view=true,width=0,height=0,last=0;
  const pointer={x:-1000,y:-1000};
  function resize(){if(!canvas)return;const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx=canvas.getContext('2d');ctx?.setTransform(dpr,0,0,dpr,0,0);particles=Array.from({length:width<700?20:44},()=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.5+.4,s:Math.random()*.18+.08,a:Math.random()*.35+.12}));}
  function tick(time){
    raf=0;if(!ctx||root.dataset.motion==='off'||!view||document.hidden)return;
    if(time-last>32){last=time;ctx.clearRect(0,0,width,height);for(const p of particles){p.y-=p.s;p.x+=Math.sin(time*.0002+p.y*.01)*.12;const dx=p.x-pointer.x,dy=p.y-pointer.y,d=Math.hypot(dx,dy);if(d>0&&d<110){p.x+=dx/d*.25;p.y+=dy/d*.25;}if(p.y<-5){p.y=height+5;p.x=Math.random()*width;}ctx.beginPath();ctx.fillStyle=`rgba(190,230,218,${p.a})`;ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}}
    raf=requestAnimationFrame(tick);
  }
  function restart(){if(raf)cancelAnimationFrame(raf);raf=0;if(canvas&&root.dataset.motion!=='off'&&view&&!document.hidden)raf=requestAnimationFrame(tick);}
  if(canvas){resize();addEventListener('resize',()=>{resize();restart();});canvas.parentElement.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointer.x=e.clientX-r.left;pointer.y=e.clientY-r.top;},{passive:true});canvas.parentElement.addEventListener('pointerleave',()=>{pointer.x=-1000;pointer.y=-1000;});if('IntersectionObserver' in window)new IntersectionObserver(es=>{view=es[0].isIntersecting;restart();}).observe(canvas);restart();}
})();
