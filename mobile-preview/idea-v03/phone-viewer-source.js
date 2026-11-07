// Adapted from the previously delivered phone-stand viewer. The models and
// four-part explode offsets are reused without changing the Blender assets.
import * as THREE from './stand/vendor/three.module.js';
import {OrbitControls} from './stand/vendor/controls/OrbitControls.js';
import {GLTFLoader} from './stand/vendor/loaders/GLTFLoader.js';
import {RoomEnvironment} from './stand/vendor/environments/RoomEnvironment.js';

export async function mountPhoneStand(root){
  const canvas=root.querySelector('#phone-canvas'),poster=root.querySelector('#phone-poster');
  const stage=root.querySelector('.phone-stage'),status=root.querySelector('#phone-status');
  const controlsById=Object.fromEntries(['assembled','exploded','reset','baseline','thicker'].map(id=>[id,root.querySelector('#phone-'+id)]));
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});}
  catch(error){status.textContent='当前设备暂时无法打开三维，可先查看概念参考图。';throw error;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.7;
  const scene=new THREE.Scene(),pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
  const camera=new THREE.PerspectiveCamera(38,1,.001,10),orbit=new OrbitControls(camera,canvas);
  orbit.enableDamping=true;orbit.enablePan=false;orbit.minDistance=.20;orbit.maxDistance=.80;orbit.maxPolarAngle=Math.PI*.56;
  scene.add(new THREE.HemisphereLight(0xffffff,0xb0b5af,.7));
  const loader=new GLTFLoader(),models={},offset=new THREE.Vector3();
  let active,version='baseline',amount=0,target=0,previous=performance.now(),visible=false,disposed=false,raf=0;
  const paths={baseline:'./stand/assets/stand-v01.glb',thicker:'./stand/assets/stand-v01-base-plus20.glb'};
  function render(now){
    raf=0;if(disposed||!visible||document.hidden)return;
    const dt=Math.min((now-previous)/1000,.05);previous=now;amount=THREE.MathUtils.damp(amount,target,7,dt);
    if(Math.abs(amount-target)<.001)amount=target;
    if(active)for(const o of active.userData.parts){offset.fromArray(o.userData.explode_offset);o.position.copy(o.userData.rest).addScaledVector(offset,amount);}
    orbit.update();renderer.render(scene,camera);raf=requestAnimationFrame(render);
  }
  function start(){if(!disposed&&visible&&!document.hidden&&!raf){previous=performance.now();raf=requestAnimationFrame(render);}}
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(w&&h){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}}
  function reset(){camera.position.set(.21,.17,.30);orbit.target.set(0,.095,0);orbit.update();}
  function sync(){
    for(const id of ['assembled','exploded'])controlsById[id].setAttribute('aria-pressed',String(id===(target?'exploded':'assembled')));
    for(const id of ['baseline','thicker'])controlsById[id].setAttribute('aria-pressed',String(id===version));
    status.textContent=(version==='baseline'?'底座 8 mm':'底座 9.6 mm')+' · '+(target?'已分开，显示 4 个主要部件':'完整组合，可拖动旋转');
  }
  function show(v){if(!models[v])return;if(active)scene.remove(active);active=models[v];version=v;scene.add(active);sync();}
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
  const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(raf);raf=0;}},{rootMargin:'100px'});visibilityObserver.observe(stage);
  const onVisibility=()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else start();};
  document.addEventListener('visibilitychange',onVisibility);
  function dispose(){
    if(disposed)return;disposed=true;cancelAnimationFrame(raf);resizeObserver.disconnect();visibilityObserver.disconnect();document.removeEventListener('visibilitychange',onVisibility);orbit.dispose();
    for(const model of Object.values(models))model.traverse(o=>{o.geometry?.dispose();if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();});
    environment.dispose();renderer.dispose();
  }
  window.addEventListener('pagehide',event=>{
    if(event.persisted){cancelAnimationFrame(raf);raf=0;}else dispose();
  });
  window.addEventListener('pageshow',event=>{if(event.persisted){resize();start();}});
  try{
    await Promise.all(Object.entries(paths).map(async([key,path])=>{
      const gltf=await loader.loadAsync(new URL(path,import.meta.url).href),model=gltf.scene;
      model.userData.parts=[];model.traverse(o=>{if(o.userData.component_label){o.userData.rest=o.position.clone();model.userData.parts.push(o);}});
      if(model.userData.parts.length!==4)throw new Error('Expected four independent modules');
      models[key]=model;return model;
    }));
    if(disposed)return;
    canvas.hidden=false;poster.hidden=true;resize();reset();show('baseline');
    for(const button of Object.values(controlsById))button.disabled=false;
    controlsById.assembled.onclick=()=>{target=0;sync();};
    controlsById.exploded.onclick=()=>{target=1;sync();};
    controlsById.baseline.onclick=()=>show('baseline');
    controlsById.thicker.onclick=()=>show('thicker');
    controlsById.reset.onclick=reset;
    canvas.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
      e.preventDefault();const p=camera.position.clone().sub(orbit.target);
      p.applyAxisAngle(new THREE.Vector3(0,1,0),e.key==='ArrowLeft'?.15:-.15);camera.position.copy(p.add(orbit.target));orbit.update();
    });
    start();
  }catch(error){
    dispose();status.textContent='三维暂时无法打开，可先查看左侧概念图和修改对比。';
    console.error('Phone stand viewer:',error);
  }
}
