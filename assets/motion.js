'use strict';
(() => {
  const root=document.documentElement,body=document.body;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
  const world=body.dataset.world||'studio';
  let enabled=!reduce.matches;
  try{if(localStorage.getItem('tys-motion')==='off')enabled=false;}catch{}
  const hero=document.querySelector('.fx-stage');
  const progress=document.createElement('div');progress.className='fx-progress';progress.setAttribute('aria-hidden','true');body.append(progress);
  const dock=document.createElement('div');dock.className='fx-dock';
  const toggle=document.createElement('button');toggle.type='button';
  const top=document.createElement('a');top.href='#';top.textContent='↑';
  dock.append(toggle,top);body.append(dock);
  const labels={en:['Motion on','Motion off','Back to top'],zh:['动效已开启','动效已关闭','回到顶部'],ja:['演出オン','演出オフ','ページ上部へ'],ko:['효과 켜짐','효과 꺼짐','맨 위로']};
  function language(){const lang=root.lang.slice(0,2);return labels[lang]||labels.en;}
  function sync(){root.dataset.motion=enabled?'on':'off';toggle.textContent=language()[enabled?0:1];toggle.setAttribute('aria-pressed',String(!enabled));toggle.setAttribute('aria-label',language()[enabled?0:1]);top.setAttribute('aria-label',language()[2]);body.dispatchEvent(new CustomEvent('studio-motion',{detail:{enabled}}));schedule();specimens.forEach(s=>s.drawStill());}
  toggle.addEventListener('click',()=>{enabled=!enabled&&!reduce.matches;try{localStorage.setItem('tys-motion',enabled?'on':'off');}catch{}sync();});
  reduce.addEventListener('change',e=>{enabled=!e.matches;try{if(localStorage.getItem('tys-motion')==='off')enabled=false;}catch{}sync();});
  new MutationObserver(()=>{toggle.textContent=language()[enabled?0:1];toggle.setAttribute('aria-label',language()[enabled?0:1]);top.setAttribute('aria-label',language()[2]);}).observe(root,{attributes:true,attributeFilter:['lang']});
  top.addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:enabled?'smooth':'instant'});});
  // One-shot reveals leave all content visible when JS or IntersectionObserver is unavailable.
  const selector='.reveal,.section-heading,.feature,.demo-intro,.demo-details,.gallery-stage,.atlas-section,.contact-section>div,.final-cta .wrap,.section-head,.about-grid>div,.milestones li,.gallery-item,.fact-strip,.status-panel .paper,.approach-item';
  let revealObserver=null;
  if('IntersectionObserver' in window){root.classList.add('fx-ready');revealObserver=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('fx-in');revealObserver.unobserve(e.target);}});},{threshold:.06});}
  function decorate(scope=document){scope.querySelectorAll(selector).forEach(el=>{if(el.classList.contains('fx-reveal'))return;el.classList.add('fx-reveal');if(revealObserver)revealObserver.observe(el);else el.classList.add('fx-in');});scope.querySelectorAll('.game-media,.gallery-zoom,.feature-media,.trailer-frame').forEach(el=>{if(el.dataset.fxTilt)return;el.dataset.fxTilt='true';el.classList.add('fx-tilt');el.addEventListener('pointermove',e=>{if(!enabled||!fine.matches)return;const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;el.style.setProperty('--fx-rx',`${(y-.5)*-5}deg`);el.style.setProperty('--fx-ry',`${(x-.5)*6}deg`);el.style.setProperty('--fx-hx',`${x*100}%`);el.style.setProperty('--fx-hy',`${y*100}%`);},{passive:true});el.addEventListener('pointerleave',()=>{el.style.setProperty('--fx-rx','0deg');el.style.setProperty('--fx-ry','0deg');});});}
  decorate();
  const features=document.getElementById('featuresGrid');if(features)new MutationObserver(()=>decorate(features)).observe(features,{childList:true});
  const cursor=document.createElement('div');cursor.className='fx-cursor';cursor.setAttribute('aria-hidden','true');body.append(cursor);
  let pointer={x:.67,y:.5},ripple={x:.67,y:.5,time:-10};
  document.addEventListener('pointermove',e=>{if(!enabled||!fine.matches)return;cursor.style.transform=`translate3d(${e.clientX}px,${e.clientY}px,0)`;cursor.style.opacity='1';cursor.classList.toggle('is-active',!!e.target.closest('.game-media,.gallery-zoom,.image-button,[data-trailer]'));},{passive:true});
  document.addEventListener('pointerdown',()=>cursor.classList.add('is-down'),{passive:true});document.addEventListener('pointerup',()=>cursor.classList.remove('is-down'),{passive:true});document.addEventListener('pointerleave',()=>{cursor.style.opacity='0';},{passive:true});
  if(hero){hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();pointer={x:(e.clientX-r.left)/r.width,y:1-(e.clientY-r.top)/r.height};if(enabled&&fine.matches){hero.style.setProperty('--fx-px',((pointer.x-.5)*2).toFixed(3));hero.style.setProperty('--fx-py',((pointer.y-.5)*2).toFixed(3));}},{passive:true});hero.addEventListener('pointerdown',e=>{const r=hero.getBoundingClientRect();ripple={x:(e.clientX-r.left)/r.width,y:1-(e.clientY-r.top)/r.height,time:performance.now()/1000};},{passive:true});}
  let gl=null,program=null,uniform={},heroVisible=true,raf=0,last=0,scrollQueued=false;
  const canvas=hero?.querySelector('.fx-field');
  function initField(){
    if(!canvas)return;
    try{
      gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:'low-power'});if(!gl)return;
      const vertex='attribute vec2 a;varying vec2 uv;void main(){uv=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
      const fragment=`precision mediump float;
      varying vec2 uv;uniform vec2 res,mouse,hit,imageSize;uniform float t,hitTime,theme,hasImage,depth;uniform sampler2D ocean;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
      void main(){
        vec2 p=uv;float ar=res.x/res.y;vec2 q=vec2(p.x*ar,p.y);
        float n=noise(q*3.+vec2(t*.035,-t*.045));
        float warp=sin(p.y*5.+t*.16)*.12+n*.15;
        float ray=pow(max(0.,sin((p.x-p.y*.27+warp)*26.+t*.22)),12.);
        ray+=pow(max(0.,sin((p.x-p.y*.2-warp*.45)*46.-t*.13)),24.)*.35;
        ray*=pow(p.y,1.2)*smoothstep(0.,.4,p.x)*.25;
        vec2 drift=q*vec2(5.,7.)+vec2(t*.05,t*.07);
        float caustic=pow(1.-abs(sin(drift.x+sin(drift.y+t*.13))*cos(drift.y+sin(drift.x-t*.1))),16.)*.035;
        float focus=exp(-length((p-mouse)*vec2(ar,1.))*3.5);
        float age=t-hitTime;float d=length((p-hit)*vec2(ar,1.));
        float ring=exp(-abs(d-age*.16)*70.)*exp(-max(age,0.)*1.2)*step(0.,age);
        float grid=.0;if(theme>1.5){vec2 g=abs(fract(q*16.)-.5);grid=(1.-smoothstep(.0,.018,min(g.x,g.y)))*.014;}
        vec3 cold=vec3(.41,.78,.74),warm=vec3(.98,.59,.35);vec3 color=mix(cold,warm,step(.5,theme)*(1.-step(1.5,theme))*.4);
        float light=ray+caustic+focus*.04+ring*.25+grid;
        if(hasImage>.5){
          float cover=max(res.x/imageSize.x,res.y/imageSize.y);
          vec2 tc=(p-.5)*res/(imageSize*cover)+.5;
          vec2 direction=normalize((p-mouse)*vec2(ar,1.)+.0001);
          tc+=direction*sin(length((p-mouse)*vec2(ar,1.))*30.-t*.5)*focus*.002;
          tc+=normalize((p-hit)*vec2(ar,1.)+.0001)*ring*.014*sin(d*95.-age*7.);
          tc+=vec2(sin(p.y*9.+t*.12),cos(p.x*8.-t*.13))*.0015;
          tc.y-=depth*.022;
          vec3 scene=texture2D(ocean,tc).rgb;
          scene.r=texture2D(ocean,tc+direction*focus*.0008).r;
          float shade=mix(.19,.78,smoothstep(.0,1.,p.x));
          if(theme>.5&&theme<1.5)shade*=.5;
          if(theme>1.5)shade*=.8;
          shade*=mix(.64,1.,smoothstep(.0,.5,p.y));
          gl_FragColor=vec4(scene*shade+color*light*.65,1.);
        }else gl_FragColor=vec4(color,clamp(light,0.,.32));
      }`;
      const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){gl.deleteShader(s);throw Error('Visual shader unavailable');}return s;};
      const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Visual shader unavailable');
      gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);['res','mouse','hit','t','hitTime','theme','imageSize','hasImage','ocean','depth'].forEach(n=>uniform[n]=gl.getUniformLocation(program,n));
      const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([0,0,0,255]));gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.uniform1i(uniform.ocean,0);gl.uniform2f(uniform.imageSize,1,1);
      const image=world==='hg1'?new Image():hero.querySelector('img');
      const upload=()=>{if(!gl||!image.naturalWidth)return;try{gl.useProgram(program);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.uniform2f(uniform.imageSize,image.naturalWidth,image.naturalHeight);gl.uniform1f(uniform.hasImage,1);canvas.classList.add('fx-refractive');schedule();}catch{/* Existing image and CSS light remain the fallback. */}};
      image?.addEventListener('load',upload,{once:true});if(world==='hg1')image.src='assets/v3/library_hero_3840x1240.jpg';if(image?.complete)upload();
      hero.dataset.fxRenderer='webgl';resizeField();
    }catch{gl=null;hero.dataset.fxRenderer='css';}
  }
  function resizeField(){if(!gl)return;const r=hero.getBoundingClientRect();const maxPixels=fine.matches?1100000:350000;const dpr=Math.min(devicePixelRatio||1,1.5,Math.sqrt(maxPixels/(r.width*r.height)));canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);gl.viewport(0,0,canvas.width,canvas.height);}
  canvas?.addEventListener('webglcontextlost',e=>{e.preventDefault();gl=null;canvas.classList.remove('fx-refractive');hero.dataset.fxRenderer='css';});
  canvas?.addEventListener('webglcontextrestored',()=>{initField();schedule();});
  initField();
  // The specimen is a decorative evolving mesh, never a claim about an in-game build.
  const specimens=[];
  document.querySelectorAll('.fx-specimen').forEach(el=>{
    const c=el.querySelector('canvas'),ctx=c.getContext('2d');if(!ctx)return;
    let w=0,h=0,visible=true,form=0,targetForm=0,turn=0,targetTurn=0;
    function resize(){const r=c.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5);w=r.width;h=r.height;c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw(performance.now()/1000);}
    function draw(time){
      form+=(targetForm-form)*.055;turn+=(targetTurn-turn)*.045;
      ctx.clearRect(0,0,w,h);const size=Math.min(w*.38,h*.44),phase=enabled?time:0;
      ctx.save();ctx.translate(w/2,h*.47);
      const glow=ctx.createRadialGradient(0,0,0,0,0,size*1.8);glow.addColorStop(0,'rgba(107,199,164,.12)');glow.addColorStop(1,'rgba(107,199,164,0)');ctx.fillStyle=glow;ctx.fillRect(-w/2,-h/2,w,h);
      const rotate=phase*.11+turn;
      const point=(lat,lon)=>{
        const wave=1+Math.sin(lon*3+lat*4+phase*.55)*.075+Math.cos(lon*5-lat*2+phase*.4)*.045;
        const x=Math.cos(lat)*Math.cos(lon)*size*wave*(1+form*.27),y=Math.sin(lat)*size*wave*(1-form*.19),z=Math.cos(lat)*Math.sin(lon)*size*wave;
        const xx=x*Math.cos(rotate)+z*Math.sin(rotate),zz=-x*Math.sin(rotate)+z*Math.cos(rotate);
        const yy=y*Math.cos(.32)+zz*Math.sin(.32),depth=zz*Math.cos(.32)-y*Math.sin(.32),scale=480/(480-depth);
        return {x:xx*scale,y:yy*scale,z:depth};
      };
      for(let lat=-8;lat<=8;lat++){ctx.beginPath();for(let j=0;j<=80;j++){const p=point(lat/9*Math.PI/2,j/80*Math.PI*2);j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.strokeStyle='rgba(155,224,196,.27)';ctx.lineWidth=.65;ctx.stroke();}
      for(let lon=0;lon<24;lon++){ctx.beginPath();for(let j=0;j<=45;j++){const p=point(-Math.PI/2+j/45*Math.PI,lon/24*Math.PI*2);j?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.strokeStyle='rgba(157,218,201,.19)';ctx.lineWidth=.6;ctx.stroke();}
      for(let i=0;i<9;i++){const p=point(Math.sin(i*2.1)*.9,i*2.4+phase*.06);ctx.beginPath();ctx.arc(p.x,p.y,2+(p.z/size+1)*1.5,0,Math.PI*2);ctx.fillStyle=i%3===0?'#f4b680':'#a8e7cf';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=13;ctx.fill();ctx.shadowBlur=0;}
      ctx.strokeStyle='rgba(182,223,199,.19)';ctx.setLineDash([2,7]);ctx.beginPath();ctx.ellipse(0,0,size*1.42,size*.4,-.22,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle='rgba(223,168,122,.6)';ctx.lineWidth=1;const sweep=phase*.18;ctx.beginPath();ctx.ellipse(0,0,size*1.42,size*.4,-.22,sweep,sweep+.65);ctx.stroke();ctx.restore();
    }
    c.addEventListener('pointermove',e=>{const r=c.getBoundingClientRect();targetTurn=((e.clientX-r.left)/r.width-.5)*2;},{passive:true});c.addEventListener('pointerleave',()=>targetTurn=0,{passive:true});
    el.querySelectorAll('[data-form]').forEach(button=>button.addEventListener('click',()=>{targetForm=Number(button.dataset.form);el.querySelectorAll('[data-form]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));if(!enabled){form=targetForm;draw(0);}schedule();}));
    const specimen={draw,drawStill(){if(!enabled)draw(0);},get visible(){return visible;}};specimens.push(specimen);
    if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{rootMargin:'50px'}).observe(c);
    new ResizeObserver(resize).observe(c);resize();
  });
  if(hero&&'IntersectionObserver' in window)new IntersectionObserver(entries=>{heroVisible=entries[0].isIntersecting;hero.dataset.fxVisible=String(heroVisible);schedule();}).observe(hero);
  function frame(now){raf=0;if(!enabled||document.hidden)return;const active=heroVisible&&gl||specimens.some(s=>s.visible);if(!active)return;if(now-last>32){last=now;const time=now/1000;if(gl&&heroVisible){gl.useProgram(program);gl.uniform2f(uniform.res,canvas.width,canvas.height);gl.uniform2f(uniform.mouse,pointer.x,pointer.y);gl.uniform2f(uniform.hit,ripple.x,ripple.y);gl.uniform1f(uniform.hitTime,ripple.time);gl.uniform1f(uniform.t,time);gl.uniform1f(uniform.depth,Math.min(1,Math.max(0,-hero.getBoundingClientRect().top/hero.offsetHeight)));gl.uniform1f(uniform.theme,world==='hg1'?1:world==='hg2'?2:0);gl.drawArrays(gl.TRIANGLES,0,6);}specimens.forEach(s=>{if(s.visible)s.draw(time);});}raf=requestAnimationFrame(frame);}
  function schedule(){if(raf)cancelAnimationFrame(raf);raf=0;if(enabled&&!document.hidden)raf=requestAnimationFrame(frame);}
  function onScroll(){if(scrollQueued)return;scrollQueued=true;requestAnimationFrame(()=>{scrollQueued=false;const max=document.documentElement.scrollHeight-innerHeight;root.style.setProperty('--fx-progress',max>0?(scrollY/max).toFixed(4):'0');if(hero&&enabled){const r=hero.getBoundingClientRect();hero.style.setProperty('--fx-depth',Math.min(1,Math.max(0,-r.top/r.height)).toFixed(4));}});}
  addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',()=>{resizeField();onScroll();});document.addEventListener('visibilitychange',schedule);
  sync();onScroll();
})();
