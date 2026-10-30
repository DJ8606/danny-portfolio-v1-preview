import { projects, getProject } from './projects.js?v=20261030-v03';
import { productionPage, initProduction } from './idea-v03-host.js?v=20261030-phone3';
import { ipPage, initIpPage } from './ip-stage.js?v=20261018-ipstory6';
import { Dice } from './dice.js?v=20261005-0101';
import { voyagePage, initVoyage } from './voyage.js?v=20261019-entry1';
import { experienceMarkup, initExperience } from './experiences.js?v=20261005-0101';
import { chapterFront, initChapterFront } from './chapter-fronts.js?v=20261020-entry3';
import { journeyMarkup } from './illustration-journey.js?v=20261021-justine7';

const app=document.getElementById('app');
const curtain=document.querySelector('.transition-curtain');
const announce=document.getElementById('announce');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let dice=null, voyage=null, pageAbort=null, selected=-1, visited=new Set(), sound=false, audio=null, routeTimer=null, first=true, skipCurtainOnce=false, worldTransitioning=false, pendingAutoEnter=false;
try {sound=sessionStorage.getItem('danny-sound')==='on';}catch{}
const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const projectHref=p=>p.entry||`#/project/${p.id}`;
const rollIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" transform="rotate(-12 12 12)"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="15" r="1"/><circle cx="12" cy="12" r="1"/></svg>';

function playSound(kind='land') {
  if(!sound)return;
  try {
    audio??=new (window.AudioContext||window.webkitAudioContext)();
    if(audio.state==='suspended')audio.resume();
    const motifs={production:{notes:[196,294],wave:'triangle'},avatar:{notes:[330,440,550],wave:'sine'},detective:{notes:[147,220],wave:'square'},motion:{notes:[392,523],wave:'sine'}};
    const motif=motifs[kind],now=audio.currentTime;
    if(motif){
      motif.notes.forEach((frequency,i)=>{
        const start=now+i*.09,osc=audio.createOscillator(),gain=audio.createGain();osc.type=motif.wave;osc.frequency.value=frequency;
        osc.connect(gain);gain.connect(audio.destination);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(kind==='detective'?.018:.028,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+.16);
        osc.start(start);osc.stop(start+.17);
      });
      return;
    }
    const osc=audio.createOscillator(),gain=audio.createGain();
    osc.connect(gain);gain.connect(audio.destination);osc.type=kind==='land'?'triangle':'sine';
    osc.frequency.setValueAtTime(kind==='land'?190:460,now);osc.frequency.exponentialRampToValueAtTime(kind==='land'?50:130,now+.17);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.06,now+.009);gain.gain.exponentialRampToValueAtTime(.0001,now+.24);
    osc.start(now);osc.stop(now+.26);
  }catch{}
}

function updateSound() {
  const toggle=document.getElementById('sound-toggle');toggle.setAttribute('aria-pressed',String(sound));toggle.setAttribute('aria-label',sound?'关闭音效':'开启音效');toggle.querySelector('span').textContent=sound?'声音开启':'声音关闭';
}
updateSound();
document.getElementById('sound-toggle').addEventListener('click',()=>{sound=!sound;updateSound();voyage?.setSound(sound);try{sessionStorage.setItem('danny-sound',sound?'on':'off');}catch{}if(sound)playSound();});

function fallbackCube(){
  const cells=[[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
  return `<div class="fallback-wrap" aria-hidden="true"><div class="fallback-cube">${['front','right','top','bottom','left','back'].map((side,i)=>`<div class="cube-face ${side}">${Array.from({length:9},(_,n)=>cells[i].includes(n)?'<b></b>':'<span></span>').join('')}</div>`).join('')}</div></div>`;
}

function home(){
  return `<section class="hero" aria-label="多看一面，探索我的项目">
    <div class="hero-copy">
      <div class="eyebrow"><span class="mini-cross" aria-hidden="true">✳</span> A PERSONAL EXHIBITION</div>
      <h1 class="hero-title"><span>MANY</span><span class="outline-word">SIDES<span class="title-dot">.</span></span></h1>
      <p class="hero-intro">我有六面，<br>你会先遇见哪一面？<small>点击骰子随机掷出一面；拖动可旋转，也能在下方直接选。</small></p>
      <div class="hero-actions"><button class="primary-button" id="roll-button">${rollIcon}<span>掷骰子，遇见一面</span></button><a class="text-link" href="#/projects">直接看项目</a></div>
      <div class="hero-bottom-note"><span class="short-rule"></span> DRAW. MAKE. EXPERIMENT.</div>
    </div>
    <div class="stage" id="stage">
      <div class="stage-halo" aria-hidden="true"></div><div class="scene-backdrop" aria-hidden="true"></div>
      <span class="stage-index" aria-hidden="true">06</span><div class="stage-label"><i aria-hidden="true"></i><span>六面，六个作品入口</span></div>
      <div class="stage-shadow" aria-hidden="true"></div><div class="stage-orbit" aria-hidden="true"><i class="orbit-marker"></i></div><div class="impact-ring" aria-hidden="true"></div>
      <div class="cube-surface" role="button" tabindex="0" aria-label="点击投掷多面体，拖动旋转。也可以用左右方向键选择一面。"><canvas id="dice-canvas" aria-hidden="true"></canvas>${fallbackCube()}</div>
      <div class="stage-guide"><strong>点骰子，揭晓今天的一面。</strong><span>拖动旋转 · 下方可直接选</span></div>
      <article class="preview-card" id="preview-card" hidden></article>
    </div>
    <div class="face-selector" aria-label="主动选择一面"><span class="face-selector-label">也可以选</span>${projects.map((p,i)=>`<button class="face-button ${visited.has(i)?'visited':''}" data-face="${i}" title="${escape(p.label)}" aria-label="${p.number}，${escape(p.label)}" aria-pressed="false">${p.number}</button>`).join('')}</div>
  </section>`;
}

function particles(stage){
  if(reduced)return;
  for(let i=0;i<22;i++){const particle=document.createElement('i');particle.className='particle';const theta=i*Math.PI*2/22;particle.style.setProperty('--dx',`${Math.cos(theta)*(80+Math.random()*180)}px`);particle.style.setProperty('--dy',`${Math.sin(theta)*(65+Math.random()*150)}px`);particle.style.animationDelay=`${Math.random()*.08}s`;stage.append(particle);particle.addEventListener('animationend',()=>particle.remove(),{once:true});}
}

function showResult(index,animated=true){
  selected=index;visited.add(index);const p=projects[index],stage=document.getElementById('stage'),card=document.getElementById('preview-card');
  if(!stage)return;
  stage.style.setProperty('--stage-color',p.color);stage.classList.remove('is-rolling','reveal-art','reveal-tech','just-landed');
  void stage.offsetWidth;stage.classList.add('revealed',`reveal-${p.type}`);if(animated)stage.classList.add('just-landed');
  stage.querySelector('.scene-backdrop').style.backgroundImage=`url('${p.thumbnail||p.cover}')`;stage.querySelector('.stage-index').textContent=p.number;
  card.hidden=false;card.innerHTML=`<div class="preview-meta"><span class="preview-number">SIDE / ${p.number}</span><span>${p.status}</span></div><h2>${p.label}</h2><p>${p.description}</p><div class="preview-actions"><a class="preview-enter" href="${projectHref(p)}"><span aria-hidden="true"></span>进入这一面</a><button class="preview-reroll" id="reroll-button">再掷一次</button></div>`;
  card.querySelector('.preview-enter').addEventListener('click',event=>{if(p.id==='illustration'){event.preventDefault();startIllustrationTransition(projectHref(p));}},{signal:pageAbort.signal});
  document.getElementById('reroll-button').addEventListener('click',()=>{pendingAutoEnter=false;dice?.throw();},{signal:pageAbort.signal});
  document.getElementById('roll-button').disabled=false;document.getElementById('roll-button').querySelector('span').textContent='再掷一面';
  document.querySelectorAll('.face-button').forEach((button,i)=>{button.classList.toggle('active',i===index);button.classList.toggle('visited',visited.has(i));button.setAttribute('aria-pressed',String(i===index));button.disabled=false;});
  announce.textContent=`掷到 ${p.number}，${p.label}。${p.description} 可以进入项目，或再掷一次。`;
  if(animated)particles(stage);
}

function startIllustrationTransition(href=projectHref(projects[0])){
  if(worldTransitioning)return;
  const stage=document.getElementById('stage'),p=projects[0];
  if(!stage||reduced){skipCurtainOnce=true;location.hash=href;return;}
  worldTransitioning=true;document.body.classList.add('world-transitioning');
  stage.style.setProperty('--stage-color',p.color);stage.querySelector('.scene-backdrop').style.backgroundImage=`url('${p.coverWide||p.cover}')`;
  if(!stage.querySelector('.world-transition-copy'))stage.insertAdjacentHTML('beforeend','<div class="world-transition-copy" aria-hidden="true"><span>SIDE 01</span><strong>DRAWING...</strong></div>');
  stage.classList.add('world-entering','world-enter-illustration');
  document.querySelectorAll('#roll-button,.face-button,.preview-reroll,.preview-enter').forEach(el=>{el.disabled=true;el.style.pointerEvents='none';});
  announce.textContent='正在进入 01 插画 / IP / 文创。';
  setTimeout(()=>{skipCurtainOnce=true;worldTransitioning=false;location.hash=href;},3000);
}

function initHome(){
  const stage=document.getElementById('stage');
  dice=new Dice(document.getElementById('dice-canvas'),{reducedMotion:reduced,onSound:playSound,onStart:()=>{
    stage.classList.add('is-rolling');stage.classList.remove('just-landed');document.getElementById('preview-card').hidden=true;
    document.getElementById('roll-button').disabled=true;document.getElementById('roll-button').querySelector('span').textContent='正在揭晓';
    document.querySelectorAll('.face-button').forEach(button=>button.disabled=true);announce.textContent='正在投掷。';
  },onFinish:index=>{showResult(index);if(pendingAutoEnter&&index===0){pendingAutoEnter=false;const signal=pageAbort.signal;setTimeout(()=>{if(!signal.aborted)startIllustrationTransition();},450);}else pendingAutoEnter=false;}});
  document.getElementById('roll-button').addEventListener('click',()=>{pendingAutoEnter=false;dice.throw();},{signal:pageAbort.signal});
  document.querySelectorAll('[data-face]').forEach(button=>button.addEventListener('click',()=>{const index=Number(button.dataset.face);pendingAutoEnter=index===0;dice.throw(index);},{signal:pageAbort.signal}));
  if(selected>=0){dice.setFace(selected);showResult(selected,false);}
}

function catalog(){
  return `<section class="page catalog-page"><div class="page-topline"><span class="eyebrow">THE INDEX / 06 SIDES</span><a class="back-link" href="#/">回到多面体</a></div>
    <div class="catalog-header"><h1 class="page-title">挑你想看的<em>。</em></h1><p>一些已经做出来的东西，<br>和一些还在往前走的想法。</p></div>
    <div class="catalog-list">${projects.map(p=>`<a class="catalog-row" href="${projectHref(p)}" style="--row-accent:${p.color}" data-cover="${p.thumbnail||p.cover}" aria-label="查看${p.label}，${p.status}"><span class="row-number">${p.number}</span><span class="row-title">${p.label}<small>${p.english}</small></span><span class="row-status"><i aria-hidden="true"></i>${p.status}</span><span class="row-open">打开</span></a>`).join('')}</div>
    <img class="catalog-hover-image" id="catalog-preview" src="assets/expressive-cover.png" alt="" aria-hidden="true" width="330" height="206">
    <div class="catalog-bottom"><span>作品、工具与实验，会继续放进来。</span><span>每一个项目，都是认识我的另一种方式。</span></div>
  </section>`;
}

function labPage(){
  return `<section class="lab-host" aria-label="DANNY 制作工坊"><div class="lab-host-bar"><span>DANNY LAB / 制作工坊</span><a href="#/">← 回到六面</a></div><iframe id="lab-frame" src="./lab/index.html?embedded=1&amp;v=20261028-labfix1" title="DANNY 制作工坊" allow="autoplay"></iframe></section>`;
}

function roadPage(){
  return `<section class="road-host" aria-label="DANNY · ON THE ROAD"><div class="road-cover" id="road-cover" role="dialog" aria-modal="true" aria-labelledby="road-cover-title"><img src="./assets/portfolio/danny-road-cover.png" alt="DANNY ON THE ROAD 沿途放映海岸公路日落封面"><div class="road-cover-shade" aria-hidden="true"></div><div class="road-cover-copy"><span class="sr-only" id="road-cover-title">DANNY · ON THE ROAD · 沿途放映</span><button id="road-enter" type="button" aria-label="进入沿途放映"><span class="sr-only">PRESS ENTER</span></button></div></div><iframe id="road-frame" data-src="./video-road/index.html?v=20261028-diaoge1&amp;autoplay=1" title="DANNY · ON THE ROAD" allow="fullscreen; autoplay" hidden></iframe></section>`;
}

function initRoad(){
  const frame=document.getElementById('road-frame');
  const cover=document.getElementById('road-cover'),enter=document.getElementById('road-enter');
  if(!frame||!cover||!enter)return;
  const launch=()=>{cover.hidden=true;frame.hidden=false;if(!frame.getAttribute('src'))frame.src=frame.dataset.src;frame.focus({preventScroll:true});};
  enter.addEventListener('click',launch,{signal:pageAbort.signal});
  window.addEventListener('keydown',event=>{if(!cover.hidden&&(event.key==='Enter'||event.key===' ')){event.preventDefault();launch();}},{signal:pageAbort.signal});
  enter.focus({preventScroll:true});
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.source!=='DANNY_ROAD')return;
    if(event.data.type==='DANNY_ROAD_EXIT'){skipCurtainOnce=true;location.hash='#/';}
  },{signal:pageAbort.signal});
}

function initLab(){
  const frame=document.getElementById('lab-frame');
  if(!frame)return;
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
    if(event.data?.type==='LAB_SOUND_CHANGED'){
      sound=Boolean(event.data.soundEnabled);updateSound();
      try{sessionStorage.setItem('danny-sound',sound?'on':'off');}catch{}
    }
  },{signal:pageAbort.signal});
}

function initCatalog(){
  if(matchMedia('(pointer:coarse)').matches || reduced)return;
  const preview=document.getElementById('catalog-preview');
  document.querySelectorAll('.catalog-row').forEach(row=>{
    row.addEventListener('pointerenter',()=>{preview.src=row.dataset.cover;preview.classList.add('visible');},{signal:pageAbort.signal});
    row.addEventListener('pointermove',e=>{preview.style.left=`${Math.min(window.innerWidth-190,Math.max(190,e.clientX+75))}px`;preview.style.top=`${Math.min(window.innerHeight-130,Math.max(130,e.clientY))}px`;},{signal:pageAbort.signal});
    row.addEventListener('pointerleave',()=>preview.classList.remove('visible'),{signal:pageAbort.signal});
  });
}

function motionPlayground(){
  return `<section class="layout-playground"><div class="playground-header"><div><h2>同一张图，三种说话节奏。</h2><p>先选节奏，再播放。镜头推进、文字进场和停顿，会跟着你的选择改变。</p></div></div><div class="motion-rhythms" role="group" aria-label="选择动画节奏"><button type="button" data-rhythm="gentle" aria-pressed="true">慢慢靠近</button><button type="button" data-rhythm="snap" aria-pressed="false">突然切入</button><button type="button" data-rhythm="hold" aria-pressed="false">停一拍</button></div><div class="motion-preview" id="motion-preview" data-rhythm="gentle"><img src="assets/expressive-cover.png" alt="动画实验使用的抽象封面"><span class="motion-word">静，也会动。</span><div class="motion-scan" aria-hidden="true"></div></div><div class="motion-controls"><button class="primary-button" id="motion-toggle" aria-pressed="false">播放动效</button><p id="motion-hint">8 秒循环。你可以随时暂停，停在当前画面。</p></div></section>`;
}

function projectGallery(items){
  return items?.length?journeyMarkup(items):'';
}

function projectMaterials(p){
  if(!p.materials?.length)return '';
  const visible=p.materials.map((item,index)=>({item,index})).filter(({item})=>item.kind!=='PDF 参考'&&(p.id!=='illustration'||!['插画原作','互动入口'].includes(item.kind)));
  const card=(item,index)=>{
    const poster=item.poster?` poster="${item.poster}"`:'';
    const media=item.media==='video'?`<video src="${item.src}"${poster} muted playsinline preload="metadata" controls></video>`:item.src?`<img src="${item.src}" alt="${escape(item.title)}" loading="lazy">`:'';
    const detail=item.src?`<button type="button" class="material-open" data-material-index="${index}">看详情</button>`:'';
    const action=item.href?`<a href="${item.href}" ${item.href.startsWith('http')?'target="_blank" rel="noopener noreferrer"':''}>打开</a>`:'';
    const source=item.source&&p.id!=='illustration'?`<small>${escape(item.source)}</small>`:'';
    return `<article class="material-card ${item.src?'is-viewable':''}" ${item.src?`data-material-index="${index}"`:''}>${media}<div><span>${escape(item.kind)}</span><h3>${escape(item.title)}</h3><p>${escape(item.body)}</p>${source}<div class="material-actions">${detail}${action}</div></div></article>`;
  };
  const groupOf=item=>{
    if(p.id!=='illustration')return '';
    if(item.kind==='互动入口')return '长卷互动入口';
    if(item.kind==='作品补充'||item.kind.includes('插画')||item.kind.includes('潮玩'))return '插画归档';
    if(item.kind.includes('品牌')||item.kind.includes('包装'))return '品牌 / 文创包装';
    return 'IP 角色与应用';
  };
  const grouped=p.id==='illustration'
    ? Object.entries(visible.reduce((acc,{item,index})=>{const group=groupOf(item);(acc[group]??=[]).push([item,index]);return acc;},{})).map(([group,items])=>`<section class="materials-group"><h3>${group}</h3><div class="materials-grid">${items.map(([item,index])=>card(item,index)).join('')}</div></section>`).join('')
    : `<div class="materials-grid">${visible.map(({item,index})=>card(item,index)).join('')}</div>`;
  return `<section class="project-materials" aria-labelledby="materials-${p.id}"><div class="materials-head"><span class="eyebrow">SELECTED CASES</span><h2 id="materials-${p.id}">案例内容</h2><p>${p.id==='illustration'?'插画、品牌视觉与文创包装留在这里；角色 IP 请到 02 单独观看。':'把现有作品按这一面归好：图像可以展开看大图，工具和网页项目保留直接入口。'}</p></div>${grouped}<div class="material-viewer" hidden role="dialog" aria-modal="true" aria-label="案例详情"><button type="button" class="material-close">返回</button><button type="button" class="material-nav material-prev" aria-label="上一个案例">上一项</button><div class="material-stage"></div><aside class="material-detail"><span></span><h3></h3><p></p><small></small><a hidden>打开</a></aside><button type="button" class="material-nav material-next" aria-label="下一个案例">下一项</button></div></section>`;
}

function initMaterialViewer(p){
  const viewer=document.querySelector('.material-viewer');
  if(!viewer)return;
  const items=(p.materials||[]).map((item,index)=>({...item,index})).filter(item=>item.src);
  if(!items.length)return;
  document.body.appendChild(viewer);
  pageAbort.signal.addEventListener('abort',()=>viewer.remove(),{once:true});
  const stage=viewer.querySelector('.material-stage'),kind=viewer.querySelector('.material-detail span'),title=viewer.querySelector('.material-detail h3'),body=viewer.querySelector('.material-detail p'),source=viewer.querySelector('.material-detail small'),link=viewer.querySelector('.material-detail a'),close=viewer.querySelector('.material-close');
  let active=0;
  const show=position=>{
    active=(position+items.length)%items.length;
    const item=items[active];
    stage.innerHTML=item.media==='video'?`<video src="${item.src}" ${item.poster?`poster="${item.poster}"`:''} controls autoplay playsinline></video>`:`<img src="${item.src}" alt="${escape(item.title)}">`;
    kind.textContent=item.kind||'';title.textContent=item.title||'';body.textContent=item.detail||item.body||'';source.textContent=p.id==='illustration'?'':item.source||'';
    if(item.href){link.hidden=false;link.href=item.href;link.textContent='打开项目';if(item.href.startsWith('http')){link.target='_blank';link.rel='noopener noreferrer';}else{link.removeAttribute('target');link.removeAttribute('rel');}}else link.hidden=true;
  };
  const open=index=>{
    const position=items.findIndex(item=>item.index===index);
    if(position<0)return;
    show(position);viewer.hidden=false;document.body.classList.add('material-viewing');close.focus();playSound('land');
  };
  const shut=()=>{viewer.hidden=true;document.body.classList.remove('material-viewing');stage.innerHTML='';};
  document.querySelectorAll('[data-material-index]').forEach(element=>element.addEventListener('click',event=>{
    if(event.target.closest('a,button,video'))return;
    open(Number(element.dataset.materialIndex));
  },{signal:pageAbort.signal}));
  document.querySelectorAll('.material-open').forEach(button=>button.addEventListener('click',()=>open(Number(button.dataset.materialIndex)),{signal:pageAbort.signal}));
  viewer.querySelector('.material-prev').addEventListener('click',()=>show(active-1),{signal:pageAbort.signal});
  viewer.querySelector('.material-next').addEventListener('click',()=>show(active+1),{signal:pageAbort.signal});
  close.addEventListener('click',shut,{signal:pageAbort.signal});
  viewer.addEventListener('click',event=>{if(event.target===viewer)shut();},{signal:pageAbort.signal});
  document.addEventListener('keydown',event=>{
    if(viewer.hidden)return;
    if(event.key==='Escape')shut();
    if(event.key==='ArrowLeft')show(active-1);
    if(event.key==='ArrowRight')show(active+1);
  },{signal:pageAbort.signal});
}

function projectPage(p){
  if(p.id==='production')return productionPage();
  if(p.id==='motion')return roadPage();
  const next=projects[(projects.indexOf(p)+1)%projects.length];
  return `<article class="page project-page"><div class="page-topline"><a class="back-link" href="#/projects">项目目录</a><span class="eyebrow">SIDE / ${p.number}</span></div>
    <header class="project-head"><div><div class="eyebrow" style="color:${p.color};margin-bottom:20px">${p.english}</div><h1>${escape(p.title)}</h1></div><div class="project-side-meta"><span class="status-badge">${p.status}</span><p>${p.description}</p></div></header>
    ${chapterFront(p)}
    ${experienceMarkup(p.id)}
    ${p.id==='illustration'?projectGallery(p.gallery):`<figure class="project-cover" style="margin-left:0;margin-right:0"><picture><source media="(max-width:720px)" srcset="${p.coverMobile||p.cover}"><img src="${p.coverWide||p.cover}" alt="${p.coverAlt|| (p.type==='art'?'橙蓝颜料、玻璃与金属构成的抽象展览封面':'金属环和组件悬浮展开的展览封面')}" width="${p.coverWidth||1672}" height="${p.coverHeight||941}"></picture><figcaption class="cover-caption"><strong>${p.number}</strong><span>${p.coverCaption?escape(p.coverCaption):'展览封面 · 本次生成<br>过往作品将另行整理'}</span></figcaption></figure>`}
    <div class="project-story"><aside class="story-aside"><span class="eyebrow">WHY I MADE THIS</span><blockquote>“${p.quote}”</blockquote><p class="quote-note">来自我的一次实际讨论</p><div class="project-tags">${p.tags.map(tag=>`<span>${tag}</span>`).join('')}</div></aside><div class="story-main"><p>${p.intro}</p><div class="story-sections">${p.sections.map(([title,text])=>`<section class="story-section"><h2>${title}</h2><p>${text}</p></section>`).join('')}</div>${p.link?`<p><a class="primary-button" href="${p.link}" ${p.link.startsWith('http')?'target="_blank" rel="noopener noreferrer"':''}>${p.linkLabel||'打开项目'}</a></p>`:''}</div></div>
    ${projectMaterials(p)}
    ${p.id==='illustration'?'':projectGallery(p.gallery)}
    <nav class="project-next" aria-label="继续探索"><div><span class="eyebrow">ANOTHER SIDE / ${next.number}</span><a href="${projectHref(next)}">${next.label}</a></div><a class="text-link" href="#/">回去再掷一次</a></nav>
  </article>`;
}

function initSpace(items){
  const space=document.querySelector('.journey-space');
  if(!space||!items?.length)return;
   const field=space.querySelector('.journey-space-field'),pieces=[...space.querySelectorAll('.journey-piece')],displayItems=pieces.map(piece=>items[Number(piece.dataset.sourceIndex)]||items[0]),status=space.querySelector('[data-space-status]'),title=space.querySelector('[data-space-title]'),kind=space.querySelector('[data-space-kind]'),toggle=document.querySelector('.journey-space-toggle'),indexToggle=document.querySelector('.journey-index-toggle'),index=document.querySelector('.journey-index'),detail=document.querySelector('.journey-detail'),detailImage=detail?.querySelector('[data-detail-image]'),detailTitle=detail?.querySelector('[data-detail-title]'),detailMeta=detail?.querySelector('[data-detail-meta]'),detailKind=detail?.querySelector('[data-detail-kind]'),detailClose=detail?.querySelector('.journey-detail-close');
   let paused=reduced,active=-1,chapter=-1,camera=0,targetCamera=0,cameraFrame=0,dragFrame=0,dragging=false,dragIntent='pending',dragStartX=0,dragStartY=0,dragStartCamera=0,dragPointerId=null,dragMoved=false,suppressClick=false,pressedPiece=null,detailScrollTop=0;
  if(detail&&detail.parentElement!==document.body)document.body.append(detail);
  pageAbort.signal.addEventListener('abort',()=>detail?.remove(),{once:true});
  const chapters=Math.max(...pieces.map(piece=>Number(piece.dataset.viewGroup||0)))+1;
  const chapterName=number=>pieces.find(piece=>Number(piece.dataset.viewGroup)===number)?.dataset.groupName||'作品组';
  const cameraMin=()=>-(chapters-1)*window.innerWidth;
  const clampCamera=value=>Math.min(0,Math.max(cameraMin(),value));
  const updateChapter=()=>{
    const next=Math.min(chapters-1,Math.max(0,Math.round(-targetCamera/window.innerWidth)));
    if(next===chapter)return;
    chapter=next;
    pieces.forEach(piece=>piece.classList.toggle('is-current',Number(piece.dataset.viewGroup)===chapter));
    status.textContent=`${String(chapter+1).padStart(2,'0')} / ${String(chapters).padStart(2,'0')}`;kind.textContent='一张完整作品 · 横向拖动下一幅';
  };
  const renderCamera=()=>{
    camera+=(targetCamera-camera)*.32;field.style.setProperty('--camera-x',`${camera}px`);
    if(Math.abs(targetCamera-camera)>.4)cameraFrame=requestAnimationFrame(renderCamera);else{camera=targetCamera;field.style.setProperty('--camera-x',`${camera}px`);cameraFrame=0;}
  };
  const renderDragCamera=()=>{camera=targetCamera;field.style.setProperty('--camera-x',`${camera}px`);updateChapter();dragFrame=0;};
  const nudgeCamera=()=>{if(!cameraFrame)cameraFrame=requestAnimationFrame(renderCamera);};
  const setChapter=(number,immediate=false)=>{
    targetCamera=-((number+chapters)%chapters)*window.innerWidth;updateChapter();
    if(immediate){camera=targetCamera;field.style.setProperty('--camera-x',`${camera}px`);}else nudgeCamera();
  };
  let pointerX=0,pointerY=0,targetX=0,targetY=0,pointerFrame=0;
  const renderPointer=()=>{
    pointerX+=(targetX-pointerX)*.12;pointerY+=(targetY-pointerY)*.12;
    pieces.forEach(piece=>{const depth=Number(piece.dataset.depth||0);piece.style.setProperty('--pointer-x',`${pointerX*depth*28}px`);piece.style.setProperty('--pointer-y',`${pointerY*depth*18}px`);});
    if(Math.abs(targetX-pointerX)>.01||Math.abs(targetY-pointerY)>.01)pointerFrame=requestAnimationFrame(renderPointer);else pointerFrame=0;
  };
  const movePointer=event=>{
    if(dragging){
      const dx=event.clientX-dragStartX,dy=event.clientY-dragStartY,threshold=14;
      if(dragIntent==='pending'&&Math.max(Math.abs(dx),Math.abs(dy))>=threshold){
        if(Math.abs(dy)>Math.abs(dx)*1.15){dragIntent='vertical';dragMoved=true;suppressClick=true;space.classList.remove('is-dragging');return;}
        dragIntent='horizontal';dragMoved=true;suppressClick=true;space.classList.add('is-dragging');space.setPointerCapture?.(event.pointerId);
      }
      if(dragIntent==='horizontal'){targetCamera=clampCamera(dragStartCamera+dx);if(!dragFrame)dragFrame=requestAnimationFrame(renderDragCamera);}
      return;
    }
    const rect=space.getBoundingClientRect();targetX=(event.clientX-(rect.left+rect.width/2))/rect.width;targetY=(event.clientY-(rect.top+rect.height/2))/rect.height;
    if(!pointerFrame)pointerFrame=requestAnimationFrame(renderPointer);
  };
  const resetPointer=()=>{if(dragging)return;targetX=0;targetY=0;if(!pointerFrame)pointerFrame=requestAnimationFrame(renderPointer);};
   const startDrag=event=>{if(event.button!==undefined&&event.button!==0)return;dragging=true;dragIntent='pending';dragMoved=false;suppressClick=false;pressedPiece=event.target.closest?.('.journey-piece')||null;dragStartX=event.clientX;dragStartY=event.clientY;dragStartCamera=targetCamera;dragPointerId=event.pointerId;};
   const endDrag=event=>{if(!dragging)return;const wasHorizontal=dragIntent==='horizontal';dragging=false;space.classList.remove('is-dragging');if(space.hasPointerCapture?.(dragPointerId))space.releasePointerCapture(dragPointerId);if(wasHorizontal)setChapter(Math.round(-targetCamera/window.innerWidth),false);dragIntent='pending';dragPointerId=null;pressedPiece=null;};
  space.addEventListener('pointerdown',startDrag,{signal:pageAbort.signal});
  space.addEventListener('pointermove',movePointer,{signal:pageAbort.signal});
  space.addEventListener('pointerup',endDrag,{signal:pageAbort.signal});
  space.addEventListener('pointercancel',endDrag,{signal:pageAbort.signal});
  space.addEventListener('pointerleave',resetPointer,{signal:pageAbort.signal});
  const setPaused=value=>{
    paused=value;space.classList.toggle('is-paused',paused);space.dataset.spaceState=paused?'paused':'ready';
    toggle.setAttribute('aria-pressed',String(paused));toggle.textContent=paused?'继续波动':'暂停波动';
    if(!paused){status.textContent=`${String(chapter+1).padStart(2,'0')} / ${String(chapters).padStart(2,'0')}`;title.textContent='点击作品查看细节';kind.textContent='一张完整作品 · 横向拖动下一幅';}
  };
  const closeDetail=()=>{
     if(detail.hidden)return;detail.hidden=true;space.classList.remove('has-detail');active=-1;pieces.forEach(piece=>piece.classList.remove('is-selected'));setPaused(false);window.scrollTo({top:detailScrollTop,behavior:'instant'});
  };
  const focus=position=>{
     active=(position+displayItems.length)%displayItems.length;const item=displayItems[active],piece=pieces[active],group=Number(piece.dataset.viewGroup||0);
    setChapter(group,true);
    pieces.forEach((piece,i)=>piece.classList.toggle('is-selected',i===active));
     title.textContent=item.title;kind.textContent=item.kind||piece.dataset.groupName||'插画原作';status.textContent=`已停住 · ${String(active+1).padStart(2,'0')} / ${String(displayItems.length).padStart(2,'0')}`;
    index.querySelectorAll('[data-journey-target]').forEach(button=>button.setAttribute('aria-current',String(Number(button.dataset.journeyTarget)===active)));
     detailImage.src=item.src;detailImage.alt=item.alt||item.title;detailTitle.textContent=item.title;detailMeta.textContent=`ILLUSTRATION / ${String(active+1).padStart(2,'0')}`;detailKind.textContent=item.kind||piece.dataset.groupName||'插画原作';detailScrollTop=window.scrollY;detail.hidden=false;space.classList.add('has-detail');setPaused(true);detailClose.focus({preventScroll:true});
  };
  pieces.forEach((piece,i)=>piece.addEventListener('click',event=>{if(suppressClick){event.preventDefault();suppressClick=false;return;}focus(i);},{signal:pageAbort.signal}));
  toggle.addEventListener('click',()=>setPaused(!paused),{signal:pageAbort.signal});
  detailClose?.addEventListener('click',closeDetail,{signal:pageAbort.signal});
  detail?.addEventListener('click',event=>{if(event.target===detail)closeDetail();},{signal:pageAbort.signal});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDetail();},{signal:pageAbort.signal});
  const closeIndex=()=>{indexToggle.setAttribute('aria-expanded','false');index.hidden=true;};
  indexToggle.addEventListener('click',()=>{const open=indexToggle.getAttribute('aria-expanded')!=='true';indexToggle.setAttribute('aria-expanded',String(open));index.hidden=!open;},{signal:pageAbort.signal});
  index.querySelectorAll('[data-journey-target]').forEach(button=>button.addEventListener('click',()=>{focus(Number(button.dataset.journeyTarget));closeIndex();},{signal:pageAbort.signal}));
  setChapter(0,true);setPaused(paused);
}

function initScrollSpace(items){
  const space=document.querySelector('.journey-space');
  if(!space||!items?.length)return;
  const rail=space.querySelector('.journey-rail'),pieces=[...space.querySelectorAll('.journey-work')],displayItems=pieces.map(piece=>items[Number(piece.dataset.sourceIndex)]||items[0]);
  const status=space.querySelector('[data-space-status]'),title=space.querySelector('[data-space-title]'),kind=space.querySelector('[data-space-kind]'),indexToggle=document.querySelector('.journey-index-toggle'),index=document.querySelector('.journey-index'),detail=space.parentElement.querySelector('.journey-detail'),detailImage=detail?.querySelector('[data-detail-image]'),detailTitle=detail?.querySelector('[data-detail-title]'),detailMeta=detail?.querySelector('[data-detail-meta]'),detailKind=detail?.querySelector('[data-detail-kind]'),detailClose=detail?.querySelector('.journey-detail-close');
  if(!rail||!pieces.length)return;
  if(detail&&detail.parentElement!==document.body)document.body.append(detail);
  pageAbort.signal.addEventListener('abort',()=>detail?.remove(),{once:true});
  let active=-1,lastScroll=rail.scrollLeft,lastTime=performance.now(),velocity=0,scrollFrame=0,motionFrame=0,dragging=false,dragMoved=false,suppressClick=false,dragStartX=0,dragStartScroll=0,dragPointerId=null,detailScrollTop=0,lastFocused=null,pointerFrame=0,pointerX=0;
  const updateMeta=next=>{
    if(next<0)return;
    const item=displayItems[next];
    active=next;
    pieces.forEach((piece,i)=>piece.classList.toggle('is-active',i===next));
    status.textContent=`${String(next+1).padStart(2,'0')} / ${String(displayItems.length).padStart(2,'0')}`;
    title.textContent=item.title;
    kind.textContent=item.kind||'插画原作';
    index?.querySelectorAll('[data-journey-target]').forEach(button=>button.setAttribute('aria-current',String(Number(button.dataset.journeyTarget)===next)));
  };
  const updateActive=()=>{
    const center=rail.scrollLeft+rail.clientWidth/2;
    let nearest=0,distance=Infinity;
    pieces.forEach((piece,i)=>{
      const pieceCenter=piece.offsetLeft+piece.offsetWidth/2,delta=Math.abs(pieceCenter-center);
      if(delta<distance){distance=delta;nearest=i;}
      piece.style.setProperty('--distance',Math.min(1,delta/(rail.clientWidth*.72)).toFixed(3));
    });
    if(nearest!==active)updateMeta(nearest);
  };
  const paintMotion=()=>{
    velocity*=.86;
    pieces.forEach((piece,i)=>piece.style.setProperty('--velocity',(i===active?velocity:velocity*.18).toFixed(3)));
    if(Math.abs(velocity)>.012)motionFrame=requestAnimationFrame(paintMotion);else motionFrame=0;
  };
  const onScroll=()=>{
    const now=performance.now(),delta=now-lastTime;
    velocity=Math.max(-1.4,Math.min(1.4,(rail.scrollLeft-lastScroll)/Math.max(16,delta)*1.6));
    lastScroll=rail.scrollLeft;lastTime=now;
    if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;updateActive();});
    if(!motionFrame)motionFrame=requestAnimationFrame(paintMotion);
  };
  const centerPiece=(piece,behavior='smooth')=>{
    const left=Math.max(0,Math.min(rail.scrollWidth-rail.clientWidth,piece.offsetLeft-(rail.clientWidth-piece.offsetWidth)/2));
    if(behavior==='auto')rail.scrollLeft=left;else rail.scrollTo({left,behavior});
  };
  const focusWork=position=>{
    const next=(position+displayItems.length)%displayItems.length,piece=pieces[next],item=displayItems[next];
    lastFocused=piece;centerPiece(piece,'auto');updateMeta(next);detailScrollTop=window.scrollY;
    detailImage.src=item.src;detailImage.alt=item.alt||item.title;detailTitle.textContent=item.title;detailMeta.textContent=`ILLUSTRATION / ${String(next+1).padStart(2,'0')}`;detailKind.textContent=item.kind||'插画原作';detail.hidden=false;space.classList.add('has-detail');detailClose?.focus({preventScroll:true});
  };
  const movePointer=event=>{
    if(dragging){
      const dx=event.clientX-dragStartX;
      if(!dragMoved&&Math.abs(dx)>6){dragMoved=true;suppressClick=true;rail.classList.add('is-dragging');rail.setPointerCapture?.(event.pointerId);}
      if(dragMoved)rail.scrollLeft=dragStartScroll-dx;
      return;
    }
    if(event.pointerType!=='mouse')return;
    const rect=rail.getBoundingClientRect();pointerX=Math.max(-1,Math.min(1,(event.clientX-(rect.left+rect.width/2))/(rect.width/2)));
    const piece=pieces[active];piece?.style.setProperty('--pointer-x',pointerX.toFixed(3));
  };
  const resetPointer=()=>{pointerX=0;pieces[active]?.style.setProperty('--pointer-x','0');};
  const startDrag=event=>{if(event.button!==undefined&&event.button!==0)return;dragging=true;dragMoved=false;suppressClick=false;dragStartX=event.clientX;dragStartScroll=rail.scrollLeft;dragPointerId=event.pointerId;rail.classList.add('is-dragging');};
  const endDrag=()=>{if(!dragging)return;dragging=false;rail.classList.remove('is-dragging');if(rail.hasPointerCapture?.(dragPointerId))rail.releasePointerCapture(dragPointerId);if(dragMoved){updateActive();centerPiece(pieces[active],'smooth');setTimeout(()=>{suppressClick=false;},90);}else suppressClick=false;dragPointerId=null;};
  const onWheel=event=>{if(Math.abs(event.deltaY)<=Math.abs(event.deltaX))return;event.preventDefault();rail.scrollLeft+=event.deltaY;};
  const closeDetail=()=>{if(!detail||detail.hidden)return;detail.hidden=true;space.classList.remove('has-detail');window.scrollTo({top:detailScrollTop,behavior:'auto'});lastFocused?.focus({preventScroll:true});};
  rail.addEventListener('scroll',onScroll,{signal:pageAbort.signal,passive:true});
  rail.addEventListener('wheel',onWheel,{signal:pageAbort.signal,passive:false});
  rail.addEventListener('pointerdown',startDrag,{signal:pageAbort.signal});
  rail.addEventListener('pointermove',movePointer,{signal:pageAbort.signal});
  rail.addEventListener('pointerup',endDrag,{signal:pageAbort.signal});
  rail.addEventListener('pointercancel',endDrag,{signal:pageAbort.signal});
  rail.addEventListener('pointerleave',resetPointer,{signal:pageAbort.signal});
  rail.addEventListener('keydown',event=>{if(event.key!=='ArrowLeft'&&event.key!=='ArrowRight')return;event.preventDefault();focusWork(active+(event.key==='ArrowRight'?1:-1));},{signal:pageAbort.signal});
  pieces.forEach((piece,i)=>piece.addEventListener('click',event=>{if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false;return;}focusWork(i);},{signal:pageAbort.signal}));
  detailClose?.addEventListener('click',closeDetail,{signal:pageAbort.signal});
  detail?.addEventListener('click',event=>{if(event.target===detail)closeDetail();},{signal:pageAbort.signal});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeDetail();},{signal:pageAbort.signal});
  indexToggle?.addEventListener('click',()=>{const open=indexToggle.getAttribute('aria-expanded')!=='true';indexToggle.setAttribute('aria-expanded',String(open));index.hidden=!open;},{signal:pageAbort.signal});
  index?.querySelectorAll('[data-journey-target]').forEach(button=>button.addEventListener('click',()=>{centerPiece(pieces[Number(button.dataset.journeyTarget)],'smooth');indexToggle?.setAttribute('aria-expanded','false');index.hidden=true;},{signal:pageAbort.signal}));
  window.addEventListener('resize',updateActive,{signal:pageAbort.signal});
  updateMeta(0);centerPiece(pieces[0],'auto');updateActive();
  requestAnimationFrame(()=>{centerPiece(pieces[0],'auto');updateActive();});
}

function initProject(p){
  initChapterFront(p,{signal:pageAbort.signal,reducedMotion:reduced,onSound:playSound,onEnter:()=>{
    skipCurtainOnce=true;location.hash='#/voyage';
  }});
  initMaterialViewer(p);
  initScrollSpace(p.gallery);
  if(p.id==='motion'){
    const preview=document.getElementById('motion-preview'),hint=document.getElementById('motion-hint');
    const rhythmInfo={gentle:['8 秒循环。缓慢靠近，再轻轻退开。','静，也会动。'],snap:['4 秒循环。画面和文字在切点上出现。','一下子，看见。'],hold:['7 秒循环。先留白，再停住。','先停一拍。']};
    document.querySelectorAll('[data-rhythm]').forEach(button=>button.addEventListener('click',()=>{
      const rhythm=button.dataset.rhythm;preview.dataset.rhythm=rhythm;
      document.querySelectorAll('[data-rhythm]').forEach(option=>option.setAttribute('aria-pressed',String(option===button)));
      hint.textContent=rhythmInfo[rhythm][0];preview.querySelector('.motion-word').textContent=rhythmInfo[rhythm][1];
      if(preview.classList.contains('playing')){preview.classList.remove('playing');void preview.offsetWidth;preview.classList.add('playing');}
      playSound('motion');
    },{signal:pageAbort.signal}));
    document.getElementById('motion-toggle').addEventListener('click',e=>{
      const playing=e.currentTarget.getAttribute('aria-pressed')!=='true';e.currentTarget.setAttribute('aria-pressed',String(playing));e.currentTarget.textContent=playing?'暂停动效':'播放动效';
      preview.classList.add('playing');preview.querySelectorAll('img,.motion-word,.motion-scan').forEach(element=>element.style.animationPlayState=playing?'running':'paused');
    },{signal:pageAbort.signal});
  }
  initExperience(p.id,{signal:pageAbort.signal,playSound,reducedMotion:reduced});
}

function about(){
  const timeline=[['从多媒体开始','在广东轻工职业技术大学（原广东轻工职业技术学院）学习多媒体。视觉和表达，是我的起点。'],['走进生产现场','因为家庭原因，做了跟单与模具，也开过模具厂。产品、工艺、材料和交付，很多环节都需要参与。'],['再回到插画','重新学习插画，在虎课网担任一年多助教，后来做过插画图库、品牌营销、IP 设计与文创视觉。'],['把 AI 用进工作','从排版、数字人到动画与学习游戏，围绕自己遇见的问题持续实验。做得出来以后，再继续调整它怎样才好用。']];
  const honors=[['2020','《乘风破浪的设计师》书籍设计大赛','虎课网 × 北京联合出版公司 · 插画组二等奖'],['2021','虎年对联比赛','虎课网 · 优秀奖'],['2021','支付宝红包封面创意人计划','铜奖'],['2022','嘉兴蔬彩园蔬彩卡通动漫形象设计大赛','组队参加 · 一等奖'],['2023','泉州城市 IP 插画大赛','入围奖']];
  const spine=['插画创作','IP / 文创视觉','3D 产品建模','工艺与生产','实体商品','AI 工具实验'];
  const reserved=[['《黑神话：悟空》相关周边','插画创作参与。等真实素材补齐后，再整理成完整项目页。'],['平遥国庆文创','街景展示项目参与。后续补场景图、实物图与职责说明。'],['3D 实物产品','保留“数字模型 → 工艺调整 → 实体产品 → 最终商品”的讲述结构。']];
  return `<section class="page about-page"><div class="page-topline"><span class="eyebrow">THE PERSON BEHIND THE PROJECTS</span><a class="back-link" href="#/projects">看看我做的东西</a></div><section class="about-reveal" aria-labelledby="diaoge-title"><div class="portrait-card portrait-young"><img class="young-photo" src="assets/diaoge/young-photo.jpg" alt="DANNY 18 年前的照片"><span>ABOUT / DANNY</span><strong>十八年前</strong></div><div class="reveal-copy"><div class="identity"><div class="identity-text"><span class="eyebrow">从想法，到真的做出来</span><h1 id="diaoge-title">雕哥<span>。</span></h1><p>你好，我是 DANNY。<br>朋友们平时叫我「雕哥」。<br>以前我做过模具，微信名叫「绿叶精雕」。后来大家叫我雕哥，这个称呼也就一直留了下来。<br>现在，我索性把这个外号变成了一只雄鹰，放进自己的网站。</p><button type="button" class="diaoge-hint" aria-controls="diaoge-story" aria-expanded="false">听听雕哥的故事 →</button><div class="diaoge-story" id="diaoge-story" aria-hidden="true"><p>以前，我研究怎么把一个东西做出来。</p><p>现在，我还在做同样的事，只不过工具多了设计、3D、影像、代码，还有 AI。</p><p>我喜欢尝试，也喜欢把那些突然冒出来的想法，慢慢变成能看到、能摸到，甚至能玩的东西。</p><p><strong>这就是我，也是你眼前这只雕的来历。</strong></p></div></div><button type="button" class="diaoge-preview" aria-label="点击雕哥，了解绿叶精雕的故事" aria-controls="diaoge-story" aria-expanded="false"><img src="assets/diaoge/front_sample.png" alt=""><canvas aria-hidden="true"></canvas></button></div></div></section><section class="about-axis"><div><span class="eyebrow">WORKING AXIS</span><h2>不是只做一张图，<br>而是把它往后推。</h2></div><div class="axis-steps">${spine.map((item,i)=>`<span><i>0${i+1}</i>${item}</span>`).join('')}</div></section><div class="about-grid"><aside class="about-anchor">一条不太直的路<strong>MANY<br>SIDES.</strong><p>设计、生产、产品与 AI，<br>在我的工作里慢慢连起来。</p></aside><div class="timeline">${timeline.map(([title,text],i)=>`<section class="timeline-item"><span>0${i+1}</span><div><h2>${title}</h2><p>${text}</p></div></section>`).join('')}</div></div><section class="about-grid" aria-labelledby="honors-title"><aside class="about-anchor"><span class="eyebrow">HONORS / 2020—2023</span><strong id="honors-title" role="heading" aria-level="2">荣誉与认可</strong></aside><div class="timeline">${honors.map(([year,title,award])=>`<section class="timeline-item"><span>${year}</span><div><h2>${title}</h2><p>${award}</p></div></section>`).join('')}</div></section><section class="reserved-proof"><span class="eyebrow">REAL WORK TO FILL NEXT</span><h2>下一阶段要往六个项目里补的真实内容</h2><div>${reserved.map(([title,text])=>`<article><h3>${title}</h3><p>${text}</p></article>`).join('')}</div></section><div class="about-bottom" id="about-contact"><p>这里会留下我的作品，<br>也会留下正在试的东西。</p><div class="about-contact"><span>CONTACT / WECHAT</span><img class="contact-qr" src="assets/contact/wechat-qr.png" alt="DANNY 微信二维码" width="180" height="180" loading="lazy" decoding="async"><strong>扫码添加微信</strong><small>这是我的微信二维码。</small></div><a class="primary-button" href="#/projects">继续看项目</a></div></section>`;
}

function initAbout(){
  const contactQr=app.querySelector('.contact-qr');
  if(contactQr)contactQr.outerHTML='<iframe class="contact-qr3d" src="assets/contact/qr3d-magic-tree.html" title="DANNY 3D 微信二维码" loading="lazy" allow="fullscreen"></iframe>';
  const section=app.querySelector('.about-reveal'),bird=section.querySelector('.diaoge-preview'),hint=section.querySelector('.diaoge-hint'),story=section.querySelector('.diaoge-story'),signal=pageAbort.signal;
  let pose;
  const toggle=()=>{const open=story.classList.toggle('is-open');story.setAttribute('aria-hidden',String(!open));bird.setAttribute('aria-expanded',String(open));hint.setAttribute('aria-expanded',String(open));hint.textContent=open?'收起故事 ↑':'听听雕哥的故事 →';pose?.react();};
  bird.addEventListener('click',toggle,{signal});hint.addEventListener('click',toggle,{signal});
  import('./assets/diaoge/diaoge-pose.js?v=20261028-ip1').then(()=>{
    if(signal.aborted)return;
    const instance=new window.DiaoGePose({canvas:bird.querySelector('canvas'),pointerTarget:section,basePath:'assets/diaoge',sensitivity:.65,smoothing:150});
    pose=instance;signal.addEventListener('abort',()=>instance.destroy(),{once:true});
    instance.start().then(ok=>{if(signal.aborted)instance.destroy();else if(ok)bird.classList.add('loaded');});
  }).catch(error=>console.error('雕哥素材加载失败',error));
}

function render(){
  document.body.classList.remove('world-transitioning');
  dice?.destroy();dice=null;voyage?.destroy();voyage=null;pageAbort?.abort();pageAbort=new AbortController();
  const hash=location.hash||'#/',path=hash.slice(1).replace(/\/$/,'')||'/';
  if(path==='/project/avatar'){location.replace('./resonance/index.html?v=20261028-back1');return;}
  if(path==='/project/layout'){location.hash='#/lab';return;}
  document.body.classList.toggle('idea-route',path==='/project/production');
  document.body.classList.toggle('lab-route',path==='/lab');
  document.body.classList.toggle('road-route',path==='/project/motion');
  let nav='home',p=null;
  if(path==='/projects'){nav='projects';app.innerHTML=catalog();initCatalog();document.title='项目目录 · DANNY';}
  else if(path==='/about'){nav='about';app.innerHTML=about();initAbout();document.title='认识我 · DANNY';}
  else if(path==='/lab'){nav='projects';p=getProject('detective');visited.add(5);app.innerHTML=labPage();initLab();document.title='制作工坊 · DANNY';}
  else if(path==='/voyage'){nav='projects';p=projects[0];visited.add(0);app.innerHTML=voyagePage();voyage=initVoyage(app.querySelector('.voyage-page'),{reducedMotion:reduced,soundEnabled:sound});document.title='线刻长卷游览 · DANNY';}
  else if(path.startsWith('/project/')){
    p=getProject(path.split('/')[2]);nav='projects';
     if(p){visited.add(projects.indexOf(p));app.innerHTML=p.id==='ip'?ipPage():projectPage(p);if(p.id==='ip')initIpPage({signal:pageAbort.signal,reducedMotion:reduced});else if(p.id==='motion')initRoad();else if(p.id==='production')initProduction({signal:pageAbort.signal});else initProject(p);document.title=`${p.label} · DANNY`;}
    else{app.innerHTML='<section class="page empty-page"><h1>这一面还没有放进来。</h1><a class="primary-button" href="#/projects">回到项目目录</a></section>';document.title='项目未找到 · DANNY';}
  }else{app.innerHTML=home();initHome();document.title='DANNY · 多看一面';}
  document.documentElement.style.setProperty('--page-accent',p?.color||'#ff6946');document.body.dataset.transition=p?.type||'tech';
  document.querySelectorAll('[data-nav]').forEach(link=>{const active=link.dataset.nav===nav;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
  window.scrollTo({top:0,behavior:'instant'});
  if(!first){const heading=app.querySelector('h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}}
  if(path==='/project/illustration/gallery')app.querySelector('.illustration-journey')?.scrollIntoView({behavior:'instant',block:'start'});
  first=false;
}

function navigate(){
  clearTimeout(routeTimer);
  if(reduced||skipCurtainOnce){skipCurtainOnce=false;render();return;}
  const pending=location.hash.startsWith('#/voyage')?projects[0]:getProject((location.hash||'').split('/')[2]);document.documentElement.style.setProperty('--page-accent',pending?.color||'#ff6946');document.body.dataset.transition=pending?.type||'tech';
  curtain.classList.remove('running');void curtain.offsetWidth;curtain.classList.add('running');
  routeTimer=setTimeout(()=>{render();setTimeout(()=>curtain.classList.remove('running'),550);},280);
}
window.addEventListener('hashchange',navigate);
render();


