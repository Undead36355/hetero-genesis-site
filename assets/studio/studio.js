'use strict';
(function(){
  const root=document.documentElement;
  const key='tys-language';
  const button=document.querySelector('#langSwitch');
  const titles={en:root.dataset.titleEn||document.title,zh:root.dataset.titleZh||document.title};
  const descriptions={en:root.dataset.descEn||'',zh:root.dataset.descZh||''};
  const meta=document.querySelector('meta[name="description"]');
  const label={en:'Switch to Chinese',zh:'Switch to English'};

  function apply(lang){
    const next=lang==='zh'?'zh':'en';
    root.dataset.lang=next;
    root.lang=next==='zh'?'zh-CN':'en';
    document.title=titles[next];
    if(meta&&descriptions[next])meta.content=descriptions[next];
    if(button)button.setAttribute('aria-label',label[next]);
  }

  apply(root.dataset.lang==='zh'?'zh':'en');

  if(button){
    button.addEventListener('click',()=>{
      const next=root.dataset.lang==='zh'?'en':'zh';
      apply(next);
      try{localStorage.setItem(key,next);}catch{}
    });
  }

  document.querySelectorAll('[data-shots]').forEach(group=>{
    const main=group.querySelector('[data-shot-main]');
    const buttons=[...group.querySelectorAll('[data-shot]')];
    buttons.forEach(button=>{
      button.addEventListener('click',()=>{
        if(!main)return;
        const source=button.dataset.shot;
        if(!source)return;
        main.src=source;
        main.alt=button.querySelector('img')?.alt||main.alt;
        buttons.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
      });
    });
  });

  document.querySelectorAll('.work').forEach(card=>{
    const link=card.querySelector('.work-title');
    if(!link)return;
    card.addEventListener('click',event=>{
      if(event.target.closest('a,button'))return;
      link.click();
    });
  });

  /* ---------- studio home: reveal, parallax, pointer light, transition ---------- */
  if(document.body.dataset.page==='studio'){
    const fine=window.matchMedia('(hover:hover) and (pointer:fine)');
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
    const wide=window.matchMedia('(min-width:981px)');

    /* scroll-triggered entrance */
    const reveal=[...document.querySelectorAll('[data-reveal]')];
    if(reveal.length){
      if('IntersectionObserver' in window&&!reduce.matches){
        root.classList.add('motion');
        const io=new IntersectionObserver(entries=>{
          entries.forEach(entry=>{
            if(!entry.isIntersecting)return;
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          });
        },{rootMargin:'0px 0px -10% 0px',threshold:.1});
        reveal.forEach(el=>io.observe(el));
      }else{
        reveal.forEach(el=>el.classList.add('is-in'));
      }
    }

    /* word-level cascade for section copy (runs before the reveal observer) */
    if(!reduce.matches&&'IntersectionObserver' in window){
      [...document.querySelectorAll('.section-head h2,.section-head > p,.work h3,.studio-copy h2,.studio-copy p:not(.kicker),.contact h2,.contact p:not(.kicker)')].forEach(splitText);
    }

    function splitText(el){
      const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null);
      const nodes=[];
      while(walker.nextNode())nodes.push(walker.currentNode);
      let index=0;
      nodes.forEach(node=>{
        const value=node.nodeValue;
        if(!value||!value.trim())return;
        const frag=document.createDocumentFragment();
        value.split(/(\s+)/).forEach(part=>{
          if(!part)return;
          if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(part));return;}
          const chunks=/[\u4e00-\u9fff]/.test(part)?[...part]:[part];
          chunks.forEach(chunk=>{
            if(!chunk)return;
            const wrap=document.createElement('span');
            wrap.className='tw';
            const inner=document.createElement('i');
            inner.textContent=chunk;
            inner.style.setProperty('--td',(Math.min(index,24)*14)+'ms');
            index++;
            wrap.appendChild(inner);
            frag.appendChild(wrap);
          });
        });
        node.parentNode.replaceChild(frag,node);
      });
    }

    /* progress bar, header state, plate depth, work camera */
    const bar=document.querySelector('.scroll-progress i');
    const header=document.querySelector('.site-header');
    const hero=document.querySelector('.hero');
    const plates=[...document.querySelectorAll('.plate')];
    const frames=[...document.querySelectorAll('.work .frame')];
    const wash=document.querySelector('.section-wash');
    let scrollTick=false;

    function onScroll(){
      scrollTick=false;
      const max=document.documentElement.scrollHeight-window.innerHeight;
      if(bar&&max>0){
        bar.style.transform='scaleX('+Math.min(1,Math.max(0,window.scrollY/max)).toFixed(3)+')';
      }
      if(header)header.classList.toggle('is-scrolled',window.scrollY>24);
      if(frames.length){
        if(!fine.matches||!wide.matches||reduce.matches){
          frames.forEach(frame=>frame.style.removeProperty('--cs'));
        }else{
          const vh=window.innerHeight||1;
          frames.forEach(frame=>{
            const rect=frame.getBoundingClientRect();
            const center=rect.top+rect.height/2;
            const p=Math.min(1,Math.max(0,1-Math.abs(center-vh*0.5)/(vh*0.9)));
            frame.style.setProperty('--cs',(1.12-0.1*p).toFixed(3));
          });
        }
      }
      if(!hero||!plates.length)return;
      if(wash)wash.dataset.tone=hero.getBoundingClientRect().bottom>window.innerHeight*0.55?'hero':wash.dataset.tone||'';
      if(!fine.matches||!wide.matches||reduce.matches){
        plates.forEach(plate=>plate.style.removeProperty('--py'));
        return;
      }
      const rel=Math.max(-1,Math.min(1,-hero.getBoundingClientRect().top/(window.innerHeight||1)));
      if(plates[0])plates[0].style.setProperty('--py',(rel*20).toFixed(1)+'px');
      if(plates[1])plates[1].style.setProperty('--py',(rel*-14).toFixed(1)+'px');
    }
    function queueScroll(){
      if(scrollTick)return;
      scrollTick=true;
      window.requestAnimationFrame(onScroll);
    }
    window.addEventListener('scroll',queueScroll,{passive:true});
    window.addEventListener('resize',queueScroll);
    onScroll();

    /* pointer lamp */
    const lamp=document.querySelector('.cursor-lamp');
    if(lamp&&fine.matches&&!reduce.matches){
      let tx=0,ty=0,x=0,y=0,frame=null,seen=false;
      function follow(){
        x+=(tx-x)*.1;
        y+=(ty-y)*.1;
        lamp.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)';
        frame=(Math.abs(tx-x)>0.6||Math.abs(ty-y)>0.6)?window.requestAnimationFrame(follow):null;
      }
      window.addEventListener('pointermove',event=>{
        if(event.pointerType&&event.pointerType!=='mouse')return;
        tx=event.clientX;ty=event.clientY;
        if(!seen){x=tx;y=ty;seen=true;lamp.classList.add('is-live');}
        if(!frame)frame=window.requestAnimationFrame(follow);
      },{passive:true});
      root.addEventListener('mouseleave',()=>lamp.classList.remove('is-live'));
      root.addEventListener('mouseenter',()=>{if(seen)lamp.classList.add('is-live');});
    }

    /* magnetic controls (nav, language switch, work and contact links) */
    if(fine.matches&&!reduce.matches){
      const magnets=[...document.querySelectorAll('.site-nav a,#langSwitch,.work-link,.contact-links a')];
      if(magnets.length){
        let magnetFrame=0;
        const states=magnets.map(el=>({el,tx:0,ty:0,x:0,y:0}));
        function magnetTick(){
          magnetFrame=0;
          let more=false;
          states.forEach(state=>{
            state.x+=(state.tx-state.x)*.16;
            state.y+=(state.ty-state.y)*.16;
            state.el.style.setProperty('--mx',state.x.toFixed(1)+'px');
            state.el.style.setProperty('--my',state.y.toFixed(1)+'px');
            if(Math.abs(state.tx-state.x)>.15||Math.abs(state.ty-state.y)>.15)more=true;
          });
          if(more)magnetFrame=window.requestAnimationFrame(magnetTick);
        }
        states.forEach(state=>{
          state.el.addEventListener('pointermove',event=>{
            const rect=state.el.getBoundingClientRect();
            const dx=(event.clientX-(rect.left+rect.width/2))/Math.max(rect.width,1);
            const dy=(event.clientY-(rect.top+rect.height/2))/Math.max(rect.height,1);
            state.tx=Math.max(-7,Math.min(7,dx*16));
            state.ty=Math.max(-5,Math.min(5,dy*12));
            if(!magnetFrame)magnetFrame=window.requestAnimationFrame(magnetTick);
          });
          state.el.addEventListener('pointerleave',()=>{
            state.tx=0;
            state.ty=0;
            if(!magnetFrame)magnetFrame=window.requestAnimationFrame(magnetTick);
          });
        });
      }
    }

    /* custom brass cursor + suspended water dust (desktop fine pointers only) */
    const pointer={x:0,y:0,active:false,lastMove:0};

    const dust=(!fine.matches||reduce.matches)?null:(function(){
      const canvas=document.createElement('canvas');
      canvas.className='dust-canvas';
      canvas.setAttribute('aria-hidden','true');
      document.body.appendChild(canvas);
      const ctx=canvas.getContext('2d',{alpha:true});
      if(!ctx){canvas.remove();return null;}
      const CAP=90,MIN=16,REPEL=110;
      let w=0,h=0,dpr=1,items=[],raf=0,running=false,last=0,flow=0,flowTarget=0,scrollPrev=0,idle=performance.now(),resizeTimer=0,destroyed=false;

      function make(){
        const roll=Math.random();
        let color='214,226,219',alpha=.18+Math.random()*.24,size=.7+Math.random()*.8;
        if(roll>.85){color='199,161,92';alpha=.10+Math.random()*.16;size=.6+Math.random()*.7;}
        else if(roll>.55){color='143,183,173';alpha=.14+Math.random()*.2;size=.8+Math.random()*.9;}
        return {x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.08,vy:(Math.random()-.5)*.08,r:size,a:alpha,c:color,ph:Math.random()*6.283,pushX:0,pushY:0};
      }

      function resize(){
        w=window.innerWidth||1;h=window.innerHeight||1;
        dpr=Math.min(window.devicePixelRatio||1,1.5);
        canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
        ctx.setTransform(dpr,0,0,dpr,0,0);
        const target=Math.min(CAP,Math.max(MIN,Math.round(w*h/24000)));
        items=[];
        for(let i=0;i<target;i++)items.push(make());
        idle=performance.now();
      }

      function step(now){
        raf=window.requestAnimationFrame(step);
        const gap=(now-Math.max(idle,pointer.lastMove))>9000?66:33;
        if(now-last<gap)return;
        const dt=Math.min(64,Math.max(16,now-last));
        last=now;
        flow+=(flowTarget-flow)*.12;
        flowTarget*=.9;
        const t=now/1000;
        const mx=pointer.active?pointer.x:-1e5;
        const my=pointer.active?pointer.y:-1e5;
        ctx.clearRect(0,0,w,h);
        for(const p of items){
          p.x+=p.vx*(dt/33)+Math.sin(t*.32+p.ph)*.11*(dt/33);
          p.y+=p.vy*(dt/33)+flow*.55*(dt/33);
          const dx=p.x-mx,dy=p.y-my,d2=dx*dx+dy*dy;
          if(d2<REPEL*REPEL){
            const d=Math.sqrt(d2)||1;
            const force=(1-d/REPEL)*.55;
            p.pushX+=dx/d*force;p.pushY+=dy/d*force;
          }
          p.x+=p.pushX*(dt/33);p.y+=p.pushY*(dt/33);
          p.pushX*=.93;p.pushY*=.93;
          if(p.x<-16)p.x=w+16;else if(p.x>w+16)p.x=-16;
          if(p.y<-16)p.y=h+16;else if(p.y>h+16)p.y=-16;
          ctx.globalAlpha=p.a;
          ctx.fillStyle='rgb('+p.c+')';
          ctx.beginPath();
          ctx.arc(p.x,p.y,p.r,0,6.283);
          ctx.fill();
        }
        ctx.globalAlpha=1;
      }

      function start(){
        if(destroyed||running||document.hidden)return;
        running=true;last=0;
        raf=window.requestAnimationFrame(step);
        canvas.classList.add('is-live');
      }
      function stop(){
        running=false;
        if(raf)window.cancelAnimationFrame(raf);
        raf=0;
      }

      window.addEventListener('scroll',()=>{
        const now=window.scrollY||0;
        flowTarget=Math.max(-7,Math.min(7,(now-scrollPrev)*.32));
        scrollPrev=now;
        idle=performance.now();
      },{passive:true});
      window.addEventListener('resize',()=>{
        window.clearTimeout(resizeTimer);
        resizeTimer=window.setTimeout(()=>{if(canvas.isConnected)resize();},160);
      });
      document.addEventListener('visibilitychange',()=>{document.hidden?stop():start();});
      window.addEventListener('blur',stop);
      window.addEventListener('focus',()=>{if(!document.hidden)start();});

      resize();start();
      return {destroy(){destroyed=true;stop();window.clearTimeout(resizeTimer);canvas.remove();}};
    })();

    if(fine.matches&&!reduce.matches){
      const cursorLayer=document.createElement('div');
      cursorLayer.className='cursor-layer';
      cursorLayer.setAttribute('aria-hidden','true');
      cursorLayer.innerHTML='<div class="cursor-anchor"><span class="cursor-cross"></span><span class="cursor-ring"></span><span class="cursor-dot"></span></div>';
      document.body.appendChild(cursorLayer);
      const cursorAnchor=cursorLayer.querySelector('.cursor-anchor');
      const hoverSelector='a,button,.work,[role="button"],summary,input,textarea,select';
      let cursorOn=true,cursorSeen=false,cursorHover=null;

      function hideCursor(){
        cursorHover=null;
        cursorLayer.classList.remove('is-live','is-hover','is-down');
        root.classList.remove('cursor-custom');
      }
      function disableCursor(){
        cursorOn=false;
        hideCursor();
        if(cursorLayer.isConnected)cursorLayer.remove();
      }

      window.addEventListener('pointermove',event=>{
        if(!cursorOn)return;
        if(event.pointerType&&event.pointerType!=='mouse'){hideCursor();return;}
        pointer.x=event.clientX;pointer.y=event.clientY;pointer.active=true;pointer.lastMove=performance.now();
        cursorAnchor.style.transform='translate3d('+event.clientX.toFixed(1)+'px,'+event.clientY.toFixed(1)+'px,0)';
        const next=event.target&&event.target.closest?event.target.closest(hoverSelector):null;
        if(next!==cursorHover){
          cursorHover=next;
          cursorLayer.classList.toggle('is-hover',!!next);
        }
        if(!cursorSeen){
          cursorSeen=true;
          cursorLayer.classList.add('is-live');
          root.classList.add('cursor-custom');
        }
      },{passive:true});

      window.addEventListener('pointerdown',event=>{
        if(!cursorOn||event.button!==0)return;
        if(event.pointerType&&event.pointerType!=='mouse')return;
        cursorLayer.classList.add('is-down');
        while(cursorLayer.querySelectorAll('.cursor-ripple').length>4)cursorLayer.querySelector('.cursor-ripple').remove();
        const ripple=document.createElement('span');
        ripple.className='cursor-ripple';
        ripple.style.setProperty('--rx',event.clientX+'px');
        ripple.style.setProperty('--ry',event.clientY+'px');
        cursorLayer.appendChild(ripple);
        ripple.addEventListener('animationend',()=>ripple.remove());
      },{passive:true});
      window.addEventListener('pointerup',()=>cursorLayer.classList.remove('is-down'),{passive:true});
      window.addEventListener('pointercancel',()=>cursorLayer.classList.remove('is-down'),{passive:true});

      root.addEventListener('mouseleave',()=>{pointer.active=false;hideCursor();});
      window.addEventListener('blur',()=>{pointer.active=false;hideCursor();});

      function onPointerMedia(){
        if(reduce.matches||!fine.matches){
          if(cursorOn)disableCursor();
          if(dust)dust.destroy();
        }
      }
      try{
        reduce.addEventListener('change',onPointerMedia);
        fine.addEventListener('change',onPointerMedia);
      }catch(error){}
    }

    /* work card spotlight + inner frame parallax */
    document.querySelectorAll('.work').forEach(card=>{
      const frameBox=card.querySelector('.frame');
      card.addEventListener('pointermove',event=>{
        if(!fine.matches||reduce.matches||!frameBox)return;
        const rect=frameBox.getBoundingClientRect();
        if(!rect.width||!rect.height)return;
        const px=(event.clientX-rect.left)/rect.width;
        const py=(event.clientY-rect.top)/rect.height;
        frameBox.style.setProperty('--fx',(px*100).toFixed(1)+'%');
        frameBox.style.setProperty('--fy',(py*100).toFixed(1)+'%');
        frameBox.style.setProperty('--ix',((px-.5)*-9).toFixed(1)+'px');
        frameBox.style.setProperty('--iy',((py-.5)*-7).toFixed(1)+'px');
      });
      card.addEventListener('pointerleave',()=>{
        if(!frameBox)return;
        ['--fx','--fy','--ix','--iy'].forEach(name=>frameBox.style.removeProperty(name));
      });
    });

    /* section index rail */
    const railLinks=[...document.querySelectorAll('.section-rail a')];
    if(railLinks.length&&'IntersectionObserver' in window){
      const targets=railLinks.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean);
      const railObserver=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting)return;
          const target='#'+entry.target.id;
          railLinks.forEach(link=>link.classList.toggle('is-active',link.getAttribute('href')===target));
          if(wash)wash.dataset.tone=entry.target.id;
        });
      },{rootMargin:'-42% 0px -52% 0px',threshold:0});
      targets.forEach(section=>railObserver.observe(section));
    }

    /* page-leaving veil */
    const veil=document.querySelector('.page-veil');
    if(veil&&fine.matches&&!reduce.matches){
      window.addEventListener('pageshow',()=>root.classList.remove('leaving'));
      document.addEventListener('click',event=>{
        if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
        const anchor=event.target.closest('a');
        if(!anchor||!anchor.getAttribute('href')||(anchor.target&&anchor.target!=='_self')||anchor.hasAttribute('download'))return;
        let url;
        try{url=new URL(anchor.href,location.href);}catch(error){return;}
        if(url.protocol!=='http:'&&url.protocol!=='https:')return;
        if(url.origin!==location.origin)return;
        if(url.pathname===location.pathname)return;
        if(root.classList.contains('leaving')){event.preventDefault();return;}
        event.preventDefault();
        root.classList.add('leaving');
        window.setTimeout(()=>{location.href=url.href;},300);
      });
    }
  }
})();
