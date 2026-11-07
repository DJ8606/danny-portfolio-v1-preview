/* DiaoGePose V02 — local transparent WebP sprite atlas, no network or libraries.
   Uses 2.5D extracted poses, NOT a true 3D rig.
   API: new DiaoGePose({canvas, pointerTarget, basePath:'assets'}); .start(); .react(); .destroy()
*/
(function(){'use strict';
const META={front:{start:0,count:1},left:{start:1,count:46},right:{start:47,count:32},up:{start:79,count:40},down:{start:119,count:24}};
const W=390,H=540,COLS=5,PER=20;
let sharedAssets=new Map();
function clamp(v,l,h){return Math.max(l,Math.min(h,v));}
function loadSprites(path){
  if(sharedAssets.has(path))return sharedAssets.get(path);
  const result=Promise.all(Array.from({length:8},(_,i)=>new Promise((resolve,reject)=>{
    const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('动作素材加载失败：'+img.src));
    img.src=path+'/atlas_'+String(i).padStart(2,'0')+'.webp';
  })));
  sharedAssets.set(path,result);return result;
}
class DiaoGePose{
  constructor({canvas,pointerTarget,basePath='assets',sensitivity=.85,smoothing=120,enableIdle=true}={}){
    if(!canvas||!pointerTarget)throw Error('DiaoGePose 需要 canvas 与 pointerTarget');
    this.cv=canvas;this.cv.width=W;this.cv.height=H;this.ctx=canvas.getContext('2d',{alpha:true});
    this.target=pointerTarget;this.path=basePath;this.sensitivity=sensitivity;this.smoothing=smoothing;this.enableIdle=enableIdle;
    this.x=this.y=this.tx=this.ty=0;this.running=false;this.visible=true;this.sprites=null;
    this.last=performance.now();this.lastInput=this.last;this.idlePhase=0;this.reactionUntil=0;
    this.reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.move=this.onPointer.bind(this);this.leave=()=>{this.tx=0;this.ty=0;this.lastInput=performance.now();};
    this.target.addEventListener('pointermove',this.move,{passive:true});this.target.addEventListener('pointerleave',this.leave);
    this.observer=('IntersectionObserver' in window)?new IntersectionObserver((e)=>{this.visible=e[0].isIntersecting;},{rootMargin:'120px'}):null;
    if(this.observer)this.observer.observe(this.cv);
  }
  onPointer(e){if(e.pointerType==='touch')return;const r=this.target.getBoundingClientRect();
    this.tx=clamp((2*(e.clientX-r.left)/r.width-1)*this.sensitivity,-1,1);
    this.ty=clamp((2*(e.clientY-r.top)/r.height-1)*this.sensitivity,-1,1);
    this.lastInput=performance.now();
  }
  async start(){
    try{this.sprites=await loadSprites(this.path);this.running=true;
      if(this.reduceMotion){this.draw(META.front.start);return true;}
      this.last=performance.now();this.raf=requestAnimationFrame(t=>this.loop(t));return true;
    }catch(err){console.error(err);return false;}
  }
  react(){if(this.reduceMotion)return;this.reactionUntil=performance.now()+700;}
  getIndex(name,amount){const m=META[name];return m.start+Math.round(clamp(amount,0,1)*(m.count-1));}
  draw(idx){if(!this.sprites)return;const im=this.sprites[Math.floor(idx/PER)],f=idx%PER;
    this.ctx.clearRect(0,0,W,H);this.ctx.drawImage(im,f%COLS*W,Math.floor(f/COLS)*H,W,H,0,0,W,H);
  }
  loop(t){if(!this.running)return;const dt=clamp(t-this.last,0,64);this.last=t;
    if(this.visible){let destX=this.tx,destY=this.ty;
      // autonomous small observation only when user is not moving pointer
      if(this.enableIdle&&t-this.lastInput>5400){
        const period=(t-this.lastInput-5400)%8600;
        const gently=Math.pow(Math.sin(Math.PI*clamp(period/2600,0,1)),2);
        destX=(Math.floor((t-this.lastInput-5400)/8600)%2===0?-.16:.14)*gently;destY=0;
      }
      if(t<this.reactionUntil){let p=1-(this.reactionUntil-t)/700;destX*=.25;destY=-.48*Math.sin(p*Math.PI);}
      const ease=this.smoothing===0?1:1-Math.exp(-dt/this.smoothing);
      this.x+=(destX-this.x)*ease;this.y+=(destY-this.y)*ease;
      const xx=this.x,yy=this.y,ax=Math.abs(xx),ay=Math.abs(yy);
      let index=0;
      if(Math.max(ax,ay)>.055){const name=ax>=ay?(xx<0?'left':'right'):(yy<0?'up':'down');index=this.getIndex(name,Math.max(ax,ay));}
      this.draw(index);
    }
    this.raf=requestAnimationFrame(nt=>this.loop(nt));
  }
  destroy(){this.running=false;cancelAnimationFrame(this.raf);if(this.observer)this.observer.disconnect();
    this.target.removeEventListener('pointermove',this.move);this.target.removeEventListener('pointerleave',this.leave);}
}
window.DiaoGePose=DiaoGePose;
})();
