(()=>{'use strict';
const $=s=>document.querySelector(s),canvas=$('#world'),ctx=canvas.getContext('2d');
const W=1600,H=900,images={},hooks=[];
const scenicRoute=window.DANNY_SCENIC_ROUTE||{worldWidth:9000,chapters:[],chunks:[]};
const END=Math.max(7700,scenicRoute.worldWidth-320), WORLD_WIDTH=scenicRoute.worldWidth;
const settings=window.DANNY_SETTINGS||{};
canvas.width=W; canvas.height=H; // Explicit logical resolution; browser default 300×150 is invalid here.
const src={'landscape':'assets/cinematic_world_v11.webp','car':'assets/car_original_style.png','rear':'assets/hub_rear_registered.png','front':'assets/hub_front_registered.png','asphalt':'assets/asphalt_v08.webp','transitionNative':'assets/transition_forest_native.png'};
for(const [key,url] of Object.entries(src)){const im=new Image();im.src=(window.DANNY_INLINE_ASSETS&&window.DANNY_INLINE_ASSETS[key])||url;images[key]=im;}
const scenicChunks=scenicRoute.chunks.map((c,i)=>{const key='scenic'+i;const im=new Image();im.src=(window.DANNY_INLINE_ASSETS&&window.DANNY_INLINE_ASSETS[key])||c.file;images[key]=im;return {...c,key};});
// World-coordinate scene anchors. The same map image persists for the entire trip.
const carriers=Array.isArray(window.DANNY_PORTALS)&&window.DANNY_PORTALS.length?window.DANNY_PORTALS:[];
const carrierIds=new Set(carriers.map(x=>x.id));
const works=(Array.isArray(window.DANNY_WORKS)?window.DANNY_WORKS:[]).map((w,i)=>({
 ...w, id:String(w.id||`film-${i+1}`), title:String(w.title||`第 ${i+1} 部作品`),
 file:String(w.file||''), poster:String(w.poster||''),
 portal:carrierIds.has(w.portal)?w.portal:(carriers.find(c=>c.kind===w.carrier)?.id||carriers[i%carriers.length]?.id)
}));
const state={worldX:300,speed:95,cruise:true,paused:false,t:0,last:0,angle:0,near:null,full:false,radioOn:false,station:0,viewer:false};
let camera=0,pickedURL=null,localAudioURL=null,audio=null,synth=null,activeWork=null;
const bird=$('#road-diaoge'),birdNote=$('#road-diaoge-note');let birdPose=null,birdTimer;
function startBird(){
 if(!window.DiaoGePose)return;
 const instance=new window.DiaoGePose({canvas:bird.querySelector('canvas'),pointerTarget:$('#app'),basePath:'../assets/diaoge',sensitivity:.45,smoothing:150});birdPose=instance;
 instance.start().then(ok=>{if(birdPose!==instance)instance.destroy();else if(ok)bird.classList.add('loaded');});
}
startBird();
window.addEventListener('pagehide',()=>{birdPose?.destroy();birdPose=null;});
window.addEventListener('pageshow',event=>{if(event.persisted)startBird();});
bird.addEventListener('click',()=>{birdPose?.react();birdNote.hidden=false;clearTimeout(birdTimer);birdTimer=setTimeout(()=>{birdNote.hidden=true;},2400);});
function positionBird(){
 const width=canvas.clientWidth,height=canvas.clientHeight,x=(1530-camera)/W*width,y=398/H*height,bw=Math.max(44,80/W*width),bh=bw*540/390;
 bird.hidden=x < -bw || x > width+bw || state.viewer || !$('#route-map').hidden;
 if(bird.hidden)birdNote.hidden=true;
 bird.style.width=bw+'px';bird.style.left=(x-bw/2)+'px';bird.style.top=(y-bh)+'px';
 birdNote.style.left=Math.max(0,Math.min(width-150,x+bw/2))+'px';birdNote.style.top=(y-bh)+'px';
}

const stations=(Array.isArray(window.DANNY_RADIOS)&&window.DANNY_RADIOS.length?window.DANNY_RADIOS:[{name:'SUNSET FM',chord:[220,261.63,329.63,440]}]);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);function px(x){return x-camera;}
function toast(s){const el=$('#toast');el.textContent=s;el.classList.add('active');clearTimeout(el.timer);el.timer=setTimeout(()=>el.classList.remove('active'),2400);}
function ready(key){return images[key].complete&&images[key].naturalWidth>0;}
function round(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
function ellipse(x,y,rx,ry,fill){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
function text(t,x,y,font='15px system-ui',fill='#fff'){ctx.font=font;ctx.fillStyle=fill;ctx.fillText(t,x,y);}
function drawImageLayer(){
 // V11 foreground/car remain untouched. Old V02-V06 art is authored into
 // immutable WORLD-COORDINATE terrain tiles. No runtime scene-name swap.
 let coverage=0;
 for(const piece of scenicChunks){
   const im=images[piece.key],left=Math.max(camera,piece.start),right=Math.min(camera+W,piece.start+piece.width);
   if(right<=left||!ready(piece.key))continue;
   ctx.drawImage(im,left-piece.start,0,right-left,704,left-camera,0,right-left,704);
   coverage+=right-left;
 }
 if(coverage<W&&ready('landscape')){
   // Fallback for missing extended art / old V11-only installations.
   const im=images.landscape,sx=clamp(camera,0,im.width-W);
   ctx.save();ctx.globalCompositeOperation='destination-over';ctx.drawImage(im,sx,0,W,704,0,0,W,704);ctx.restore();
 }
 // Sun remains in the original V11 coordinates; the added sky art already has its own lighting.
 if(camera<9000){const sunX=px(1240);if(sunX>-200&&sunX<W+200){ctx.save();ctx.globalCompositeOperation='screen';for(let i=9;i>=1;i--)ellipse(sunX,405,26+i*8,26+i*8,`rgba(255,166,80,${.014*i})`);ellipse(sunX,405,29,29,'rgba(255,228,159,.94)');ctx.restore();}}
}

function drawGround(){
 // One world-distance, one immutable road horizon. Road stays at y=723 across every geographic region.
 const g=ctx.createLinearGradient(0,695,0,H);g.addColorStop(0,'#374051');g.addColorStop(.12,'#292d40');g.addColorStop(.65,'#1c2437');g.addColorStop(1,'#141a2b');ctx.fillStyle=g;ctx.fillRect(0,697,W,H-697);
 // Author-painted asphalt is one exact repeatable world-space tile, never flickering noise.
 if(ready('asphalt')){
   const tile=images.asphalt, tw=tile.naturalWidth;
   ctx.save();ctx.imageSmoothingEnabled=true;
   const first=Math.floor(camera/tw)*tw;
   for(let world=first;world<camera+W+tw;world+=tw){ctx.drawImage(tile,px(world),697,tw,204);}
   ctx.restore();
 }
 // Fine painted road edges and stable lane markers move strictly with world distance.
 ctx.fillStyle='#e9bd99c9';ctx.fillRect(0,704,W,2);
 ctx.fillStyle='#47394b';ctx.fillRect(0,715,W,4);
 ctx.fillStyle='#f4c99b49';ctx.fillRect(0,720,W,2);
 const start=Math.floor(camera/176)*176;
 for(let world=start;world<camera+W+176;world+=176){
   const sx=px(world);
   ctx.fillStyle='#ffc28a24';ctx.fillRect(sx+4,823,92,8);
   ctx.fillStyle='#e5b37d9c';ctx.fillRect(sx,819,88,3);
 }
 // Shallow warm paint reflections, deterministic and not flashing frame by frame.
 for(let world=Math.floor(camera/340)*340;world<camera+W+340;world+=340){
  const sx=px(world),k=.35+.28*(.5+.5*Math.sin(world*.025));
  const glow=ctx.createLinearGradient(sx,734,sx+100,843);
  glow.addColorStop(0,`rgba(251,168,105,${k*.15})`);
  glow.addColorStop(1,'rgba(251,168,105,0)');
  ctx.fillStyle=glow;ctx.fillRect(sx,732,94,116);
 }
 // A few road-side steel posts only, aligned to world coordinates.
 ctx.strokeStyle='#84919b90';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,690);ctx.lineTo(W,690);ctx.stroke();
 const post0=Math.floor(camera/260)*260;
 for(let x=post0;x<camera+W+260;x+=260){let sx=px(x);ctx.fillStyle='#3c4a58';ctx.fillRect(sx,678,6,37);ctx.fillStyle='#d6af8e80';ctx.fillRect(sx,680,2,15);}
}
function tunnelOverlay(){
 // The continuous authored panorama already depicts the cliff tunnel.
 // Avoid the previous hard-edged semi-transparent rectangle, which failed visual QA.
 // A restrained tunnel tint is drawn only as a full-viewport atmospheric change.
 const approach=smooth(clamp((state.worldX-2550)/290,0,1));
 const departure=1-smooth(clamp((state.worldX-3070)/330,0,1));
 const amount=approach*departure*.105;
 if(amount>0){ctx.fillStyle=`rgba(9,14,28,${amount.toFixed(3)})`;ctx.fillRect(0,0,W,697);}
}
function carrierWorks(carrier){return works.filter(w=>w.portal===carrier.id)}
function projectRect(x,y,w,h,alpha=.8){ctx.save();ctx.shadowColor='#ffc487';ctx.shadowBlur=16;round(x,y,w,h,7,'#18243d');ctx.strokeStyle=`rgba(255,213,159,${alpha})`;ctx.lineWidth=4;ctx.strokeRect(x,y,w,h);ctx.shadowBlur=0;ctx.fillStyle='#d9cdbe35';ctx.fillRect(x+7,y+7,w-14,h-14);ctx.restore();}
function renderCarrier(c){const x=px(c.at);if(x<-400||x>W+440)return;
 if(c.kind==='native'){
   // The old scene art already contains a painted screen / theater / shopfront.
   // This content hotspot is click-only: DO NOT draw a second flat billboard.
   // A small ambient sparkle signals interaction only while within E range.
   hooks.push({x:x-150,y:190,w:300,h:475,carrier:c});
   if(Math.abs(c.at-state.worldX)<305){ctx.save();ctx.globalAlpha=.4+.14*Math.sin(state.t*2);ellipse(x,500,5,5,'#ffe5aa');ctx.restore();}
   return;
 }

 const bob=Math.sin(state.t*.65+c.at)*6;
 // All objects are world-space portals, never scene-changing occluders.
 if(c.kind==='cliff'){
  ctx.fillStyle='#4c4753';ctx.beginPath();ctx.moveTo(x-130,691);ctx.lineTo(x-150,395);ctx.lineTo(x+155,380);ctx.lineTo(x+170,692);ctx.fill();
  ctx.fillStyle='#a87566';ctx.fillRect(x-142,394,298,12);projectRect(x-120,419,240,132);
  text('CLIFF CINEMA',x-65,492,'bold 13px monospace','#e7d0b5');
 }else if(c.kind==='ufo'){
  const y=215+bob;ctx.save();ctx.shadowBlur=16;ctx.shadowColor='#fbb888';
  ellipse(x,y,115,21,'#34445e');ellipse(x,y-9,94,17,'#b6a9a9');ellipse(x,y-30,45,29,'#576780');
  for(let i=-3;i<=3;i++)ellipse(x+i*27,y+4,5,4,'#ffca97');ctx.restore();
  ctx.fillStyle='#b2e6e41a';ctx.beginPath();ctx.moveTo(x-82,y+20);ctx.lineTo(x-100,y+240);ctx.lineTo(x+100,y+240);ctx.lineTo(x+82,y+20);ctx.fill();
  projectRect(x-116,y+65,232,128,.75);text('SKY CINEMA',x-55,y+143,'bold 13px monospace','#d9f8ed');
 }else if(c.kind==='cinema'){
  ctx.fillStyle='#2e3d4d';ctx.fillRect(x-150,595,300,102);ctx.fillStyle='#a58b7b';ctx.fillRect(x-166,566,332,31);
  ctx.beginPath();ctx.moveTo(x-178,565);ctx.lineTo(x,476);ctx.lineTo(x+178,565);ctx.fillStyle='#4a4150';ctx.fill();
  projectRect(x-126,572,252,107);text('LAKESIDE FILM',x-73,640,'bold 12px monospace','#fff0cc');
 }else if(c.kind==='balloon'){
  // Sky balloon + hanging cloth: no standing billboard.
  const y=210+bob*1.2;
  ctx.save();ctx.shadowColor='#f6a777';ctx.shadowBlur=12;
  ellipse(x,y,62,83,'#b77872');ellipse(x-18,y-8,30,70,'#d6a181');ellipse(x+16,y-3,27,69,'#785270');ctx.restore();
  ctx.strokeStyle='#f1d0a7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-38,y+56);ctx.lineTo(x-23,y+105);ctx.moveTo(x+38,y+56);ctx.lineTo(x+24,y+105);ctx.stroke();
  round(x-25,y+100,50,25,4,'#6e493d');round(x-73,y+142,146,72,7,'#2e3547');
  ctx.strokeStyle='#f3be88';ctx.lineWidth=3;ctx.strokeRect(x-73,y+142,146,72);text('SKY FILM',x-39,y+180,'bold 12px monospace','#ffdbaf');
 }else if(c.kind==='plane'){
  const y=228+bob;
  ctx.save();ctx.fillStyle='#cfb6a2';ctx.beginPath();ctx.moveTo(x-106,y);ctx.lineTo(x+50,y-21);ctx.lineTo(x+126,y-8);ctx.lineTo(x+44,y+9);ctx.closePath();ctx.fill();
  ctx.fillStyle='#7893a1';ctx.beginPath();ctx.moveTo(x-4,y-7);ctx.lineTo(x-58,y-70);ctx.lineTo(x+34,y-18);ctx.fill();ctx.restore();
  ctx.strokeStyle='#c7a996';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-115,y);ctx.lineTo(x-152,y+61);ctx.stroke();
  round(x-275,y+54,180,63,6,'#35364d');ctx.strokeStyle='#f3bf97';ctx.strokeRect(x-275,y+54,180,63);
  text('AIRBORNE FILMS',x-259,y+91,'bold 13px monospace','#ffdebb');
 }else if(c.kind==='tunnel'){
  // Little radio point outside the tunnel; not a fake full-screen tunnel or occluder.
  ctx.fillStyle='#483f45';ctx.fillRect(x-8,550,16,145);round(x-82,513,164,76,7,'#32364a');
  ctx.strokeStyle='#f5b77e';ctx.lineWidth=3;ctx.strokeRect(x-78,517,156,68);text('RADIO  88.6',x-64,558,'bold 14px monospace','#ffd4aa');
  ctx.strokeStyle='#ffc78c';ctx.beginPath();ctx.arc(x+65,532,7,0,Math.PI*2);ctx.stroke();
 }else if(c.kind==='rest'){
  ctx.fillStyle='#61505a';ctx.fillRect(x-115,570,15,124);ctx.fillRect(x+104,570,15,124);
  ctx.fillStyle='#694f53';ctx.beginPath();ctx.moveTo(x-151,570);ctx.lineTo(x-102,533);ctx.lineTo(x+116,533);ctx.lineTo(x+147,570);ctx.fill();
  round(x-94,574,190,90,5,'#383e51');round(x-70,587,142,61,5,'#536074');
  text('ROAD SIDE 24H',x-71,627,'bold 12px monospace','#ffe0ad');
 }else if(c.kind==='window'){
  // Story reflected in a lakeside villa window.
  round(x-140,420,280,268,9,'#6c6268');round(x-115,444,230,190,6,'#24344d');
  ctx.fillStyle='#e8bd9499';ctx.fillRect(x-3,445,6,185);ctx.fillRect(x-115,528,230,5);
  ctx.strokeStyle='#c89a74';ctx.lineWidth=5;ctx.strokeRect(x-127,430,254,214);text('STORIES',x-32,491,'bold 13px monospace','#ffdca9');
 }
 // Prompt is screen UI only near an accessible portal; no permanent markers.
 if(Math.abs(c.at-state.worldX)<330){ellipse(x,385,3,3,'#ffdfb1');}
 const high=['ufo','balloon','plane'].includes(c.kind);
 hooks.push({x:x-(high?275:151),y:high?115:390,w:high?450:303,h:high?300:310,carrier:c});
}
// V10: transition occluders are world-anchored ONLY at authored geographic joins.
// No decorative/full-height object is spawned in ordinary road segments.
// Transparent foreground assets are authored at 1020px height and cover the
// entire 900px logical viewport with 60px safety overscan on both ends.
// V11: One authored join. Measured on the 9000×704 original panorama.
// The only visible warm-valley / cool-forest art join is x≈6120.
// Other V10 masks were inside continuous scenery and are intentionally removed.
const TRANSITION_ZONES = Object.freeze([
 {id:'warm-valley-to-forest',at:6032,worldLeft:5875,key:'transitionNative',width:510,label:'暖色山谷 → 松林'}
]);
const OCCLUSION_TOP=-60, OCCLUSION_HEIGHT=H+120;
const carMeta={sourceW:1520,sourceH:724, tireBottomTop:718,
 // Image coordinates are measured in source pixels from the bottom-left origin.
 wheels:[{asset:'rear',x:329,y:117},{asset:'front',x:1234,y:117}],
 hubRadius:62};
function positionWheel(point,left,top,scale){
 return {x:left+point.x*scale,y:top+(carMeta.sourceH-point.y)*scale};
}
function renderVehicle(){
 const im=images.car;if(!ready('car'))return;
 const carW=444,scale=carW/carMeta.sourceW,carH=carMeta.sourceH*scale;
 const sx=323,groundY=742;
 const top=groundY-carMeta.tireBottomTop*scale + Math.sin(state.worldX/68)*Math.min(.55,Math.abs(state.speed)/200);
 ctx.save();
 // Shadow and chrome inserts use same wheel center transform; no per-frame guessing.
 ellipse(sx+carW*.52,groundY,190,7,'rgba(4,8,20,.35)');
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(im,sx,top,carW,carH);
 for(const axle of carMeta.wheels){
  if(!ready(axle.asset))continue;
  const c=positionWheel(axle,sx,top,scale),r=carMeta.hubRadius*scale;
  ctx.save();ctx.translate(c.x,c.y);ctx.rotate(state.angle);
  ctx.drawImage(images[axle.asset],-r,-r,r*2,r*2);ctx.restore();
 }
 // Small wheel-independent night headlight beam.
 if(state.worldX>2600&&state.worldX<3390){
  ctx.fillStyle='#ffd8a01c';ctx.beginPath();ctx.moveTo(sx+carW*.91,top+110);ctx.lineTo(sx+carW+270,top-20);ctx.lineTo(sx+carW+270,top+200);ctx.fill();
 }
 ctx.restore();
}
function visibleTransitionZones(){
 // A world seam has one and only one foreground mask. Camera motion never
 // manufactures masks between seams; they enter and exit with the scenery.
 return TRANSITION_ZONES.map(z=>({...z,x:Math.round(px(z.worldLeft))}))
     .filter(z=>z.x<W&&z.x+z.width>0);
}
function renderForeground(){
 for(const o of visibleTransitionZones()){
   if(!ready(o.key))continue;
   ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.drawImage(images[o.key],o.x,OCCLUSION_TOP,o.width,OCCLUSION_HEIGHT);
   ctx.restore();
 }
}

function render(){camera=clamp(state.worldX-420,0,WORLD_WIDTH-W);ctx.clearRect(0,0,W,H);hooks.length=0;drawImageLayer();drawGround();tunnelOverlay();
 carriers.forEach(renderCarrier);renderVehicle();renderForeground();positionBird();
 // World scene labels are derived from actual travel position, not a swapped texture name.
 let location='黄昏海岸 · 沿着海湾出发';if(state.worldX>2100)location='海崖山壁 · 岩石在靠近';if(state.worldX>2700)location='山海隧道 · 灯光渐渐亮起';if(state.worldX>3500)location='林间公路 · 松林接替海岸';if(state.worldX>6000)location='湖畔小镇 · 旅程慢下来';
 const chapter=scenicRoute.chapters.find(q=>state.worldX>=q.start&&state.worldX<q.end);
 if(chapter)location=chapter.name+' · 继续向下一段风景出发';
 $('#location').textContent=location;$('#landmark').textContent=location.split(' · ')[0]+' / 地貌连续运行';$('#progress').style.width=`${(state.worldX/END*100).toFixed(1)}%`;
 $('#speed').textContent=`${String(Math.round(state.speed)).padStart(3,'0')} km/h · ↶ 倒车  → 加速  E 作品  空格暂停`;
 const near=carriers.reduce((best,c)=>Math.abs(c.at-state.worldX)<(best?Math.abs(best.at-state.worldX):330)?c:best,null);
 state.near=near&&Math.abs(near.at-state.worldX)<330?near:null;
 $('#prompt').hidden=!state.near||state.viewer;
 if(state.near)$('#prompt-name').textContent=state.near.label;
}
function frame(now){if(!state.last)state.last=now;const dt=Math.min((now-state.last)/1000,.045);state.last=now;
 if(!state.paused&&!state.viewer){if(state.cruise&&state.speed>=0&&state.speed<135)state.speed=Math.min(135,state.speed+16*dt);const next=state.worldX+state.speed*dt;state.worldX=next>END?300+(next-END):next<300?END-(300-next):next;state.angle+=state.speed*dt/35;state.t+=dt;}
 render();requestAnimationFrame(frame);
}
function openCarrier(c){const list=carrierWorks(c);if(!list.length){toast('这个载体目前尚未绑定视频');return;}activeWork=list[0];notifyHost('DANNY_ROAD_OPEN_WORK',{portal:c.id,count:list.length});$('#viewer').hidden=false;state.viewer=true;state.paused=true;
 const select=$('#playlist');select.innerHTML='';select.hidden=list.length<=1;for(const work of list){let o=document.createElement('option');o.value=work.id;o.textContent=work.title;select.appendChild(o)}
 select.onchange=()=>loadFilm(list.find(w=>w.id===select.value));loadFilm(activeWork);
}
function loadFilm(w){activeWork=w;$('#movie-title').textContent=w.title;$('#slot-info').textContent=`入口 ${w.id} · ${w.portal} · ${w.category||'作品'} · 支持本地视频路径`;const vid=$('#video');vid.pause();vid.removeAttribute('src');vid.load();vid.hidden=true;$('#empty').hidden=false;if(w.poster){$('#empty').style.backgroundImage=`linear-gradient(#10192970,#1019298f),url("${String(w.poster).replace(/"/g,'')}")`;$('#empty').style.backgroundSize='cover';}else{$('#empty').style.backgroundImage='';}if(w.file){vid.src=w.file;vid.hidden=false;$('#empty').hidden=true;vid.play().catch(()=>{});}}
function closeViewer(){notifyHost('DANNY_ROAD_CLOSE_WORK',{});const v=$('#video');v.pause();v.removeAttribute('src');v.load();$('#viewer').hidden=true;state.viewer=false;state.paused=false;}
$('#close').onclick=closeViewer;
$('#pick-video').onchange=e=>{const file=e.target.files?.[0];if(!file)return;if(pickedURL)URL.revokeObjectURL(pickedURL);pickedURL=URL.createObjectURL(file);const v=$('#video');v.pause();v.src=pickedURL;v.hidden=false;$('#empty').hidden=true;v.play().catch(()=>{});};
canvas.addEventListener('click',e=>{const rc=canvas.getBoundingClientRect(),x=(e.clientX-rc.left)/rc.width*W,y=(e.clientY-rc.top)/rc.height*H;const h=hooks.find(z=>x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h);if(h)openCarrier(h.carrier);});
function setSpeed(delta){state.speed=clamp(state.speed+delta,-160,280);state.cruise=false;state.paused=false;}
function driveBackward(){if(state.paused&&state.worldX>=END)state.worldX=END-400;state.speed=state.speed>0?-90:Math.max(-160,state.speed-35);state.cruise=false;state.paused=false;}
$('#btn-next').onclick=()=>setSpeed(34);$('#btn-prev').onclick=driveBackward;
$('#btn-cruise').onclick=()=>{state.paused=!state.paused;state.cruise=true;$('#btn-cruise').textContent=state.paused?'▶':'Ⅱ';};
window.addEventListener('keydown',e=>{if(e.target===bird&&e.key===' ')return;if(state.viewer){if(e.key==='Escape')closeViewer();return;}if(!routeMap.hidden){if(e.key==='Escape')mapClose();return;}if(['ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();if(e.repeat)return;
 if(e.key==='ArrowRight')setSpeed(35);if(e.key==='ArrowLeft')driveBackward();if(e.key===' '){$('#btn-cruise').click();}if(e.key.toLowerCase()==='e'&&state.near)openCarrier(state.near);if(e.key.toLowerCase()==='m')toggleMusic();
});
$('#touch-slow').onclick=driveBackward;$('#touch-fast').onclick=()=>setSpeed(30);$('#touch-portal').onclick=()=>{if(state.near)openCarrier(state.near);};
$('#btn-full').onclick=()=>{if(!document.fullscreenElement)$('#app').requestFullscreen?.();else document.exitFullscreen?.();};
// Three original synthetic radio settings; no remote API, local files override.
let audioCtx=null,oscillators=[],gains=[],radioFile=new Audio();radioFile.loop=true;
function startSynth(){if(audioCtx)return;const Actx=window.AudioContext||window.webkitAudioContext;if(!Actx){toast('浏览器不支持 WebAudio');return;}audioCtx=new Actx();const names=['sine','triangle','sine','sine'];for(let i=0;i<4;i++){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=names[i];g.gain.value=0;o.connect(g);g.connect(audioCtx.destination);o.start();oscillators.push(o);gains.push(g);}}
function updateRadio(){const s=stations[state.station];$('#station').textContent=s.name;for(let i=0;i<oscillators.length;i++){oscillators[i].frequency.setTargetAtTime(s.chord[i]/(i===0?2:1),audioCtx.currentTime,.7);gains[i].gain.setTargetAtTime(state.radioOn&&!localAudioURL&&!s.file?[.028,.018,.013,.009][i]:0,audioCtx.currentTime,.5);}}
function resetMusic(){state.radioOn=false;radioFile.pause();if(audioCtx)updateRadio();$('#btn-radio').textContent='▶ 播放';$('#btn-mute').textContent='♫ MUSIC';}
function toggleMusic(){state.radioOn=!state.radioOn;if(state.radioOn){startSynth();audioCtx?.resume();const stationFile=localAudioURL||stations[state.station].file;if(stationFile){if(radioFile.src!==new URL(stationFile,document.baseURI).href)radioFile.src=stationFile;radioFile.play().catch(()=>{resetMusic();toast('浏览器拦截了自动播放，请再次点击播放');});}else updateRadio();}else resetMusic();$('#btn-radio').textContent=state.radioOn?'Ⅱ 暂停':'▶ 播放';$('#btn-mute').textContent=state.radioOn?'♫ ON':'♫ MUSIC';}
$('#btn-radio').onclick=toggleMusic;$('#btn-mute').onclick=toggleMusic;$('#btn-next-radio').onclick=()=>{state.station=(state.station+1)%stations.length;
 localAudioURL=null;radioFile.pause();radioFile.removeAttribute('src');radioFile.load();
 const song=stations[state.station].file;
 if(state.radioOn&&song){radioFile.src=song;radioFile.play().catch(()=>{resetMusic();toast('音频播放失败，请点击播放重试');});}
 if(!audioCtx&&state.radioOn)startSynth();if(audioCtx)updateRadio();else $('#station').textContent=stations[state.station].name;
};
$('#pick-music').onchange=e=>{const f=e.target.files?.[0];if(!f)return;if(localAudioURL)URL.revokeObjectURL(localAudioURL);localAudioURL=URL.createObjectURL(f);radioFile.src=localAudioURL;if(!state.radioOn){state.radioOn=true;startSynth();}updateRadio();radioFile.play().catch(()=>{});$('#station').textContent=f.name;$('#btn-radio').textContent='Ⅱ 暂停';};
// Embedded inside the six-face site: a tiny, explicit postMessage contract.
function notifyHost(type,payload){if(window.parent!==window)window.parent.postMessage({source:'DANNY_ROAD',type,...payload},'*');}
$('#btn-exit').onclick=()=>{if(window.parent!==window){notifyHost('DANNY_ROAD_EXIT',{});return;}
 if(settings.homeUrl){window.location.href=settings.homeUrl;}else toast('在六面网站中可由这里返回总站；当前为独立试玩');};
const routeMap=$('#route-map');const wasPaused=()=>state.paused;
function mapOpen(){state.mapWasPaused=wasPaused();state.paused=true;routeMap.hidden=false;buildMap();}
function mapClose(){routeMap.hidden=true;state.paused=Boolean(state.mapWasPaused);}
$('#btn-map').onclick=()=>routeMap.hidden?mapOpen():mapClose();$('#map-close').onclick=mapClose;
$('#btn-guide').onclick=()=>toast('← 减速　→ 加速　空格暂停　E 进入作品　M 音乐　Esc 关闭作品');
function buildMap(){const host=$('#map-content');host.replaceChildren();
 carriers.forEach(c=>{const b=document.createElement('button');b.className='map-point';
 const n=carrierWorks(c).length;b.textContent=`${c.description||'旅途'}  ·  ${c.label}  (${n} 部)`;
 b.onclick=()=>{state.worldX=clamp(c.at-105,300,END);state.speed=60;state.cruise=true;state.last=0;mapClose();toast('已抵达附近，可以继续往前开');};host.appendChild(b);});
 if(scenicRoute.chapters.length){
  const heading=document.createElement('h3');heading.textContent='继续旅行 · 经典旧场景回归';heading.className='map-section-label';host.appendChild(heading);
  for(const q of scenicRoute.chapters){const b=document.createElement('button');b.className='map-point landscape-point';b.textContent=`✦ ${q.name} · 风景路段`;b.onclick=()=>{state.worldX=clamp(q.start+480,300,END);state.speed=65;state.cruise=true;state.last=0;mapClose();toast('继续开车，前方还有更多风景');};host.appendChild(b);}
 }
}
window.addEventListener('message',event=>{if(event.source!==window.parent||!event.data||event.data.source!=='DANNY_HOST')return;
 if(event.data.type==='PAUSE')state.paused=true;
 if(event.data.type==='RESUME'&&!state.viewer&&!routeMap.hidden)return;
 if(event.data.type==='RESUME'&&!state.viewer)state.paused=false;
 if(event.data.type==='GO_TO'&&Number.isFinite(event.data.x)){state.worldX=clamp(event.data.x,300,END);state.last=0;}
});
radioFile.addEventListener('error',()=>{if(state.radioOn&&!localAudioURL){toast('电台音频缺失，已使用合成电台');if(audioCtx)updateRadio();}});
if(new URLSearchParams(location.search).get('autoplay')==='1')toggleMusic();
// A QA-only hook, not a user-facing transition picker. ?qa=1 opens no UI.
window.DANNY_QA={scenicChapters(){return scenicRoute.chapters},worldWidth:WORLD_WIDTH,mapPortals(){return carriers.map(c=>({id:c.id,x:c.at,count:carrierWorks(c).length}));},transitionZones(){return visibleTransitionZones().map(z=>({id:z.id,at:z.at,x:z.x,width:z.width,top:OCCLUSION_TOP,bottom:OCCLUSION_TOP+OCCLUSION_HEIGHT}));},go(x){state.worldX=clamp(x,300,END);state.paused=true;state.speed=0;render();},drive(x,spd){state.worldX=clamp(x,300,END);state.paused=false;state.speed=spd;state.cruise=false;state.last=0;}, wheelPoints(){const s=444/carMeta.sourceW;const y=742-carMeta.tireBottomTop*s;return carMeta.wheels.map(a=>({asset:a.asset,...positionWheel(a,323,y,s)}));},get foreground(){return visibleTransitionZones()},state,carriers,works,render};
Promise.all(Object.values(images).map(im=>new Promise(r=>{if(im.complete)r();else{im.onload=r;im.onerror=r;}}))).then(()=>toast('连续地貌已加载 · 向右出发'));
notifyHost('DANNY_ROAD_READY',{version:'Scenic Expanded V12',portals:carriers.length,works:works.length,scenes:scenicRoute.chapters.length});
requestAnimationFrame(frame);
})();
