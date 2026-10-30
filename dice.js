const vertex = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() { v_uv = a_position; gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const fragment = `
precision highp float;
varying vec2 v_uv;
uniform vec2 u_resolution;
uniform mat3 u_rotation;
uniform float u_time;
uniform float u_bounce;
uniform float u_energy;
uniform float u_material;
uniform float u_material_index;

float box(vec3 p) {
  vec3 q = abs(p) - vec3(.72);
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - .13;
}
vec3 normalAt(vec3 p) {
  vec2 e = vec2(.002, 0.0);
  return normalize(vec3(box(p+e.xyy)-box(p-e.xyy), box(p+e.yxy)-box(p-e.yxy), box(p+e.yyx)-box(p-e.yyx)));
}
float spot(vec3 d, vec3 l, float power) { return pow(max(dot(d, normalize(l)), 0.0), power); }
vec3 environment(vec3 d) {
  float strips = pow(abs(sin(d.x*3.4+d.z*1.5)), 14.0) * smoothstep(-.3,.7,d.y);
  vec3 sky = mix(vec3(.032,.041,.065),vec3(.77,.82,.86),smoothstep(-.7,1.0,d.y));
  sky += vec3(.85,.93,1.0) * spot(d,vec3(-2.,3.,2.),32.);
  sky += vec3(1.,.24,.055) * spot(d,vec3(2.,-.4,1.3),18.);
  sky += vec3(.23,.35,1.) * spot(d,vec3(-2.,.2,-1.),18.);
  return sky*.66+strips*vec3(.52,.55,.58);
}
float pip(vec2 uv, vec2 pos) { return 1.0-smoothstep(.078,.091,length(uv-pos)); }
float pips(vec2 uv, float face) {
  float p = 0.;
  if(face < 1.5) p = pip(uv,vec2(0.));
  else if(face < 2.5) p = pip(uv,vec2(-.32,.32))+pip(uv,vec2(.32,-.32));
  else if(face < 3.5) p = pip(uv,vec2(-.32,.32))+pip(uv,vec2(0.))+pip(uv,vec2(.32,-.32));
  else if(face < 4.5) p = pip(uv,vec2(-.32,.32))+pip(uv,vec2(.32,.32))+pip(uv,vec2(-.32,-.32))+pip(uv,vec2(.32,-.32));
  else if(face < 5.5) p = pip(uv,vec2(-.32,.32))+pip(uv,vec2(.32,.32))+pip(uv,vec2(-.32,-.32))+pip(uv,vec2(.32,-.32))+pip(uv,vec2(0.));
  else p = pip(uv,vec2(-.32,.34))+pip(uv,vec2(.32,.34))+pip(uv,vec2(-.32,-.34))+pip(uv,vec2(.32,-.34))+pip(uv,vec2(-.32,0.))+pip(uv,vec2(.32,0.));
  return min(p,1.);
}
void main() {
  vec2 uv = v_uv;
  uv.x *= u_resolution.x/u_resolution.y;
  uv.y -= u_bounce;
  vec3 ro = vec3(0.,0.,4.2);
  vec3 rd = normalize(vec3(uv*.72,-2.2));
  vec3 lro = u_rotation*ro;
  vec3 lrd = u_rotation*rd;
  float t = 2.45;
  float dist = 0.;
  for(int i=0; i<64; i++) {
    dist = box(lro+lrd*t);
    if(dist<.0015 || t>6.2) break;
    t+=dist;
  }
  if(t>6.2 || dist>.006) { gl_FragColor = vec4(0.); return; }
  vec3 p = lro+lrd*t;
  vec3 n = normalAt(p);
  vec3 an = abs(n);
  vec2 faceUV;
  float face;
  if(an.z>an.x && an.z>an.y) { faceUV=p.xy; face=n.z>0.?1.:6.; }
  else if(an.x>an.y) { faceUV=p.zy; face=n.x>0.?2.:5.; }
  else { faceUV=p.xz; face=n.y>0.?3.:4.; }
  vec3 reflected = reflect(lrd,n);
  vec3 worldReflection = vec3(dot(u_rotation[0],reflected),dot(u_rotation[1],reflected),dot(u_rotation[2],reflected));
  vec3 worldNormal = vec3(dot(u_rotation[0],n),dot(u_rotation[1],n),dot(u_rotation[2],n));
  float facing = max(0.,dot(n,-lrd));
  float light = .38 + .62*max(0.,dot(worldNormal,normalize(vec3(-3.,4.,4.))));
  vec3 reflectedLight = environment(worldReflection);
  float grain = fract(sin(dot(floor(faceUV*210.),vec2(12.9898,78.233)))*43758.5453)-.5;
  float pearl = .5+.5*sin(worldReflection.x*4.+worldReflection.y*2.);
  float softHighlight = pow(max(0.,sin(faceUV.x*4.2-faceUV.y*2.4+worldReflection.x*3.)),18.);
  float edgeGlow = smoothstep(.54,.76,max(abs(faceUV.x),abs(faceUV.y)));
  vec3 color;
  vec3 ink;
  vec3 rim;
  vec3 baseColor=vec3(.70,.68,.63)*(.62+.43*light)+reflectedLight*.13+vec3(grain*.026);
  vec3 redPip=vec3(.94,.045,.025);
  vec3 baseInk=redPip;
  vec3 baseRim=vec3(.19,.16,.13);
  float materialId=floor(u_material_index+.5);
  vec3 a=vec3(.45,.45,.48), b=vec3(.82,.86,.92), glow=vec3(.80,.95,1.);
  if(materialId<.5) { a=vec3(.40,.42,.48); b=vec3(.72,.76,.84); glow=vec3(.92,.98,1.0); rim=vec3(.70,.76,.84); }
  else if(materialId<1.5) { a=vec3(.30,.22,1.0); b=vec3(.66,.28,1.0); glow=vec3(.12,.92,1.0); rim=vec3(.88,.34,1.0); }
  else if(materialId<2.5) { a=vec3(.95,.22,.35); b=vec3(1.0,.54,.18); glow=vec3(1.0,.86,.28); rim=vec3(1.0,.42,.22); }
  else if(materialId<3.5) { a=vec3(.10,.58,.48); b=vec3(.44,.92,.68); glow=vec3(.55,1.0,.90); rim=vec3(.34,.90,.68); }
  else if(materialId<4.5) { a=vec3(.18,.48,1.0); b=vec3(.62,.78,1.0); glow=vec3(.92,.52,1.0); rim=vec3(.50,.78,1.0); }
  else { a=vec3(.10,.08,.22); b=vec3(.46,.18,.70); glow=vec3(1.0,.64,.28); rim=vec3(.90,.55,.24); }
  color=mix(a,b,pearl)*(.54+.34*light)+reflectedLight*vec3(.82,.86,1.05)*.52;
  color+=glow*(softHighlight*.34+edgeGlow*.10);
  ink=redPip;
  float material=smoothstep(0.,1.,u_material);
  float reveal=smoothstep(-.55,.75,material*1.35-(faceUV.x*.45+faceUV.y*.25));
  color=mix(baseColor,color,reveal);
  ink=redPip;
  rim=mix(baseRim,rim,reveal);
  // A small liquid-metal sweep links the materials while the die is in motion.
  float flow=.5+.5*sin(faceUV.x*13.+faceUV.y*8.+u_time*6.);
  vec3 liquid=reflectedLight*vec3(.78,.82,1.0)+mix(vec3(.45,.25,1.0),vec3(.10,.88,1.0),flow);
  color=mix(color,liquid,u_energy*material*(.16+.20*flow));
  color+=vec3(.18,.90,1.0)*pow(max(0.,sin(faceUV.x*9.-u_time*10.)),28.)*u_energy*material*.34;
  float mark = pips(faceUV,face);
  color = mix(color,ink*(.72+light*.28)+vec3(.10,.05,.02)*u_energy,mark);
  float edge = smoothstep(.65,.76,max(abs(faceUV.x),abs(faceUV.y)));
  color += edge*rim*pow(1.-facing,2.);
  float fresnel = pow(1.-facing,3.);
  color += fresnel*rim*.65;
  gl_FragColor=vec4(pow(max(color,vec3(0.)),vec3(.84)),1.);
}
`;

const poses = [[-.12,-.15,.02],[-.12,-Math.PI/2,.02],[Math.PI/2,-.15,.02],[-Math.PI/2,-.15,.02],[-.12,Math.PI/2,.02],[-.12,Math.PI-.15,.02]];
const TAU=Math.PI*2;

function rotation([x,y,z]) {
  const cx=Math.cos(x),sx=Math.sin(x),cy=Math.cos(y),sy=Math.sin(y),cz=Math.cos(z),sz=Math.sin(z);
  // Row-major forward matrix, read as a column-major inverse by WebGL.
  return new Float32Array([
    cy*cz,-cy*sz,sy,
    sx*sy*cz+cx*sz,-sx*sy*sz+cx*cz,-sx*cy,
    -cx*sy*cz+sx*sz,cx*sy*sz+sx*cz,cx*cy
  ]);
}

export class Dice {
  constructor(canvas, { onStart, onFinish, onSound, reducedMotion=false }) {
    this.canvas=canvas;this.callbacks={onStart,onFinish,onSound};this.reducedMotion=reducedMotion;
    this.angles=[.48,-.66,.22];this.pointer=[0,0];this.bag=[];this.previous=-1;
    this.start=performance.now();this.active=true;this.selected=false;this.lastFrame=0;this.material=0;this.materialAt=0;this.materialFace=0;
    this.abort=new AbortController();this.initGL();this.bind();
    this.resize=new ResizeObserver(()=>this.size());this.resize.observe(canvas);this.size();
    this.tick=this.tick.bind(this);this.frame=requestAnimationFrame(this.tick);
  }
  initGL() {
    try {
      const gl=this.canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:'low-power'});
      if(!gl) throw new Error('no WebGL');
      this.gl=gl;
      const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
      const v=compile(gl.VERTEX_SHADER,vertex),f=compile(gl.FRAGMENT_SHADER,fragment),program=gl.createProgram();
      gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.deleteShader(v);gl.deleteShader(f);gl.useProgram(program);this.program=program;
      const buffer=gl.createBuffer();this.buffer=buffer;gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const pos=gl.getAttribLocation(program,'a_position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
      this.uniforms=Object.fromEntries(['u_resolution','u_rotation','u_time','u_bounce','u_energy','u_material','u_material_index'].map(k=>[k,gl.getUniformLocation(program,k)]));
    } catch(error) {
      this.canvas.hidden=true;this.canvas.parentElement.classList.add('use-fallback');
      this.gl=null;
    }
  }
  size() {
    const rect=this.canvas.parentElement.getBoundingClientRect();
    const ratio=Math.min(window.devicePixelRatio||1,1.25);
    this.canvas.width=Math.max(1,Math.round(rect.width*ratio));this.canvas.height=Math.max(1,Math.round(rect.height*ratio));
    if(this.gl)this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
  }
  bind() {
    const surface=this.canvas.parentElement,opts={signal:this.abort.signal};
    surface.addEventListener('pointerdown',e=>{
      if(e.button!==0 || this.roll) return;
      this.drag={x:e.clientX,y:e.clientY,angles:[...this.angles],distance:0};surface.setPointerCapture(e.pointerId);surface.classList.add('dragging');
    },opts);
    surface.addEventListener('pointermove',e=>{
      const r=surface.getBoundingClientRect();this.pointer=[(e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5];
      if(this.drag){const dx=e.clientX-this.drag.x,dy=e.clientY-this.drag.y;this.drag.distance=Math.hypot(dx,dy);this.angles=[this.drag.angles[0]+dy*.01,this.drag.angles[1]+dx*.01,this.drag.angles[2]];}
    },opts);
    surface.addEventListener('pointerup',()=>{if(!this.drag)return;const d=this.drag.distance;this.drag=null;surface.classList.remove('dragging');if(d<10 || d>65)this.throw();},opts);
    surface.addEventListener('pointercancel',()=>{this.drag=null;surface.classList.remove('dragging');},opts);
    surface.addEventListener('pointerleave',()=>{this.pointer=[0,0];},opts);
    surface.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.throw();}if(e.key==='ArrowLeft'){e.preventDefault();this.throw((this.previous+5+6)%6);}if(e.key==='ArrowRight'){e.preventDefault();this.throw((this.previous+1)%6);}},opts);
  }
  pick() {
    if(!this.bag.length){this.bag=[0,1,2,3,4,5].filter(v=>v!==this.previous);for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}}
    return this.bag.pop();
  }
  setFace(index) {
    this.selected=true;this.previous=index;this.materialFace=index;this.angles=[...poses[index]];this.material=1;
  }
  throw(index) {
    if(this.roll||!this.active)return;
    const face=typeof index==='number'?index:this.pick();
    if(typeof index==='number')this.bag=this.bag.filter(v=>v!==face);
    const from=[...this.angles],pose=poses[face];
    const to=pose.map((v,i)=>v+TAU*Math.ceil((from[i]-v)/TAU)+(i===2?TAU:TAU*2));
    this.material=0;this.roll={at:performance.now(),from,to,face,duration:this.reducedMotion?180:1850,landed:false};
    this.selected=true;this.callbacks.onStart?.(face);this.callbacks.onSound?.('throw');
  }
  tick(now) {
    if(!this.active)return;
    this.frame=requestAnimationFrame(this.tick);
    if(document.hidden)return;
    if(now-this.lastFrame<30)return;this.lastFrame=now;
    let bounce=0,energy=0;
    if(this.roll){
      const t=Math.min(1,(now-this.roll.at)/this.roll.duration),ease=1-Math.pow(1-t,4);
      this.angles=this.roll.from.map((v,i)=>v+(this.roll.to[i]-v)*ease);
      if(!this.reducedMotion)bounce=Math.sin(t*Math.PI)*.28+Math.sin(t*Math.PI*5)*Math.pow(t,4)*.035;
      energy=Math.sin(t*Math.PI);
      if(t>=1){this.previous=this.roll.face;this.materialFace=this.previous;this.angles=poses[this.previous].map(v=>v);this.roll=null;this.material=0;this.materialAt=now;this.callbacks.onSound?.('land');this.callbacks.onFinish?.(this.previous);}
    } else if(!this.drag&&!this.selected&&!this.reducedMotion) this.angles[1]+=.003;
    if(!this.roll)this.material=this.selected?Math.min(1,(now-this.materialAt)/520):0;
    const animated=[this.angles[0]+(this.reducedMotion?0:this.pointer[1]*.08),this.angles[1]+(this.reducedMotion?0:this.pointer[0]*.08),this.angles[2]];
    if(this.gl){const gl=this.gl;gl.uniform2f(this.uniforms.u_resolution,this.canvas.width,this.canvas.height);gl.uniformMatrix3fv(this.uniforms.u_rotation,false,rotation(animated));gl.uniform1f(this.uniforms.u_time,(now-this.start)/1000);gl.uniform1f(this.uniforms.u_bounce,bounce);gl.uniform1f(this.uniforms.u_energy,energy);gl.uniform1f(this.uniforms.u_material,this.material);gl.uniform1f(this.uniforms.u_material_index,this.materialFace);gl.drawArrays(gl.TRIANGLES,0,6);}
    else {const surface=this.canvas.parentElement;surface.classList.toggle('materialized',this.material>.6);const box=surface.querySelector('.fallback-cube');if(box)box.style.transform=`rotateX(${animated[0]}rad) rotateY(${animated[1]}rad) rotateZ(${animated[2]}rad)`;}
  }
  destroy(){this.active=false;cancelAnimationFrame(this.frame);this.abort.abort();this.resize.disconnect();if(this.gl){this.gl.deleteBuffer(this.buffer);this.gl.deleteProgram(this.program);}}
}
