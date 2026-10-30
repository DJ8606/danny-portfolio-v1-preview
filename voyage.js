import { Voyage, STATIONS, PAPER, routePoints, cameraBox, mapControlsInView } from './voyage-model.js?v=20261005-0101';
import { VoyageScore } from './voyage-score.js?v=20261005-0101';

const pathString=points=>points.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

export function voyageMap(){
  return `<svg class="voyage-map" id="voyage-map" xmlns="http://www.w3.org/2000/svg" viewBox="85 1317 475 425" preserveAspectRatio="xMidYMid meet" role="group" aria-label="可探索的线刻长卷。拖动画面，点彩色小船启航。">
    <defs>
      <linearGradient id="boat-hull" x1="-34" y1="8" x2="33" y2="29" gradientUnits="userSpaceOnUse"><stop stop-color="#ff5a3d"/><stop offset=".48" stop-color="#ffb03a"/><stop offset="1" stop-color="#4b7dff"/></linearGradient>
      <linearGradient id="boat-sail-a" x1="-26" y1="-38" x2="-2" y2="8" gradientUnits="userSpaceOnUse"><stop stop-color="#fff7cb"/><stop offset=".55" stop-color="#ff7fb2"/><stop offset="1" stop-color="#7b5cff"/></linearGradient>
      <linearGradient id="boat-sail-b" x1="-2" y1="-36" x2="34" y2="7" gradientUnits="userSpaceOnUse"><stop stop-color="#f4ff9d"/><stop offset=".48" stop-color="#36d6c8"/><stop offset="1" stop-color="#2d78ff"/></linearGradient>
      <radialGradient id="boat-gem"><stop stop-color="#fff"/><stop offset=".45" stop-color="#ffe071"/><stop offset="1" stop-color="#ff6946"/></radialGradient>
      <filter id="paper-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy=".8" stdDeviation=".5" flood-opacity=".2"/></filter>
    </defs>
    <image href="assets/line-journey.jpg" width="645" height="2047" aria-hidden="true"/>
    <path class="charted-route" id="charted-route" d="${pathString(routePoints())}" fill="none" opacity="0"/>
    <g id="voyage-boat" class="voyage-boat map-action" transform="translate(${STATIONS.harbor.point.x} ${STATIONS.harbor.point.y})" data-action="boat" role="button" tabindex="0" aria-label="小船，点击启航或暂停">
      <circle r="42" fill="transparent"/>
      <g transform="scale(.82)"><g class="boat-rock" filter="url(#paper-shadow)" stroke="#17191c" stroke-linecap="round" stroke-linejoin="round" stroke-width=".85">
        <g class="boat-wake" fill="none" stroke="#39c4ff" stroke-width=".9" opacity=".75"><path d="M-45 23q14-5 27 0m-17 7q13-4 27 0m6-5q24 6 45 0"/><path d="M-36 36q15-4 29 0"/></g>
        <path d="M-34 10Q-5 22 36 9L29 26Q4 35-25 26Z" fill="url(#boat-hull)"/>
        <path d="M-26 16Q-2 25 28 16L24 24Q0 29-21 23Z" fill="#ffffff45"/>
        <path d="M-35 10L-42 4L-20 9M-27 26L-31 34M20 28L23 34" fill="none"/>
        <path d="M-5-43V22M18-31V20" fill="none" stroke-width="1.45"/>
        <g class="boat-sails"><path d="M-5-40Q-28-13-23 8L-5 8Z" fill="url(#boat-sail-a)"/><path d="M-2-38Q15-14 14 6L-2 8Z" fill="url(#boat-sail-b)"/><path d="M18-30Q34-12 32 7L18 7Z" fill="#fff3a9"/></g>
        <path d="M-5-43L9-40L-5-47ZM18-31L30-29L18-35Z" fill="#ff6946"/>
        <circle cx="0" cy="20" r="3.2" fill="url(#boat-gem)" stroke="#17191c" stroke-width=".55"/>
        <path d="M-29 11L-5-43L32 10M-5-39L18-30L-2 13" fill="none" stroke="#17191c" stroke-width=".5" opacity=".72"/>
      </g></g>
    </g>
  </svg>`;
}

export function voyagePage(){
  return `<article class="voyage-page">
    <div class="voyage-heading"><div><span class="eyebrow">SIDE 01 / AN INK JOURNEY</span><h1>彩色小船漫游</h1><p>只跟着小船看长卷，停下时可以拖动和放大。</p></div><div class="voyage-return"><a class="back-link" href="#/projects">项目目录</a><a class="text-link" href="#/project/illustration/gallery">返回插画作品</a></div></div>
    <div class="voyage-layout">
      <section class="voyage-stage" aria-label="长卷游览画面">
        <div class="voyage-viewport" id="voyage-viewport">${voyageMap()}<div class="voyage-loading" id="voyage-loading"><span></span><p>展开长卷…</p></div></div>
        <div class="voyage-view-tools" role="group" aria-label="画面控制"><button id="voyage-overview" aria-pressed="false">全卷</button><button id="voyage-follow" aria-pressed="true">跟随小船</button><span></span><button id="voyage-zoom-out" aria-label="缩小画面">−</button><button id="voyage-zoom-in" aria-label="放大画面">＋</button></div>
        <div class="voyage-map-label" aria-hidden="true"><span>INK / 01</span><span id="voyage-map-caption">港口 · 准备启航</span></div>
      </section>
      <aside class="voyage-panel">
        <div class="voyage-stop-meta"><span id="voyage-stop-number">01 / 04</span><span id="voyage-status">准备启航</span></div>
        <h2 id="voyage-stop-title">彩色小船从港口启航。</h2><p class="voyage-stop-copy" id="voyage-stop-copy">点一下小船或启航按钮，让它沿着长卷慢慢往前走。</p>
        <button class="voyage-sail-button" id="voyage-sail"><span class="sail-button-mark" aria-hidden="true">✳</span><span id="voyage-sail-label">启航</span></button>
        <div class="voyage-timeline"><label for="voyage-progress">航程<span id="voyage-percent">0%</span></label><input type="range" id="voyage-progress" min="0" max="1000" step="1" value="0" aria-label="拖动航程，停在长卷中的任意位置"></div>
        <div class="voyage-panel-bottom"><p id="voyage-feedback" role="status">航行会在每一站停下。随时可以自己逛。</p><button class="voyage-reset" id="voyage-reset">回到港口</button></div>
      </aside>
    </div>
    <div class="voyage-footnote"><span>原作局部游览 · DANNY</span><span>重点只保留小船。</span><a class="text-link" href="#/">回去再掷一面</a></div>
  </article>`;
}

export function initVoyage(root,{reducedMotion=false,soundEnabled=false}={}){
  const controller=new AbortController(),signal=controller.signal,trip=new Voyage(),score=new VoyageScore();
  const get=id=>root.querySelector(`#${id}`);
  const svg=get('voyage-map'),viewport=get('voyage-viewport'),boat=get('voyage-boat');
  const mapActions=[...svg.querySelectorAll('[data-action]')];
  const sail=get('voyage-sail'),sailLabel=get('voyage-sail-label'),progress=get('voyage-progress'),feedback=get('voyage-feedback');
  let raf=0,lastTime=0,disposed=false,zoom=1.35,following=true,overview=false,drag=null;
  let camera={...STATIONS.harbor.camera},currentBox=null,flipped=false,lastX=trip.position.x,lastStation='harbor',lastStatus='ready';
  let ready=false,suppressNextPointerClick=false;
  root.classList.toggle('voyage-reduced',reducedMotion);
  score.enabled=soundEnabled;

  function dimensions(){const rect=viewport.getBoundingClientRect();return {width:Math.max(1,rect.width),height:Math.max(1,rect.height)};}
  function targetBox(){if(overview)return {x:0,y:0,width:PAPER.width,height:PAPER.height};const size=dimensions();return cameraBox(camera,size.width,size.height,zoom);}
  function drawCamera(instant=false){
    const target=targetBox();let moving=false;
    if(!currentBox||instant||reducedMotion)currentBox={...target};
    else for(const key of ['x','y','width','height']){const delta=target[key]-currentBox[key];if(Math.abs(delta)>.15){currentBox[key]+=delta*.12;moving=true;}else currentBox[key]=target[key];}
    svg.setAttribute('viewBox',`${currentBox.x.toFixed(2)} ${currentBox.y.toFixed(2)} ${currentBox.width.toFixed(2)} ${currentBox.height.toFixed(2)}`);
    const visible=mapControlsInView(currentBox,trip.position);
    for(const action of mapActions)action.setAttribute('tabindex',visible.includes(action.dataset.action)?'0':'-1');
    return moving;
  }
  function schedule(){if(!raf&&!disposed&&!document.hidden)raf=requestAnimationFrame(frame);}
  function frame(now){
    raf=0;if(disposed||document.hidden)return;
    const delta=lastTime?Math.min(100,now-lastTime):0;lastTime=now;
    const moving=trip.tick(delta);
    if(moving){
      drawBoat();updateProgress();
      if(following&&!overview)camera={x:trip.position.x,y:trip.position.y+45};
      if(trip.station.id!==lastStation||trip.status!==lastStatus){
        if(trip.status==='docked'||trip.status==='complete'){
          if(following&&!overview)camera={...trip.station.camera};
          feedback.textContent=trip.status==='complete'?'这一趟走完了。可以继续放大、拖动，或再游一趟。':`到${trip.station.title}了。可以停下来看细节，也可以继续航行。`;
          score.arrival(trip.index);
        }
        updatePanel();
      }
    }
    const cameraMoving=drawCamera();
    if(trip.status==='sailing'||cameraMoving)schedule();else lastTime=0;
  }
  function drawBoat(){
    const {x,y}=trip.position;
    if(Math.abs(x-lastX)>.02)flipped=x<lastX;
    lastX=x;boat.setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    boat.querySelector('.boat-rock').style.setProperty('--boat-direction',flipped?-1:1);
    boat.setAttribute('aria-label',trip.status==='sailing'?'小船，点击暂停航行':'小船，点击继续航行');
  }
  function updateProgress(){progress.value=Math.round(trip.progress*1000);get('voyage-percent').textContent=`${Math.round(trip.progress*100)}%`;}
  function updateTools(){get('voyage-follow').setAttribute('aria-pressed',String(following&&!overview));get('voyage-overview').setAttribute('aria-pressed',String(overview));}
  function updatePanel(){
    const station=trip.station;
    lastStation=station.id;lastStatus=trip.status;
    const labels={ready:'准备启航',sailing:'航行中',paused:'停船中',docked:'停靠中',complete:'游览完成'};
    get('voyage-status').textContent=trip.needsChoice?'等待选路':labels[trip.status];
    get('voyage-stop-number').textContent=`0${trip.index+1} / 04`;
    get('voyage-stop-title').textContent=station.heading;get('voyage-stop-copy').textContent=station.text;
    get('voyage-map-caption').textContent=`${station.title} · ${labels[trip.status]}`;
    root.classList.toggle('is-sailing',trip.status==='sailing');
    root.classList.toggle('has-set-sail',trip.progress>0||trip.status==='sailing');
    sail.disabled=!ready;
    sailLabel.textContent=trip.status==='complete'?'再游一趟':trip.status==='sailing'?'停船，自己逛':reducedMotion?'到下一站':trip.progress===0?'启航':'继续航行';
    updateProgress();
  }
  function focusStation(id){
    trip.jump(id);following=true;overview=false;camera={...trip.station.camera};
    feedback.textContent=`停在${STATIONS[id].title}。拖动或放大，看看画里的细节。`;
    updateTools();drawBoat();updatePanel();drawCamera(reducedMotion);schedule();
  }
  function toggleSail(){
    if(!ready)return;
    if(trip.status==='sailing'){
      trip.pause();feedback.textContent='小船停下了。拖动画面，自己看看。';
    }else{
      if(trip.status==='complete')trip.restart();
      following=true;overview=false;
      if(reducedMotion){trip.jump(trip.order[Math.min(3,trip.index+1)]);camera={...trip.station.camera};feedback.textContent=`到${trip.station.title}了。可以探索这一站。`;score.arrival(trip.index);}
      else{trip.play();feedback.textContent='小船会在下一站停下。点船或按钮可以随时暂停。';}
      score.activate();score.note(164.81,.35,.15);
    }
    updateTools();drawBoat();updatePanel();drawCamera(reducedMotion);lastTime=0;schedule();
  }
  function act(action){
    if(action==='boat')toggleSail();
  }
  root.addEventListener('pointerdown',()=>{suppressNextPointerClick=false;},{signal});
  root.addEventListener('click',event=>{
    if(suppressNextPointerClick&&event.detail>0){suppressNextPointerClick=false;return;}
    suppressNextPointerClick=false;
    const button=event.target.closest('[data-stop],[data-action]');if(!button||drag?.moved)return;
    if(button.dataset.stop)focusStation(button.dataset.stop);
    else act(button.dataset.action);
  },{signal});
  svg.addEventListener('keydown',event=>{const target=event.target.closest('[data-action]');if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();act(target.dataset.action);}},{signal});
  sail.addEventListener('click',toggleSail,{signal});
  get('voyage-reset').addEventListener('click',()=>{trip.restart();following=true;overview=false;zoom=1.35;camera={...STATIONS.harbor.camera};feedback.textContent='回到港口了。可以重新启航。';updateTools();drawBoat();updatePanel();schedule();},{signal});
  progress.addEventListener('input',()=>{trip.seek(Number(progress.value)/1000);following=true;overview=false;camera={x:trip.position.x,y:trip.position.y+45};feedback.textContent='停在这里了。可以拖动画面，或继续航行。';updateTools();drawBoat();updatePanel();drawCamera(true);},{signal});
  get('voyage-overview').addEventListener('click',()=>{overview=!overview;following=!overview;if(!overview)camera={...trip.station.camera};updateTools();drawCamera(reducedMotion);schedule();},{signal});
  get('voyage-follow').addEventListener('click',()=>{following=!following||overview;overview=false;if(following)camera={x:trip.position.x,y:trip.position.y+45};updateTools();drawCamera(reducedMotion);schedule();},{signal});
  function changeZoom(delta){overview=false;zoom=Math.max(1,Math.min(2.3,zoom+delta));updateTools();drawCamera(reducedMotion);schedule();}
  get('voyage-zoom-in').addEventListener('click',()=>changeZoom(.25),{signal});get('voyage-zoom-out').addEventListener('click',()=>changeZoom(-.25),{signal});

  viewport.addEventListener('pointerdown',event=>{
    if(event.button!==0||overview)return;
    const action=event.target.closest('[data-action]')?.dataset.action;
    if(action)return;
    trip.pause();following=false;drag={id:event.pointerId,type:'pan',x:event.clientX,y:event.clientY,camera:{x:currentBox.x+currentBox.width/2,y:currentBox.y+currentBox.height/2},moved:false};
    viewport.setPointerCapture(event.pointerId);viewport.classList.add('dragging');updateTools();updatePanel();
  },{signal});
  viewport.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;
    if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)>4)drag.moved=true;
    if(!drag.moved)return;
    const rect=viewport.getBoundingClientRect();camera={x:drag.camera.x-(event.clientX-drag.x)*currentBox.width/rect.width,y:drag.camera.y-(event.clientY-drag.y)*currentBox.height/rect.height};drawCamera(true);
  },{signal});
  function endDrag(event){
    if(!drag||drag.id!==event.pointerId)return;
    const ended=drag;
    drag=null;
    if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
    viewport.classList.remove('dragging');
    if(ended.moved&&event.type==='pointerup'){
      suppressNextPointerClick=true;
    }
  }
  viewport.addEventListener('pointerup',endDrag,{signal});viewport.addEventListener('pointercancel',endDrag,{signal});
  const resize=new ResizeObserver(()=>{drawCamera(true);});resize.observe(viewport);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){trip.pause();cancelAnimationFrame(raf);raf=0;lastTime=0;score.suspend();updatePanel();}
    else{if(score.enabled)score.activate();drawCamera(true);}
  },{signal});

  // Preloading gives the visible artwork an explicit ready/error state.
  const image=new Image();
  image.onload=()=>{if(disposed)return;svg.querySelector('image').setAttribute('href',image.src);ready=true;get('voyage-loading').hidden=true;updatePanel();};
  image.onerror=()=>{if(disposed)return;get('voyage-loading').innerHTML='<p>长卷暂时没有加载出来。</p><button class="voyage-load-retry">重新加载</button>';get('voyage-loading').querySelector('button').addEventListener('click',()=>{image.src=`assets/line-journey.jpg?retry=${Date.now()}`;},{once:true,signal});};
  image.src='assets/line-journey.jpg';
  drawBoat();drawCamera(true);updatePanel();
  return {
    setSound(enabled){score.setEnabled(enabled);},
    destroy(){disposed=true;controller.abort();resize.disconnect();cancelAnimationFrame(raf);score.destroy();image.onload=null;image.onerror=null;}
  };
}


