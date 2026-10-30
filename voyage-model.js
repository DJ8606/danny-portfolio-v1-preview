export const PAPER = { width: 645, height: 2047 };
export const STATIONS = {
  harbor: { id: 'harbor', title: '港口', point: { x: 311, y: 1340 }, camera: { x: 325, y: 1395 }, heading: '彩色小船从港口启航。', text: '点一下小船或启航按钮，让它沿着长卷慢慢往前走。' },
  compass: { id: 'compass', title: '海面', point: { x: 330, y: 1095 }, camera: { x: 324, y: 1170 }, heading: '穿过海面的线条。', text: '画面不用再选路，小船自己往前，你只需要看它经过哪里。' },
  lighthouse: { id: 'lighthouse', title: '岸边', point: { x: 516, y: 1255 }, camera: { x: 441, y: 1219 }, heading: '贴近岸边细节。', text: '保留拖动和缩放，方便停下来细看原作。' },
  islands: { id: 'islands', title: '群岛', point: { x: 513, y: 792 }, camera: { x: 329, y: 742 }, heading: '抵达群岛。', text: '航程结束后，可以重新启航，也可以拖动画面继续看细节。' }
};

const BREAKS = [0, 0.26, 0.64, 1];
const at = id => [STATIONS[id].point.x, STATIONS[id].point.y];
const shared = [at('harbor'),[288,1301],[252,1238],[236,1150],[270,1095],at('compass')];
const compassLight = [at('compass'),[412,1082],[489,1098],[519,1145],[519,1212],at('lighthouse')];
const lightIslands = [at('lighthouse'),[520,1190],[517,1090],[464,1019],[433,952],[433,865],[471,804],at('islands')];
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

function smooth(points) {
  const result = [];
  for (let i=0; i<points.length-1; i++) {
    const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
    for (let j=0;j<18;j++) {
      const t=j/18,t2=t*t,t3=t2*t;
      result.push([0,1].map(k=>0.5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3)));
    }
  }
  result.push(points.at(-1));
  let distance=0;
  return result.map((p,i)=>{if(i)distance+=Math.hypot(p[0]-result[i-1][0],p[1]-result[i-1][1]);return {x:p[0],y:p[1],distance};});
}

const route = [shared,compassLight,lightIslands].map(smooth);

export function routePoints() {
  return route.flat();
}

export function cameraBox(center, pixelWidth, pixelHeight, zoom=1.35) {
  const aspect=Math.max(1,pixelHeight)/Math.max(1,pixelWidth);
  let width=PAPER.width/clamp(zoom,1,2.3),height=width*aspect;
  if(height>PAPER.height){height=PAPER.height;width=height/aspect;}
  return {x:clamp(center.x-width/2,0,PAPER.width-width),y:clamp(center.y-height/2,0,PAPER.height-height),width,height};
}

export function mapControlsInView(box, boatPosition) {
  const controls = {
    boat: {...boatPosition,radius:37}
  };
  return Object.entries(controls).filter(([,p]) =>
    p.x-p.radius >= box.x && p.x+p.radius <= box.x+box.width &&
    p.y-p.radius >= box.y && p.y+p.radius <= box.y+box.height
  ).map(([id]) => id);
}

export class Voyage {
  constructor(){this.progress=0;this.status='ready';}
  get order(){return ['harbor','compass','lighthouse','islands'];}
  get index(){let index=0;for(let i=1;i<BREAKS.length;i++)if(this.progress>=BREAKS[i]-1e-8)index=i;return index;}
  get station(){return STATIONS[this.order[this.index]];}
  get needsChoice(){return false;}
  get position(){
    const leg=Math.min(2,this.index);
    const local=clamp((this.progress-BREAKS[leg])/(BREAKS[leg+1]-BREAKS[leg]),0,1);
    const points=route[leg],distance=local*points.at(-1).distance;
    const i=points.findIndex(p=>p.distance>=distance);
    if(i<=0)return {x:points[0].x,y:points[0].y};
    const a=points[i-1],b=points[i],t=(distance-a.distance)/Math.max(.001,b.distance-a.distance);
    return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
  }
  play(){if(this.progress<1&&!this.needsChoice)this.status='sailing';}
  pause(){if(this.status==='sailing')this.status='paused';}
  choose(){this.status='docked';}
  seek(progress){
    this.progress=clamp(Number.isFinite(progress)?progress:0,0,1);
    this.status=this.progress===1?'complete':'paused';
  }
  jump(id){const index=this.order.indexOf(id);if(index>=0)this.seek(BREAKS[index]);}
  restart(){this.progress=0;this.status='ready';}
  tick(milliseconds){
    if(this.status!=='sailing')return false;
    const next=BREAKS.find(p=>p>this.progress+1e-8)??1;
    this.progress=Math.min(next,this.progress+Math.max(0,milliseconds)/48000);
    if(this.progress>=next-1e-8){this.progress=next;this.status=next===1?'complete':'docked';}
    return true;
  }
}
