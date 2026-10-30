/* DANNY V03 — SELF-CONTAINED procedural WebGL concept object.
   No network, 3D engine, imported GLB, AI-generation endpoint, or proprietary model required.
   This is fictional visual assembly; not a manufacturing disassembly sequence. */
(()=>{'use strict';
const canvas=document.getElementById('v03-canvas'); if(!canvas)return;
const stage=document.getElementById('v03-stage'); const status=document.getElementById('v03-status');
const log=(msg)=>{ if(status) status.textContent=msg; };
const gl=canvas.getContext('webgl',{antialias:true,alpha:true,depth:true,premultipliedAlpha:false, preserveDrawingBuffer:true}) || canvas.getContext('experimental-webgl',{antialias:true,alpha:true,depth:true});
if(!gl){stage.classList.add('fallback');log('此设备无法启动 WebGL。可阅读交接文档查看演示截图。');return;}
const vs=`attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uMVP;uniform mat4 uModel;varying vec3 vNormal;varying vec3 vWorld;void main(){vec4 w=uModel*vec4(aPosition,1.0);vWorld=w.xyz;vNormal=normalize(mat3(uModel)*aNormal);gl_Position=uMVP*vec4(aPosition,1.0);}`;
const fs=`precision highp float;varying vec3 vNormal;varying vec3 vWorld;uniform vec3 uColor;uniform vec3 uCamera;uniform float uGloss;uniform float uEmissive;uniform float uTime;uniform float uLines;void main(){vec3 n=normalize(vNormal);vec3 v=normalize(uCamera-vWorld);vec3 l=normalize(vec3(-0.38,0.85,0.72));vec3 l2=normalize(vec3(0.85,0.2,-0.52));float d=max(dot(n,l),0.0);float d2=max(dot(n,l2),0.0);vec3 h=normalize(v+l);vec3 h2=normalize(v+l2);float sp=pow(max(dot(n,h),0.0),mix(14.0,110.0,uGloss));float sp2=pow(max(dot(n,h2),0.0),60.0);float edge=pow(1.0-max(dot(n,v),0.0),2.5);vec3 col=uColor*(0.19+0.75*d+0.27*d2)+vec3(1.0,0.87,0.67)*sp*(0.35+1.45*uGloss)+vec3(0.46,0.77,1.0)*sp2*0.28+uColor*edge*0.43;col+=uColor*(0.22+0.1*sin(uTime*1.7))*uEmissive; if(uLines>0.5){col=mix(vec3(0.10,0.52,0.64),vec3(0.43,0.91,1.0),0.46+d*.42)+vec3(sp*.12);}gl_FragColor=vec4(col,1.0);}`;
function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
let program;
try{program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vs));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}catch(e){stage.classList.add('fallback');log('WebGL 初始化失败：'+e.message);return;}
gl.useProgram(program);
const A={p:gl.getAttribLocation(program,'aPosition'),n:gl.getAttribLocation(program,'aNormal')};
const U={mvp:gl.getUniformLocation(program,'uMVP'),model:gl.getUniformLocation(program,'uModel'),color:gl.getUniformLocation(program,'uColor'),camera:gl.getUniformLocation(program,'uCamera'),gloss:gl.getUniformLocation(program,'uGloss'),emissive:gl.getUniformLocation(program,'uEmissive'),time:gl.getUniformLocation(program,'uTime'),lines:gl.getUniformLocation(program,'uLines')};
const I=()=>[1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
function mul(a,b){const out=Array(16).fill(0);for(let j=0;j<4;j++)for(let i=0;i<4;i++)for(let k=0;k<4;k++)out[j*4+i]+=a[k*4+i]*b[j*4+k];return out;}
const T=(x,y,z)=>[1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1];
const S=(x,y,z)=>[x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1];
const RX=a=>{const c=Math.cos(a),s=Math.sin(a);return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]};
const RY=a=>{const c=Math.cos(a),s=Math.sin(a);return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]};
const RZ=a=>{const c=Math.cos(a),s=Math.sin(a);return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]};
const compose=(...transforms)=>transforms.reduce((a,b)=>mul(a,b),I());
function norm(a){const l=Math.hypot(...a)||1;return a.map(x=>x/l)};
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]};
function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far+near)*nf,-1, 0,0,2*far*near*nf,0]}
function lookAt(eye,target){const z=norm(eye.map((v,i)=>v-target[i]));const x=norm(cross([0,1,0],z));const y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-x.reduce((s,v,i)=>s+v*eye[i],0),-y.reduce((s,v,i)=>s+v*eye[i],0),-z.reduce((s,v,i)=>s+v*eye[i],0),1]}
function mesh(verts,faces){const arr=[];const indices=[];faces.forEach(f=>{let normal; const a=verts[f[0]],b=verts[f[1]],c=verts[f[2]];normal=norm(cross(b.map((x,i)=>x-a[i]),c.map((x,i)=>x-a[i])));for(let j=1;j<f.length-1;j++){for(const k of [f[0],f[j],f[j+1]]){arr.push(...verts[k],...normal);indices.push(indices.length);}}});return upload(arr,indices);}
function upload(arr,inds){const raw=new Float32Array(arr),tri=new Uint16Array(inds),edges=[];const unique=new Set();for(let i=0;i<tri.length;i+=3)for(const [a,b] of [[tri[i],tri[i+1]],[tri[i+1],tri[i+2]],[tri[i+2],tri[i]]]){const key=Math.min(a,b)+','+Math.max(a,b);if(!unique.has(key)){unique.add(key);edges.push(a,b);}}const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,raw,gl.STATIC_DRAW);const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,tri,gl.STATIC_DRAW);const eb=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,eb);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(edges),gl.STATIC_DRAW);return {vb,ib,eb,count:tri.length,ecount:edges.length};}
function lathe(profile,N=36){let v=[],f=[];for(let i=0;i<profile.length;i++){const [r,y]=profile[i];for(let s=0;s<N;s++){const a=2*Math.PI*s/N;v.push([r*Math.cos(a),y,r*Math.sin(a)])}}for(let i=0;i<profile.length-1;i++)for(let j=0;j<N;j++){const n=(j+1)%N,a=i*N+j,b=i*N+n,c=(i+1)*N+n,d=(i+1)*N+j;f.push([a,b,c,d])}return mesh(v,f)}
function torus(R,r,N=78,M=12){const vs=[],fs=[];for(let i=0;i<N;i++){let t=i*2*Math.PI/N;for(let j=0;j<M;j++){let p=j*2*Math.PI/M;vs.push([(R+r*Math.cos(p))*Math.cos(t),r*Math.sin(p),(R+r*Math.cos(p))*Math.sin(t)])}}for(let i=0;i<N;i++)for(let j=0;j<M;j++){const a=i*M+j,b=i*M+(j+1)%M,c=((i+1)%N)*M+(j+1)%M,d=((i+1)%N)*M+j;fs.push([a,b,c,d])}return mesh(vs,fs)}
function box(w=1,h=1,d=1){let x=w/2,y=h/2,z=d/2;return mesh([[-x,-y,-z],[x,-y,-z],[x,y,-z],[-x,y,-z],[-x,-y,z],[x,-y,z],[x,y,z],[-x,y,z]],[[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]])}
function ico(r=1){const t=(1+Math.sqrt(5))/2;const base=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]].map(x=>norm(x).map(q=>q*r));const faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];let vertices=[],tris=[];faces.forEach(face=>{const A=base[face[0]],B=base[face[1]],C=base[face[2]];const m=(x,y)=>norm(x.map((v,i)=>(v+y[i])/2)).map(q=>q*r);const ab=m(A,B),bc=m(B,C),ca=m(C,A),ix=vertices.length;vertices.push(A,B,C,ab,bc,ca);tris.push([ix,ix+3,ix+5],[ix+1,ix+4,ix+3],[ix+2,ix+5,ix+4],[ix+3,ix+4,ix+5])});return mesh(vertices,tris)}
const G={plinth:lathe([[0,-1.97],[1.42,-1.97],[1.49,-1.91],[1.49,-1.64],[1.42,-1.58],[0,-1.58]],8),trim:torus(1.0,.044,52,9),disc:lathe([[0,-.13],[.84,-.13],[.86,-.05],[.84,.03],[.69,.09],[.6,.21],[.0,.21]],32),needle:lathe([[0,-.62],[.055,-.62],[.08,-.50],[.068,.43],[.02,.52],[0,.52]],12),ring:torus(1.05,.076,72,13),thin:torus(1.18,.035,76,9),screw:lathe([[0,-.042],[.07,-.042],[.085,-.025],[.085,.03],[.065,.053],[0,.053]],10),core:ico(.58),guard:lathe([[.0,-.27],[.55,-.27],[.7,-.22],[.82,-.15],[.84,-.03],[.83,.0],[.76,.04]],42),fin:box(.19,.47,.29),beam:box(.1,1.03,.1),brace:box(.09,.12,.54),panel:box(.26,.18,.12),spike:lathe([[.075,-.32],[.12,-.21],[.085,.07],[.052,.32],[0,.44]],9),crown:lathe([[.0,-.10],[.62,-.10],[.72,-.06],[.72,.02],[.6,.08],[.51,.1]],36),vane:box(.1,.52,.17)};
const parts=[];function add(meshId,mat,xform,group,exp=[0,0,0],glow=0,shine=.8){parts.push({mesh:G[meshId],mat,xform,group,exp,glow,shine})}
add('plinth','graphite',I(),0);add('trim','metal',compose(T(0,-1.62,0),S(1.42,.83,1.42)),0);add('thin','bright',compose(T(0,-1.72,0),S(1.12,1,1.12)),0);
add('disc','graphite',compose(T(0,-1.48,0),S(1.0,.52,1.0)),0);
add('guard','metal',compose(T(0,-1.09,0),S(.80,.9,.80)),1,[0,-.39,0]);
add('disc','metal',compose(T(0,-1.10,0),S(.58,.19,.58)),1,[0,-.39,0]);
add('needle','graphite',compose(T(0,-.70,0),S(1.2,1.15,1.2)),1,[0,-.39,0]);
for(let n=0;n<8;n++){let a=n*2*Math.PI/8;let xx=Math.cos(a),zz=Math.sin(a);add('beam','metal',compose(T(xx*.65,-.53,zz*.65),RY(-a),RZ(.1)),1,[0,-.39,0]);add('screw','bright',T(xx*.60,-1.13,zz*.60),1,[0,-.39,0]);}
// gyroscopic orbital cluster: 3 independently articulated rings
add('ring','metal',compose(T(0,.24,0),RY(.30),RX(.32)),3,[.73,.55,-.12]);add('thin','bright',compose(T(0,.24,0),RX(.32),S(.79,.79,.79)),3,[.73,.55,-.12]);
add('thin','bright',compose(T(0,.24,0),RZ(.85),RX(.68)),4,[-.66,.84,.2]);
add('ring','accent',compose(T(0,.24,0),RY(.86),RZ(1.26),S(.87,.87,.87)),5,[.1,1.08,.68]);
// orbit clamps and machining notches
for(let n=0;n<12;n++){const a=n*Math.PI/6,xx=Math.cos(a),zz=Math.sin(a);add('fin',n%3===0?'bright':'metal',compose(T(xx*1.35,.23,zz*1.35),RY(-a),RZ(.18),S(1,1,1)),3,[.73,.55,-.12]);add('panel','graphite',compose(T(xx*.97,.23,zz*.97),RY(-a)),3,[.73,.55,-.12]);}
for(let n=0;n<24;n++){let a=n*Math.PI/12;let x=Math.cos(a),z=Math.sin(a);add('screw',n%3===0?'accent':'bright',compose(T(x*1.035,.24,z*1.035),RX(Math.PI/2)),3,[.73,.55,-.12]);}
for(let n=0;n<20;n++){let a=n*Math.PI/10;let x=Math.cos(a),z=Math.sin(a);add('screw',n%4===0?'bright':'metal',compose(T(x*1.32,-1.68,z*1.32),RX(Math.PI/2)),0);}
// independently levitated energetic crystal
add('core','core',compose(T(0,.24,0),RY(.15),RX(.4)),2,[0,.38,0],.58,.9);
add('core','core',compose(T(0,.24,0),S(.63,.63,.63),RY(.4)),2,[0,.38,0],1.5,.85);
// cap / crown array separate layer
add('crown','metal',compose(T(0,1.49,0),S(.86,.7,.86)),6,[0,1.14,0]);
for(let i=0;i<8;i++){const a=i*Math.PI/4,xx=Math.cos(a),zz=Math.sin(a);add('spike',i%2?'bright':'metal',compose(T(xx*.65,1.40,zz*.65),RY(a),S(.78,.73,.78)),6,[0,1.14,0]);}
add('disc','accent',compose(T(0,1.44,0),S(.25,.2,.25)),6,[0,1.14,0]);
// intentional concept is single display artifact, not validated engineered mechanism
const finishes={gold:{metal:[.70,.50,.22],bright:[.98,.78,.43],graphite:[.083,.114,.152],accent:[.58,.75,.78],core:[.17,.78,.91]},silver:{metal:[.49,.60,.73],bright:[.86,.91,.97],graphite:[.083,.119,.152],accent:[.58,.72,.95],core:[.23,.80,.95]},onyx:{metal:[.23,.27,.35],bright:[.61,.72,.81],graphite:[.055,.074,.096],accent:[.84,.47,.23],core:[.96,.40,.18]}};
const reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const state={yaw:.48,pitch:.19,distance:7.65,targetDistance:7.65,explode:0,targetExplode:0,wire:false,finish:'gold',auto:!reduceMotion,demo:false,demoStart:0,lastPointer:null,drag:false,scrollPause:false};
function setPress(name,val){document.querySelectorAll(`[data-3d-action="${name}"]`).forEach(x=>x.setAttribute('aria-pressed',String(val)))}
function announce(msg){log(msg)}
function setFinish(f){if(!finishes[f])return;state.finish=f;document.querySelectorAll('[data-3d-finish]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset['3dFinish']===f)));announce('当前材质：'+({gold:'暖金',silver:'钛银',onyx:'黑钛'}[f])+' · 可拖动观察');}
function setExplode(v){state.targetExplode=v?1:0;state.targetDistance=v?8.9:7.65;setPress('explode',!!v);announce(v?'演示分层展开：虚构视觉结构，非真实制造装配':'回到完整形态');}
function resize(){let w=canvas.clientWidth||700,h=canvas.clientHeight||550,d=Math.min(window.devicePixelRatio||1,1.65);let ww=Math.min(1700,Math.round(w*d)),hh=Math.min(1200,Math.round(h*d));if(canvas.width!==ww||canvas.height!==hh){canvas.width=ww;canvas.height=hh;}gl.viewport(0,0,canvas.width,canvas.height)}
function drawMesh(p,model,pv,cam,time){gl.bindBuffer(gl.ARRAY_BUFFER,p.mesh.vb);gl.vertexAttribPointer(A.p,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(A.n,3,gl.FLOAT,false,24,12);gl.enableVertexAttribArray(A.p);gl.enableVertexAttribArray(A.n);gl.uniformMatrix4fv(U.model,false,new Float32Array(model));gl.uniformMatrix4fv(U.mvp,false,new Float32Array(mul(pv,model)));let col=finishes[state.finish][p.mat];gl.uniform3fv(U.color,col);gl.uniform1f(U.gloss,p.shine);gl.uniform1f(U.emissive,p.glow);gl.uniform1f(U.time,time);gl.uniform3fv(U.camera,cam);gl.uniform1f(U.lines,state.wire?1:0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,state.wire?p.mesh.eb:p.mesh.ib);gl.drawElements(state.wire?gl.LINES:gl.TRIANGLES,state.wire?p.mesh.ecount:p.mesh.count,gl.UNSIGNED_SHORT,0)}
function frame(ms){if(state.scrollPause){requestAnimationFrame(frame);return;}const seconds=ms/1000;if(state.demo){let dt=(seconds-state.demoStart)%15;if(dt<3){state.targetExplode=0;state.wire=false;state.targetDistance=7.3;}else if(dt<6){state.targetExplode=1;state.wire=false;state.targetDistance=8.2;}else if(dt<9){state.targetExplode=1;state.wire=true;state.targetDistance=8.2;}else if(dt<12){state.targetExplode=0;state.wire=false;state.targetDistance=6.45;}else{state.targetExplode=0;state.wire=false;state.targetDistance=7.3;}if(dt>9&&dt<9.1)setFinish('silver');if(dt>12.0&&dt<12.1)setFinish('gold');state.yaw+=.0035;}
else if(state.auto&&!state.drag)state.yaw+=.00175;
state.explode+=(state.targetExplode-state.explode)*.075;state.distance+=(state.targetDistance-state.distance)*.07;
resize();gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);
const dist=state.distance;const eye=[dist*Math.sin(state.yaw)*Math.cos(state.pitch),.28+dist*Math.sin(state.pitch),dist*Math.cos(state.yaw)*Math.cos(state.pitch)];let view=lookAt(eye,[0,.12+state.explode*.38,0]);let proj=perspective(Math.PI/4.45,canvas.width/canvas.height,.1,40);let pv=mul(proj,view);
// render opaque objects; depth-testing keeps the model truly spatial
for(let p of parts){let u=state.explode,off=p.exp;let pos=compose(T(off[0]*u,off[1]*u,off[2]*u),p.xform);drawMesh(p,pos,pv,eye,seconds)}
// circular HUD follows actual controller state
const el=document.getElementById('v03-live-mode');if(el)el.textContent=state.wire?'WIREFRAME':state.explode>.5?'EXPLODED VIEW':'ASSEMBLED VIEW';
requestAnimationFrame(frame)}
// Pointer controls support mouse and tablet touch.
canvas.addEventListener('pointerdown',e=>{if(state.demo){state.demo=false;setPress('demo',false)}state.drag=true;state.auto=false;state.lastPointer=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);canvas.classList.add('grabbing')});
canvas.addEventListener('pointermove',e=>{if(!state.drag||!state.lastPointer)return;let dx=e.clientX-state.lastPointer[0],dy=e.clientY-state.lastPointer[1];state.yaw+=dx*.007;state.pitch=Math.max(-.45,Math.min(.75,state.pitch+dy*.005));state.lastPointer=[e.clientX,e.clientY]});
function end(e){state.drag=false;state.lastPointer=null;canvas.classList.remove('grabbing')}
canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);
canvas.addEventListener('wheel',e=>{e.preventDefault();state.targetDistance=Math.max(4.9,Math.min(10.7,state.targetDistance+e.deltaY*.005))},{passive:false});
const acts={'explode':()=>setExplode(!state.targetExplode),'wire':()=>{state.wire=!state.wire;setPress('wire',state.wire);announce(state.wire?'几何线框视图（概念模型）':'返回材质视图')},'focus':()=>{state.targetDistance=state.targetDistance<6?7.65:5.7;setPress('focus',state.targetDistance<6);announce('镜头距离已切换')},'reset':()=>{state.yaw=.48;state.pitch=.19;state.targetDistance=7.65;state.auto=true;state.demo=false;state.wire=false;setPress('wire',false);setPress('demo',false);setPress('focus',false);setExplode(0);announce('已恢复初始展示视角')},'demo':()=>{state.demo=!state.demo;state.auto=state.demo;state.demoStart=performance.now()/1000;setPress('demo',state.demo);announce(state.demo?'正在自动播放 15 秒概念展示（可随时拖动打断）':'已暂停自动演示，仍可手动操作')}};
document.querySelectorAll('[data-3d-action]').forEach(b=>{let act=b.dataset['3dAction'];if(acts[act])b.addEventListener('click',acts[act])});
document.querySelectorAll('[data-3d-finish]').forEach(b=>b.addEventListener('click',()=>setFinish(b.dataset['3dFinish'])));
window.addEventListener('resize',resize);
if('IntersectionObserver' in window){new IntersectionObserver(entries=>{state.scrollPause=!entries[0].isIntersecting},{rootMargin:'220px'}).observe(stage);}
window.Danny3DDemo={state,partsCount:parts.length,geometry:'procedural-webgl',isRealProduct:false};
resize();requestAnimationFrame(frame);announce('真实 WebGL 三维概念模型已就绪 · 鼠标拖动可自由旋转');
})();
