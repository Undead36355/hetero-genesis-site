'use strict';
/*
 * Archive glass — a single, deep WebGL signature effect for the studio home hero.
 * Two plates get a shader layer: noise-dissolve development, pointer refraction
 * with chromatic fringe, scroll-velocity liquid drift, print grain and vignette.
 * Any failure (no WebGL, shader error, context loss, reduced motion, coarse
 * pointer or narrow viewport) leaves the plain <img> and CSS animation intact.
 */
(function(){
  if(document.body.dataset.page!=='studio')return;

  const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine=window.matchMedia('(hover:hover) and (pointer:fine)');
  const MIN_WIDTH=900;
  const DPR_CAP=1.5;

  if(reduce.matches||!fine.matches||window.innerWidth<MIN_WIDTH)return;
  if(!hasWebGL())return;

  const plates=[...document.querySelectorAll('.plate')].filter(p=>p.querySelector('img'));
  if(!plates.length)return;

  const VERT=[
    'attribute vec2 aPos;',
    'varying vec2 vUv;',
    'void main(){',
    '  vUv=aPos*0.5+0.5;',
    '  gl_Position=vec4(aPos,0.0,1.0);',
    '}'
  ].join('\n');

  const FRAG=[
    'precision mediump float;',
    'uniform sampler2D uTex;',
    'uniform vec2 uRes;',
    'uniform vec2 uPointer;',
    'uniform float uHover;',
    'uniform float uReveal;',
    'uniform float uScroll;',
    'uniform float uTime;',
    'varying vec2 vUv;',
    '',
    'float hash(vec2 p){',
    '  p=fract(p*vec2(127.1,311.7));',
    '  p+=dot(p,p+34.56);',
    '  return fract(p.x*p.y);',
    '}',
    'float noise(vec2 p){',
    '  vec2 i=floor(p);',
    '  vec2 f=fract(p);',
    '  vec2 u=f*f*(3.0-2.0*f);',
    '  float a=hash(i);',
    '  float b=hash(i+vec2(1.0,0.0));',
    '  float c=hash(i+vec2(0.0,1.0));',
    '  float d=hash(i+vec2(1.0,1.0));',
    '  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);',
    '}',
    '',
    'void main(){',
    '  vec2 uv=vUv;',
    '  float ar=uRes.x/uRes.y;',
    '',
    '  /* scroll-velocity liquid drift */',
    '  float amp=0.0018+abs(uScroll)*0.0085;',
    '  float t=uTime*0.35;',
    '  uv.x+=sin(uv.y*3.3+t)*amp+sin(uv.y*8.1-t*1.6)*amp*0.45;',
    '  uv.y+=cos(uv.x*2.9-t*0.85)*amp*0.75;',
    '',
    '  /* pointer refraction + chromatic fringe (tight local lens) */',
    '  vec2 d=uv-uPointer;',
    '  d.x*=ar;',
    '  float dist=length(d);',
    '  float lens=smoothstep(0.105,0.012,dist)*uHover;',
    '  vec2 dir=d/(dist+1e-4);',
    '  dir.x/=ar;',
    '  uv=uPointer+(uv-uPointer)*(1.0+lens*0.034)+dir*(lens*0.005);',
    '',
    '  vec3 col;',
    '  if(lens>0.001){',
    '    vec2 off=dir*(0.0022*lens);',
    '    col=vec3(texture2D(uTex,uv+off).r,texture2D(uTex,uv).g,texture2D(uTex,uv-off).b);',
    '  }else{',
    '    col=texture2D(uTex,uv).rgb;',
    '  }',
    '',
    '  /* print tone: vignette + film grain */',
    '  vec2 q=vUv-0.5;',
    '  col*=1.0-dot(q,q)*0.5;',
    '  col+=(hash(gl_FragCoord.xy+fract(uTime)*311.0)-0.5)*0.03;',
    '',
    '  /* noise-threshold development */',
    '  float n=noise(vUv*vec2(6.5,3.8));',
    '  float th=uReveal*1.45-0.26;',
    '  float a=smoothstep(0.0,0.16,th-n);',
    '  float edge=1.0-smoothstep(0.0,0.06,abs(th-n-0.06));',
    '  col=mix(col,vec3(0.80,0.64,0.36),edge*0.24*a);',
    '  gl_FragColor=vec4(col,a);',
    '}'
  ].join('\n');

  const pointer={x:0,y:0,active:false};
  const instances=[];
  let raf=0;
  let aborted=false;
  let scrollTarget=0;
  let scrollVel=0;
  let lastY=window.scrollY;

  plates.forEach((plate,index)=>{
    const img=plate.querySelector('img');
    whenReady(img,()=>{
      if(aborted)return;
      const inst=build(plate,img,index);
      if(!inst)return;
      instances.push(inst);
      kick();
    });
  });

  if(!instances.length&&!aborted){
    /* images may still be loading; nothing to start yet */
  }

  startListeners();

  /* ---------------- lifecycle ---------------- */

  function startListeners(){
    window.addEventListener('pointermove',event=>{
      if(event.pointerType&&event.pointerType!=='mouse')return;
      pointer.x=event.clientX;
      pointer.y=event.clientY;
      pointer.active=true;
      kick();
    },{passive:true});

    window.addEventListener('pointerout',event=>{
      if(!event.relatedTarget)pointer.active=false;
    },{passive:true});

    window.addEventListener('blur',()=>{pointer.active=false;});

    window.addEventListener('scroll',()=>{
      const y=window.scrollY;
      const delta=y-lastY;
      lastY=y;
      scrollTarget=Math.max(-1,Math.min(1,delta/70));
      kick();
    },{passive:true});

    document.addEventListener('visibilitychange',()=>{
      if(!document.hidden)kick();
    });

    reduce.addEventListener('change',event=>{
      if(event.matches)disposeAll();
    });

    fine.addEventListener('change',event=>{
      if(!event.matches)disposeAll();
    });

    window.addEventListener('resize',()=>{
      if(window.innerWidth<MIN_WIDTH)disposeAll();
      else instances.forEach(inst=>{inst.measure();});
      kick();
    });
  }

  function kick(){
    if(aborted||raf||document.hidden)return;
    if(!instances.some(inst=>inst.visible&&!inst.dead))return;
    raf=window.requestAnimationFrame(tick);
  }

  function tick(now){
    raf=0;
    scrollVel+=(scrollTarget-scrollVel)*0.16;
    scrollTarget*=0.86;
    let more=false;
    for(const inst of instances){
      if(!inst.dead&&inst.draw(now,scrollVel))more=true;
    }
    if(more&&!aborted)raf=window.requestAnimationFrame(tick);
  }

  function disposeAll(){
    aborted=true;
    if(raf)window.cancelAnimationFrame(raf);
    raf=0;
    instances.forEach(inst=>inst.destroy());
    instances.length=0;
  }

  /* ---------------- per-plate instance ---------------- */

  function build(plate,img,index){
    const canvas=document.createElement('canvas');
    canvas.className='plate-canvas';
    canvas.setAttribute('aria-hidden','true');

    const attrs={alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:false,powerPreference:'low-power'};
    let gl=null;
    try{gl=canvas.getContext('webgl',attrs)||canvas.getContext('experimental-webgl',attrs);}catch(e){gl=null;}
    if(!gl)return null;

    const program=createProgram(gl);
    if(!program)return null;

    const buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);

    const aPos=gl.getAttribLocation(program,'aPos');
    const U={
      tex:gl.getUniformLocation(program,'uTex'),
      res:gl.getUniformLocation(program,'uRes'),
      pointer:gl.getUniformLocation(program,'uPointer'),
      hover:gl.getUniformLocation(program,'uHover'),
      reveal:gl.getUniformLocation(program,'uReveal'),
      scroll:gl.getUniformLocation(program,'uScroll'),
      time:gl.getUniformLocation(program,'uTime')
    };

    const texture=gl.createTexture();
    const source=document.createElement('canvas');
    const sourceCtx=source.getContext('2d');
    if(!sourceCtx)return null;

    gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);

    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0,0,0,0);

    let start=0;
    let hover=0;
    let ux=0.5;
    let uy=0.5;
    let visible=false;
    let dead=false;
    let live=false;

    plate.insertBefore(canvas,img.nextSibling);

    const observer=new IntersectionObserver(entries=>{
      const entry=entries[0];
      visible=!!entry&&entry.isIntersecting;
      if(visible)kick();
    },{rootMargin:'120px 0px'});
    observer.observe(plate);

    const resizeObserver=new ResizeObserver(()=>{measure();kick();});
    resizeObserver.observe(plate);

    canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();
      destroy();
    });

    measure();

    return {
      get visible(){return visible&&!dead;},
      get dead(){return dead;},
      measure,
      draw,
      destroy
    };

    function measure(){
      if(dead)return;
      const dpr=Math.min(window.devicePixelRatio||1,DPR_CAP);
      const w=Math.max(1,Math.round(plate.clientWidth*dpr));
      const h=Math.max(1,Math.round(plate.clientHeight*dpr));
      if(w===canvas.width&&h===canvas.height)return;
      canvas.width=w;
      canvas.height=h;
      upload();
    }

    function upload(){
      const w=canvas.width;
      const h=canvas.height;
      const iw=img.naturalWidth||img.width;
      const ih=img.naturalHeight||img.height;
      if(!w||!h||!iw||!ih)return;
      const scale=Math.max(w/iw,h/ih);
      const dw=Math.max(1,Math.round(iw*scale));
      const dh=Math.max(1,Math.round(ih*scale));
      source.width=w;
      source.height=h;
      sourceCtx.clearRect(0,0,w,h);
      sourceCtx.imageSmoothingEnabled=true;
      sourceCtx.drawImage(img,Math.round((w-dw)/2),Math.round((h-dh)/2),dw,dh);
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);}catch(e){}
    }

    function draw(now,scroll){
      if(dead)return false;
      if(visible&&!start)start=now;
      if(!visible)return false;

      const rect=plate.getBoundingClientRect();
      let targetHover=0;
      let tx=ux;
      let ty=uy;

      if(pointer.active&&rect.width>0&&rect.height>0){
        tx=(pointer.x-rect.left)/rect.width;
        ty=1-(pointer.y-rect.top)/rect.height;
        if(tx>-0.16&&tx<1.16&&ty>-0.16&&ty<1.16)targetHover=1;
      }

      hover+=(targetHover-hover)*0.09;
      ux+=(tx-ux)*0.12;
      uy+=(ty-uy)*0.12;

      const raw=Math.min(1,Math.max(0,(now-start-index*160)/1150));
      const reveal=1-Math.pow(1-raw,3);

      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.uniform1i(U.tex,0);
      gl.uniform2f(U.res,canvas.width,canvas.height);
      gl.uniform2f(U.pointer,ux,uy);
      gl.uniform1f(U.hover,hover);
      gl.uniform1f(U.reveal,reveal);
      gl.uniform1f(U.scroll,scroll);
      gl.uniform1f(U.time,(now-(start||now))/1000);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);

      if(!live){
        live=true;
        plate.classList.add('plate--live');
      }

      return raw<1||hover>0.004||targetHover>0.004||Math.abs(scroll)>0.004;
    }

    function destroy(){
      if(dead)return;
      dead=true;
      plate.classList.remove('plate--live');
      try{observer.disconnect();}catch(e){}
      try{resizeObserver.disconnect();}catch(e){}
      if(canvas.parentNode)canvas.parentNode.removeChild(canvas);
      try{
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      }catch(e){}
      const lose=gl.getExtension&&gl.getExtension('WEBGL_lose_context');
      if(lose)try{lose.loseContext();}catch(e){}
    }
  }

  /* ---------------- helpers ---------------- */

  function createProgram(gl){
    const vert=compile(gl,gl.VERTEX_SHADER,VERT);
    if(!vert)return null;
    const frag=compile(gl,gl.FRAGMENT_SHADER,FRAG);
    if(!frag){gl.deleteShader(vert);return null;}
    const program=gl.createProgram();
    gl.attachShader(program,vert);
    gl.attachShader(program,frag);
    gl.linkProgram(program);
    gl.deleteShader(vert);
    gl.deleteShader(frag);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);return null;}
    return program;
  }

  function compile(gl,type,src){
    const shader=gl.createShader(type);
    if(!shader)return null;
    gl.shaderSource(shader,src);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null;}
    return shader;
  }

  function whenReady(img,callback){
    if(img.complete&&img.naturalWidth>0)callback();
    else img.addEventListener('load',callback,{once:true});
  }

  function hasWebGL(){
    try{
      const probe=document.createElement('canvas');
      const gl=probe.getContext('webgl')||probe.getContext('experimental-webgl');
      if(!gl)return false;
      const lose=gl.getExtension&&gl.getExtension('WEBGL_lose_context');
      if(lose)try{lose.loseContext();}catch(e){}
      return true;
    }catch(e){return false;}
  }
})();
