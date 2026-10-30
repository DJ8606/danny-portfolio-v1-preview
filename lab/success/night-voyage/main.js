import * as THREE from 'three';
import {EffectComposer} from './lib/jsm/postprocessing/EffectComposer.js';
import {RenderPass} from './lib/jsm/postprocessing/RenderPass.js';
import {UnrealBloomPass} from './lib/jsm/postprocessing/UnrealBloomPass.js';
import {OutputPass} from './lib/jsm/postprocessing/OutputPass.js';
'use strict';
const R=document.querySelector('#game'),$=id=>R.querySelector('#'+id),view=$('view'),canvas=$('world');
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const hash=n=>{let k=Math.sin(n*85.725+17.1)*31415.926;return k-Math.floor(k)};
const rng=seed=>{let z=seed>>>0;return()=>{z=(Math.imul(z,1664525)+1013904223)>>>0;return z/4294967296}};
const cellKey=(x,y)=>x+','+y,dist=(x,y,u,v)=>Math.hypot(x-u,y-v);
const WALL_H=2.3,EYE=0.95;

/* ---------------- 关卡数据 ---------------- */
const themes=[
 {title:'藏书回廊',tag:'选择',subtitle:'每个岔路都值得走一段',objective:'寻找阴符与阳符，双符合璧开启大门',task:'找到分藏两处的半符，让它们合一',type:'keypair',count:2,size:13,seed:917,accent:'#e8bb75',accent2:'#8e623e',fog:0x0a0d16,fogD:.155,amb:0x584430,hemi:0x2a3140,noun:'半符',hasRelic:true,phrase:'岔路不会替你决定方向。',explain:'你走过的路，才会变成下一次选择的经验。',tip:'不必一下就选对。先走，才能知道。'},
 {title:'雨幕旧城',tag:'耐心',subtitle:'在雨夜里，重新点亮街灯',objective:'点亮两盏失明的路灯',task:'靠近两盏熄灭的路灯，让街道恢复微光',type:'lamps',count:2,size:13,seed:1246,accent:'#81d8dd',accent2:'#337785',fog:0x04121c,fogD:.135,amb:0x2c4a56,hemi:0x1b2f3d,noun:'街灯',hasRelic:true,phrase:'耐心不是站着等。',explain:'像这条雨中的街，你走出一步，光就比刚才多一点。',tip:'别急，先点亮离自己最近的一盏灯。'},
 {title:'沉没神殿',tag:'勇气',subtitle:'越往深处，光越微弱',objective:'穿过海雾，找回一颗光核',task:'借助提示与地图，找回深海光核',type:'core',count:1,size:15,seed:7083,accent:'#79e5d3',accent2:'#217a82',fog:0x021820,fogD:.19,amb:0x1d4a52,hemi:0x12303a,noun:'光核',hasRelic:true,phrase:'勇气不是从来不害怕。',explain:'而是在看不清全貌时，仍然愿意向前走一小步。',tip:'看不清的时候，地图和直觉都可以帮助你。'},
 {title:'竹影山径',tag:'放下',subtitle:'有的东西需要得到，有的需要归还',objective:'拾起旧石，把它归还山门',task:'找到一块旧石，再带到山门旁放下',type:'stone',count:1,size:13,seed:427,accent:'#c7dc86',accent2:'#688449',fog:0x08150e,fogD:.125,amb:0x3a5232,hemi:0x22321f,noun:'旧石',hasRelic:true,phrase:'并非所有得到的，都要一直带着。',explain:'有时真正打开下一扇门的，不是拥有更多，而是懂得何时放下。',tip:'石头是线索，但也可能是负担。'},
 {title:'星穹钟楼',tag:'成长',subtitle:'把散落的经历拼成自己的星图',objective:'寻回三片时光碎片',task:'找齐三片时光碎片，完成最后的星门',type:'shards',count:3,size:15,seed:5632,accent:'#d0b5ff',accent2:'#8063b0',fog:0x0a0722,fogD:.115,amb:0x413a5e,hemi:0x241d3f,noun:'时光碎片',hasRelic:true,phrase:'成长不是抹去曾经的自己。',explain:'那些绕过的路、点过的灯、看不清的时刻，最后都成了你的一部分。',tip:'最后一段路，会把之前的故事连起来。'},
 /* —— 后五境：难度提升，有噬影者游荡 —— */
 {title:'雾霭迷城',tag:'迷惘',subtitle:'雾最浓的时候，方向感会被拿走',objective:'在浓雾里寻回三颗雾珠',task:'雾很大，跟着灯与地图走，寻回三颗雾珠',type:'shards',count:3,size:15,seed:8821,accent:'#b8c4c8',accent2:'#5c6a70',fog:0x0d1114,fogD:.18,amb:0x3a4148,hemi:0x232a30,noun:'雾珠',monsters:1,monsterSpeed:1.6,chaseRange:5,wards:3,startWards:1,chest:true,sky:[0x0a0e12,0x3a4448],wallPainter:1,wallTint:0x9aa8ac,floorPainter:1,floorTint:0x8a9a9e,phrase:'看不清路的时候，慢就是快。',explain:'迷惘不是停在原地，而是在雾里依然愿意挪动脚步。',tip:'它刚刚苏醒，动作还慢——这是学会与噬影者周旋的一课。'},
 {title:'熔岩石窟',tag:'煎熬',subtitle:'灼热让人想逃，但出口在更深处',objective:'点燃三座祭火',task:'点亮三座熄灭的祭火，让石窟重新有了温度',type:'lamps',count:3,size:15,seed:3311,accent:'#ff9a5c',accent2:'#a84e28',fog:0x160806,fogD:.155,amb:0x66331f,hemi:0x331508,noun:'祭火',monsters:1,monsterSpeed:1.9,chaseRange:5.5,wards:2,chest:true,wallPainter:2,wallTint:0xd88a70,floorPainter:2,floorTint:0xc87a5a,ceiling:'rock',phrase:'熬，不是忍受，是带着疼继续走。',explain:'那些灼热的时刻没有烧毁你，只是把你炼得更沉。',tip:'它跑得比以前快——留好符箓再进深处。'},
 {title:'幽影墓穴',tag:'恐惧',subtitle:'这里的光很吝啬，影子却很多',objective:'找回一枚长明火种',task:'在两只噬影者的游荡中，找回长明火种',type:'core',count:1,size:15,seed:6160,accent:'#a8c49a',accent2:'#4a6845',fog:0x050805,fogD:.22,amb:0x1e2a1e,hemi:0x101a10,noun:'火种',monsters:2,monsterSpeed:1.7,chaseRange:5.5,wards:3,chest:true,sky:[0x040604,0x142014],wallPainter:4,wallTint:0x8aa88a,floorPainter:3,floorTint:0x6a8a62,phrase:'恐惧大到极点时，剩下的一步就是勇气。',explain:'你曾在深海里学会的那一小步，在这里会救你。',tip:'两只都在巡逻。听心跳声判断距离。'},
 {title:'风雪长廊',tag:'坚毅',subtitle:'风雪会抹掉脚印，但抹不掉方向',objective:'找回风雪卷走的双符',task:'双符被风雪卷到了长廊两端，找回合璧',type:'keypair',count:2,size:15,seed:2049,accent:'#bcd8f0',accent2:'#5a7a94',fog:0x0c1218,fogD:.17,amb:0x44586a,hemi:0x26323e,noun:'半符',monsters:1,monsterSpeed:2.2,chaseRange:6,wards:2,chest:true,sky:[0x0a1016,0x4a5e6e],wallPainter:3,wallTint:0xb8ccd8,floorPainter:1,floorTint:0xa8bcc8,phrase:'坚持不是咬牙，是每天再走一遍。',explain:'风雪会停。你留下的每一步，都算数。',tip:'雪幕里看不清远处，信地图，别信眼睛。'},
 {title:'无间时廊',tag:'本我',subtitle:'沙漏倒转，你只有三分钟',objective:'限时之内集齐三粒时砂',task:'在沙漏流尽之前集齐时砂并抵达光门',type:'shards',count:3,size:15,seed:7703,accent:'#f0c060',accent2:'#a87830',fog:0x0d0a14,fogD:.19,amb:0x4a3a5e,hemi:0x241d33,noun:'时砂',monsters:2,monsterSpeed:2.4,chaseRange:6.5,wards:2,chest:true,timeLimit:180,wallPainter:0,wallTint:0xb09ae0,floorPainter:4,floorTint:0xc0a8e8,ceiling:'stars',phrase:'时间不是敌人，是提醒你认真的人。',explain:'走到这里你已经不需要答案了——你本身就是答案。',tip:'被追上会被送回入口并扣时间。宝箱里有额外的时间。'}
];
const relicDefs=[
 {icon:'图',name:'星图残页',desc:'地图上直接标出线索与光门，不再只靠摸索'},
 {icon:'火',name:'长明渔火',desc:'你的灯笼更亮、照得更远'},
 {icon:'萤',name:'引路萤',desc:'按 H 指路时，萤火会沿着路径飞向目标'},
 {icon:'铃',name:'听风铃',desc:'靠近未找到的线索时，会响起轻轻的铃声'},
 {icon:'徽',name:'时之徽记',desc:'屏幕边缘会指出剩余目标的方向'}
];

/* ---------------- 迷宫生成 ---------------- */
function neigh(x,y,map){return [[0,1],[1,0],[0,-1],[-1,0]].map(([dx,dy])=>[x+dx,y+dy]).filter(([xx,yy])=>map[yy]?.[xx]==='.')}
function bfs(map,s){const q=[s],d=new Map([[cellKey(...s),0]]);for(let i=0;i<q.length;i++){const [x,y]=q[i];for(const v of neigh(x,y,map)){const k=cellKey(...v);if(!d.has(k)){d.set(k,d.get(cellKey(x,y))+1);q.push(v)}}}return{q,d}}
function buildMaze(config){
 const n=config.size,rr=rng(config.seed),m=Array.from({length:n},()=>Array(n).fill('1'));
 const start=[1,n-2],stack=[start],dirs=[[2,0],[-2,0],[0,2],[0,-2]];m[start[1]][start[0]]='.';
 while(stack.length){const [x,y]=stack[stack.length-1];const can=dirs.filter(([dx,dy])=>{let xx=x+dx,yy=y+dy;return xx>0&&xx<n-1&&yy>0&&yy<n-1&&m[yy][xx]==='1'});if(!can.length){stack.pop();continue}const [dx,dy]=can[Math.floor(rr()*can.length)];m[y+dy/2][x+dx/2]='.';m[y+dy][x+dx]='.';stack.push([x+dx,y+dy])}
 let extra=n===13?2:3;for(let i=0;i<extra;i++){const opts=[];for(let y=2;y<n-2;y++)for(let x=2;x<n-2;x++){if(m[y][x]!=='1')continue;let hor=m[y][x-1]==='.'&&m[y][x+1]==='.',ver=m[y-1][x]==='.'&&m[y+1][x]==='.';if(hor||ver)opts.push([x,y])}if(opts.length){let [x,y]=opts[Math.floor(rr()*opts.length)];m[y][x]='.'}}
 const init=bfs(m,start);const all=init.q;const endpoints=all.filter(([x,y])=>neigh(x,y,m).length===1&&init.d.get(cellKey(x,y))>4);endpoints.sort((p,q)=>init.d.get(cellKey(...q))-init.d.get(cellKey(...p)));
 const gate=(endpoints[0]||all.at(-1)).slice();
 m[gate[1]][gate[0]]='3';
 const passable=m.map(row=>row.map(ch=>ch==='3'?'1':ch));const back=bfs(passable,start);const available=back.q.filter(([x,y])=>dist(x,y,...start)>3.1&&dist(x,y,...gate)>2.1);
 const items=[];const count=config.count;
 for(let j=0;j<count;j++){let best=null,score=-1e10;for(const pos of available){if(items.some(it=>dist(...it,...pos)<3.5))continue;const fromStart=back.d.get(cellKey(...pos))||0;const fromGate=dist(...pos,...gate);const sep=items.length?Math.min(...items.map(it=>dist(...it,...pos))):0;const branch=neigh(...pos,passable).length<=2?2:0;
  const s=fromStart*.38+fromGate*.6+sep*1.5+branch+rr()*.05;if(s>score){score=s;best=pos}}
  if(best)items.push(best)}
 if(items.length<count){for(const p of back.q){if(items.length>=count)break;if(dist(...p,...start)>2&&!items.some(it=>dist(...it,...p)<2))items.push(p)}}
 // 每境深处：前五境有遗物，每境都有一张半幅残图
 const relicCand=available.filter(p=>!items.some(it=>dist(...it,...p)<3));
 const relicPos=config.hasRelic&&relicCand.length?relicCand[Math.floor(rr()*relicCand.length)]:null;
 const mapCand=available.filter(p=>!items.some(it=>dist(...it,...p)<2.5)&&(!relicPos||dist(...p,...relicPos)>2.5));
 const mapPos=mapCand.length?mapCand[Math.floor(rr()*mapCand.length)]:null;
 // 闪光符箓（武器补给）与宝箱
 const takenSpots=[...items];if(relicPos)takenSpots.push(relicPos);if(mapPos)takenSpots.push(mapPos);
 const wards=[];
 for(let k=0;k<(config.wards||0);k++){
  const cand=available.filter(p=>!takenSpots.some(q=>dist(...p,...q)<2.6)&&!wards.some(q=>dist(...p,q[0],q[1])<4));
  if(!cand.length)break;const wp=cand[Math.floor(rr()*cand.length)];wards.push([wp[0]+.5,wp[1]+.5]);takenSpots.push(wp);
 }
 let chestPos=null;
 if(config.chest){
  const cand=available.filter(p=>!takenSpots.some(q=>dist(...p,...q)<2.6));
  if(cand.length){const cp=cand[Math.floor(rr()*cand.length)];chestPos=[cp[0]+.5,cp[1]+.5];takenSpots.push(cp)}
 }
 // 暗门机关：找一面恰好隔開两条走廊的墙，旁边安放拉杆
 let secret=null;const secCands=[];
 for(let y=2;y<n-2;y++)for(let x=2;x<n-2;x++){
  if(m[y][x]!=='1')continue;
  const hor=m[y][x-1]==='.'&&m[y][x+1]==='.',ver=m[y-1][x]==='.'&&m[y+1][x]==='.';
  if(hor===ver)continue;
  if(Math.abs(x-gate[0])+Math.abs(y-gate[1])<3)continue;
  const sides=hor?[[x-1,y],[x+1,y]]:[[x,y-1],[x,y+1]];
  for(const [lx2,ly2] of sides){
   if(items.some(it=>dist(lx2+.5,ly2+.5,...it)<1.6))continue;
   if(relicPos&&dist(lx2+.5,ly2+.5,...relicPos)<1.6)continue;
   if(mapPos&&dist(lx2+.5,ly2+.5,...mapPos)<1.6)continue;
   if(dist(lx2+.5,ly2+.5,start[0]+.5,start[1]+.5)<2.5)continue;
   secCands.push({wall:[x,y],lever:[lx2,ly2]});
  }
 }
 if(secCands.length)secret=secCands[Math.floor(rr()*secCands.length)];
 // 装饰灯位
 const fixtures=[];
 for(let y=1;y<n-1;y++)for(let x=1;x<n-1;x++)if(m[y][x]==='.'){
  let walls=0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(m[y+dy]?.[x+dx]!=='.')walls++;
  if(!walls)continue;
  if(dist(x+.5,y+.5,start[0]+.5,start[1]+.5)<2.4)continue;
  if(items.some(it=>dist(x+.5,y+.5,...it)<1.6))continue;
  fixtures.push({x:x+.5,y:y+.5,score:hash((x*127+y*311+config.seed)*0.31)});
 }
 const startAdj=neigh(...start,passable)[0]||[start[0],start[1]-1];const heading=Math.atan2(startAdj[1]-start[1],startAdj[0]-start[0]);
 const fx=start[0]+.5+Math.cos(heading)*1.26,fy=start[1]+.5+Math.sin(heading)*1.26;
 const picked=[];
 if(m[Math.floor(fy)]?.[Math.floor(fx)]==='.')picked.push([fx,fy]);
 fixtures.sort((a,b)=>b.score-a.score);
 for(const p of fixtures){if(picked.length>=(config.type==='lamps'?11:8))break;if(picked.some(q=>dist(p.x,p.y,q[0],q[1])<2.9))continue;picked.push([p.x,p.y])}
 return {map:m.map(r=>r.join('')),w:n,h:n,start:[start[0]+.5,start[1]+.5],door:[gate[0]+.5,gate[1]+.5],items:items.map(([x,y])=>[x+.5,y+.5]),relic:relicPos?[relicPos[0]+.5,relicPos[1]+.5]:null,mapPiece:mapPos?[mapPos[0]+.5,mapPos[1]+.5]:null,wards,chest:chestPos,secret,heading,fixtures:picked,reachable:back.q.length};
}
const mazes=themes.map(buildMaze);

/* ---------------- 程序化贴图 ---------------- */
function tex(fn,w=128,h=192){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);return c}
function fillNoise(x,count,strength,w=128,h=192){for(let i=0;i<count;i++){let px=hash(i*17)*w,py=hash(i*67)*h;x.fillStyle=i%3===0?`rgba(255,255,255,${strength})`:`rgba(0,0,0,${strength*1.4})`;x.fillRect(px,py,2+hash(i*47)*13,1+hash(i*11)*2)}}
const wallPainters=[
 function libraryWall(x){let wood=x.createLinearGradient(0,0,128,0);wood.addColorStop(0,'#100e15');wood.addColorStop(.22,'#453027');wood.addColorStop(.49,'#271a1e');wood.addColorStop(.85,'#382921');wood.addColorStop(1,'#100b10');x.fillStyle=wood;x.fillRect(0,0,128,192);
  const p=['#b77749','#516b77','#a14e45','#ca9658','#52635a','#806174','#754438','#b39a65','#8b5e47'];
  for(let r=0;r<4;r++){let y=r*46+4,s=9;x.fillStyle='#090e16';x.fillRect(7,y,114,39);while(s<120){let n=4+Math.floor(hash(s*2+r*88)*8),len=25+Math.floor(hash(s*23+r*13)*11);x.fillStyle=p[Math.floor(hash(r*121+s)*p.length)];x.fillRect(s,y+38-len,n-1,len);x.fillStyle='#ffe7b560';x.fillRect(s+1,y+38-len,1,len);x.fillStyle='#08060966';x.fillRect(s+n-2,y+38-len,1,len);if(hash(s+r*63)>.52){x.fillStyle='#eac78d';x.fillRect(s+2,y+18,n-4,1);x.fillRect(s+2,y+33,n-4,1)}s+=n}x.fillStyle='#c59b67';x.fillRect(0,y+39,128,3);x.fillStyle='#170f15';x.fillRect(0,y+42,128,4);x.fillStyle='#6b4a32';x.fillRect(0,y+43,128,1)}
  x.fillStyle='#140f16';x.fillRect(0,0,8,192);x.fillRect(120,0,8,192);x.fillStyle='#846044';x.fillRect(1,0,3,192);x.fillRect(123,0,3,192);
  x.fillStyle='#e2c387';x.fillRect(0,0,128,3);x.fillStyle='#624532';x.fillRect(0,5,128,3);fillNoise(x,70,.02)},
 function rainWall(x){x.fillStyle='#12202f';x.fillRect(0,0,128,192);
  for(let yy=0;yy<192;yy+=14){let drift=Math.floor(yy/14)%2?0:-15;x.fillStyle=yy%28?'#294454':'#325568';x.fillRect(0,yy,128,1);
   for(let xx=drift;xx<130;xx+=30){let n=hash(xx*3+yy*8);x.fillStyle=n>.52?'#203541':'#263d4b';x.fillRect(xx+1,yy+2,28,10);x.fillStyle='#40617255';x.fillRect(xx+2,yy+2,25,1);x.fillStyle='#112534';x.fillRect(xx,yy+2,1,12)}}
  x.fillStyle='#101b26';x.fillRect(21,27,88,125);x.fillStyle='#71848d';x.fillRect(17,24,94,4);x.fillRect(17,150,94,5);x.fillRect(18,28,4,122);x.fillRect(106,28,5,122);
  const interior=x.createLinearGradient(21,30,105,150);interior.addColorStop(0,'#b68d55');interior.addColorStop(.32,'#715e52');interior.addColorStop(.70,'#4b5260');interior.addColorStop(1,'#172d3a');x.fillStyle=interior;x.fillRect(24,31,80,117);
  x.fillStyle='#e5bd76';x.globalAlpha=.23;x.fillRect(26,33,77,98);x.globalAlpha=1;x.fillStyle='#172a34';x.fillRect(61,29,5,121);x.fillRect(24,84,82,5);
  x.fillStyle='#0d1620';x.fillRect(0,0,128,9);x.fillStyle='#627886';x.fillRect(0,8,128,3);
  x.fillStyle='#101e2a';x.fillRect(0,172,128,20);x.fillStyle='#7c9caa';x.fillRect(0,168,128,3);fillNoise(x,90,.025)},
 function seaWall(x){let grad=x.createLinearGradient(0,0,128,192);grad.addColorStop(0,'#1b5460');grad.addColorStop(.54,'#174451');grad.addColorStop(1,'#0c313d');x.fillStyle=grad;x.fillRect(0,0,128,192);
  for(let yy=0;yy<192;yy+=32){x.fillStyle='#63958b';x.fillRect(0,yy,128,3);x.fillStyle='#0b2c3c';x.fillRect(0,yy+5,128,2);for(let xx=(yy%64?17:0);xx<128;xx+=34){x.fillStyle='#81b7a544';x.fillRect(xx,yy+7,1,25);x.fillStyle='#001d2355';x.fillRect(xx+2,yy+7,1,26)}}
  x.strokeStyle='#8cbaac99';x.lineWidth=2;x.beginPath();x.arc(64,91,37,0,Math.PI*2);x.arc(64,91,27,0,Math.PI*2);x.stroke();
  for(let k=0;k<12;k++){const rad=k*Math.PI/6;const ax=64+Math.cos(rad)*32,ay=91+Math.sin(rad)*32;x.strokeStyle=k%3?'#a1d8bd99':'#d7ce9999';x.beginPath();x.moveTo(ax,ay);x.lineTo(ax+Math.cos(rad)*5,ay+Math.sin(rad)*5);x.stroke()}
  for(let i=0;i<32;i++){let xx=hash(i*7)*126,yy=hash(i*31)*191;x.fillStyle=i%4?'#2e817d54':'#96dcc66b';x.fillRect(xx,yy,1+i%3,1+i%2)}
  x.fillStyle='#0c303a';x.fillRect(0,0,6,192);x.fillRect(122,0,6,192)},
 function bambooWall(x){x.fillStyle='#0a2a23';x.fillRect(0,0,128,192);
  for(let i=0;i<23;i++){let xx=hash(i*13)*130,thick=3+hash(i*9)*8;x.fillStyle=['#385d3c','#76995b','#254d38','#a0b777','#54754c','#1d4835'][i%6];x.fillRect(xx,0,thick,192);
   x.fillStyle='#bcd88a77';x.fillRect(xx+1,0,1,192);x.fillStyle='#031b1755';x.fillRect(xx+thick-2,0,2,192);
   for(let y=(i*9)%29;y<192;y+=25){x.fillStyle='#c7d59977';x.fillRect(xx,y,thick,3);x.fillStyle='#142d24';x.fillRect(xx,y+3,thick,2)}}
  for(let i=0;i<45;i++){let xx=hash(i*17)*128,yy=hash(i*27)*192;x.fillStyle=i%4?'#729d5d99':'#bfda9977';x.beginPath();x.ellipse(xx,yy,6+hash(i*21)*7,2.4,hash(i*14)*4,0,Math.PI*2);x.fill()}
  x.fillStyle='#082017bb';x.fillRect(0,181,128,11)},
 function cosmosWall(x){x.fillStyle='#11122b';x.fillRect(0,0,128,192);
  x.strokeStyle='#6f6588';x.lineWidth=2;for(let i=0;i<4;i++)x.strokeRect(5+i*4,7+i*4,118-i*8,178-i*8);
  x.fillStyle='#ba9fc6';x.fillRect(0,0,128,4);x.fillStyle='#665981';x.fillRect(0,186,128,6);
  x.save();x.translate(64,95);for(let rr of [42,39,30,24]){x.strokeStyle=rr%2?'#9d82c6':'#b7a3d4';x.lineWidth=rr===39?1:2;x.beginPath();x.arc(0,0,rr,0,Math.PI*2);x.stroke()}
  for(let k=0;k<12;k++){const an=k*Math.PI/6;x.strokeStyle='#edd79aaa';x.beginPath();x.moveTo(Math.cos(an)*32,Math.sin(an)*32);x.lineTo(Math.cos(an)*37,Math.sin(an)*37);x.stroke()}
  x.strokeStyle='#ead38f';x.lineWidth=3;x.beginPath();x.moveTo(0,0);x.lineTo(15,-21);x.moveTo(0,0);x.lineTo(-4,-29);x.stroke();x.fillStyle='#fff0c0';x.beginPath();x.arc(0,0,3,0,7);x.fill();x.restore();
  for(let i=0;i<32;i++){const xx=hash(i*17)*128,yy=hash(i*41)*192;x.fillStyle=i%5?'#c2a6f588':'#ffe0a9';x.fillRect(xx,yy,i%7===0?2:1,1)}}
];
const floorPainters=[
 function wood(x,w,h){x.fillStyle='#241a13';x.fillRect(0,0,w,h);for(let y=0;y<h;y+=16){x.fillStyle=hash(y*7)>.5?'#2e2118':'#291d15';x.fillRect(0,y,w,15);x.fillStyle='#120c08';x.fillRect(0,y+15,w,1);for(let i=0;i<6;i++){x.fillStyle='#3a2a1c44';x.fillRect(hash(y+i*13)*w,y+2+hash(i*31+y)*11,8+hash(i*7)*22,1)}}fillNoise(x,60,.03,w,h)},
 function cobble(x,w,h){x.fillStyle='#1a2a35';x.fillRect(0,0,w,h);for(let y=0;y<h;y+=22)for(let xx=0;xx<w;xx+=24){const off=(Math.floor(y/22)%2)*12,n=hash(xx*3+y*8);x.fillStyle=n>.5?'#233845':'#1f3240';x.fillRect(xx+off-24*(off>0&&xx===0),y+1,21,19);x.fillStyle='#3d5a6a55';x.fillRect(xx+off+1,y+2,18,2)}x.fillStyle='#6d94a522';for(let i=0;i<8;i++)x.fillRect(hash(i*17)*w,hash(i*23)*h,10+hash(i*7)*16,6+hash(i*11)*8);fillNoise(x,70,.03,w,h)},
 function sand(x,w,h){x.fillStyle='#12383f';x.fillRect(0,0,w,h);for(let i=0;i<130;i++){const xx=hash(i*7)*w,yy=hash(i*13)*h;x.fillStyle=i%3?'#1d4d5533':'#2a6a6633';x.beginPath();x.arc(xx,yy,2+hash(i*3)*5,0,7);x.fill()}x.strokeStyle='#0a272e';for(let i=0;i<6;i++){x.beginPath();x.moveTo(0,hash(i*31)*h);x.bezierCurveTo(w*.3,hash(i*17)*h,w*.7,hash(i*41)*h,w,hash(i*53)*h);x.stroke()}fillNoise(x,60,.02,w,h)},
 function moss(x,w,h){x.fillStyle='#1a2b1a';x.fillRect(0,0,w,h);for(let i=0;i<150;i++){const xx=hash(i*11)*w,yy=hash(i*19)*h;x.fillStyle=['#2e4d2688','#3d5f2f66','#527a3a55','#233d1e99'][i%4];x.beginPath();x.arc(xx,yy,1.5+hash(i*5)*4,0,7);x.fill()}fillNoise(x,50,.025,w,h)},
 function cosmic(x,w,h){x.fillStyle='#171231';x.fillRect(0,0,w,h);x.strokeStyle='#3d3468';x.lineWidth=2;x.strokeRect(2,2,w-4,h-4);x.strokeStyle='#8a6fa122';for(let i=0;i<4;i++){x.beginPath();x.arc(w/2,h/2,10+i*14,0,7);x.stroke()}for(let i=0;i<26;i++){x.fillStyle=i%5?'#c2a6f566':'#ffe0a9';x.fillRect(hash(i*17)*w,hash(i*41)*h,i%7===0?2:1,i%7===0?2:1)}}
];
function doorPainter(theme){return tex(x=>{x.fillStyle='#1c2631';x.fillRect(0,0,128,192);x.fillStyle='#897253';x.fillRect(0,0,17,192);x.fillRect(111,0,17,192);x.fillStyle='#c4a677';for(let col of [9,118]){x.fillRect(col,0,2,192);for(let y=9;y<186;y+=22)x.fillRect(col-3,y,8,2)}const grad=x.createLinearGradient(20,15,101,192);grad.addColorStop(0,'#0a1020');grad.addColorStop(.48,'#'+new THREE.Color(theme.accent2).getHexString());grad.addColorStop(1,'#'+new THREE.Color(theme.accent).getHexString());x.fillStyle=grad;x.beginPath();x.moveTo(22,192);x.lineTo(22,60);x.quadraticCurveTo(64,-6,106,60);x.lineTo(106,192);x.closePath();x.fill();for(let i=0;i<72;i++){let xx=25+hash(i*7)*77,yy=hash(i*17)*189;if(yy<42+23*Math.pow((xx-64)/40,2))continue;x.fillStyle=i%6?'#eff3f2':'#fff1a6';x.globalAlpha=.2+hash(i*3)*.6;x.fillRect(xx,yy,2,2)}x.globalAlpha=1;x.strokeStyle=theme.accent;x.lineWidth=9;x.beginPath();x.moveTo(22,193);x.lineTo(22,60);x.quadraticCurveTo(64,-8,106,60);x.lineTo(106,193);x.stroke();x.strokeStyle='#ffe9b6';x.lineWidth=2;x.stroke()})}
function haloTexture(){return tex(x=>{const gr=x.createRadialGradient(64,64,2,64,64,62);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.34)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,128,128)},128,128)}
function rainTexture(){return tex(x=>{const gr=x.createLinearGradient(0,0,0,32);gr.addColorStop(0,'rgba(190,220,235,0)');gr.addColorStop(.5,'rgba(190,220,235,.85)');gr.addColorStop(1,'rgba(190,220,235,0)');x.fillStyle=gr;x.fillRect(3,0,2,32)},8,32)}
function leafTexture(){return tex(x=>{x.fillStyle='#a8cc6e';x.beginPath();x.ellipse(16,16,13,5.5,.6,0,7);x.fill();x.strokeStyle='#5c7a3c';x.beginPath();x.moveTo(5,22);x.lineTo(27,10);x.stroke()},32,32)}
function dotTexture(){return tex(x=>{const gr=x.createRadialGradient(16,16,1,16,16,15);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,32,32)},32,32)}
function CT(c,srgb=true){const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t}

/* ---------------- 渲染器与相机 ---------------- */
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
let pixelRatioCap=Math.min(window.devicePixelRatio||1,1.6);
renderer.setPixelRatio(pixelRatioCap);
const camera=new THREE.PerspectiveCamera(68,16/9,.05,70);
const rig=new THREE.Group();rig.add(camera);
const haloTex=CT(haloTexture()),rainTex=CT(rainTexture()),leafTex=CT(leafTexture()),dotTex=CT(dotTexture());
// 地面雾贴图：柔和噪声团
function groundFogCanvas(){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');for(let i=0;i<70;i++){const gx=hash(i*7)*256,gy=hash(i*13)*256,r=18+hash(i*3)*46;const gr=x.createRadialGradient(gx,gy,1,gx,gy,r);gr.addColorStop(0,`rgba(255,255,255,${.06+hash(i*5)*.09})`);gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,256,256)}return c}
function skyDome(scene,n,top,bot){
 const mat=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{cTop:{value:new THREE.Color(top)},cBot:{value:new THREE.Color(bot)}},
  vertexShader:'varying float vY;void main(){vY=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform vec3 cTop;uniform vec3 cBot;varying float vY;void main(){float h=clamp(vY*1.6+.25,0.,1.);gl_FragColor=vec4(mix(cBot,cTop,h),1.);}'});
 const dome=new THREE.Mesh(new THREE.SphereGeometry(42,20,12),mat);dome.position.set(n/2,0,n/2);dome.renderOrder=-1;scene.add(dome);
}

/* ---------------- 五个三维世界 ---------------- */
function makeHalo(color,scale){const m=new THREE.SpriteMaterial({map:haloTex,color,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});const s=new THREE.Sprite(m);s.scale.setScalar(scale);return s}
function buildScene(li){
 const theme=themes[li],maze=mazes[li],n=maze.w;
 const scene=new THREE.Scene();
 scene.background=new THREE.Color(theme.fog);
 scene.fog=new THREE.FogExp2(theme.fog,theme.fogD);
 scene.add(new THREE.AmbientLight(theme.amb,.85));
 const hemi=new THREE.HemisphereLight(theme.hemi,0x05070c,.5);scene.add(hemi);
 // 地面
 const fpi=theme.floorPainter!==undefined?theme.floorPainter:li;
 const fc=document.createElement('canvas');fc.width=fc.height=128;floorPainters[fpi](fc.getContext('2d'),128,128);
 const ft=CT(fc);ft.wrapS=ft.wrapT=THREE.RepeatWrapping;ft.repeat.set(n,n);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(n,n),new THREE.MeshStandardMaterial({map:ft,color:theme.floorTint||0xffffff,roughness:fpi===1?.38:.82,metalness:fpi===1?.5:.05,bumpMap:ft,bumpScale:.02}));
 floor.rotation.x=-Math.PI/2;floor.position.set(n/2,0,n/2);floor.receiveShadow=true;scene.add(floor);
 // 墙体（实例化）
 const wpi=theme.wallPainter!==undefined?theme.wallPainter:li;
 const wc=document.createElement('canvas');wc.width=128;wc.height=192;wallPainters[wpi](wc.getContext('2d'));
 const wt=CT(wc);
 const wallMat=new THREE.MeshStandardMaterial({map:wt,color:theme.wallTint||0xffffff,roughness:.85,metalness:.04,bumpMap:wt,bumpScale:.05});
 const cells=[];for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(maze.map[y][x]==='1')cells.push([x,y]);
 const walls=new THREE.InstancedMesh(new THREE.BoxGeometry(1,WALL_H,1),wallMat,cells.length);
 walls.castShadow=true;walls.receiveShadow=true;
 const M=new THREE.Matrix4(),CV=new THREE.Color(),cellInst={};
 cells.forEach(([x,y],i)=>{M.setPosition(x+.5,WALL_H/2,y+.5);walls.setMatrixAt(i,M);cellInst[x+','+y]=i;
  const v=.8+hash(x*31+y*57+li*13)*.32;CV.setRGB(v,v*(.96+hash(x*7+y*11)*.06),v*(.92+hash(x*5+y*17)*.08));walls.setColorAt(i,CV)});
 walls.instanceColor.needsUpdate=true;
 scene.add(walls);
 // 平行光阴影（雨城是月光，其余是微弱天光）
 const sunDir=new THREE.DirectionalLight([0xd8c9a8,0x9db8c4,0x6fb8b0,0xcfe0b0,0xb8a8e0,0x92a4aa,0xff8a50,0x7a9a6a,0x9ab8d8,0xd0b060][li],li===1?.55:li===6?.5:.26);
 sunDir.position.set(n/2+7,13,n/2+4);sunDir.target.position.set(n/2,0,n/2);
 sunDir.castShadow=true;sunDir.shadow.mapSize.set(2048,2048);
 Object.assign(sunDir.shadow.camera,{left:-n/2-2,right:n/2+2,top:n/2+2,bottom:-n/2-2,near:1,far:34});
 sunDir.shadow.bias=-.0004;scene.add(sunDir,sunDir.target);
 // 地面雾层（双层，反向流动）
 const fogPlanes=[];
 const fogCol=[0x8a7048,0x5a8a9c,0x3a9aa2,0x7a9a5a,0x8a7ac0,0x9aa8ac,0xc05a28,0x5a7a52,0xa8c0d8,0xc09840][li];
 for(let L=0;L<2;L++){
  const fc2=CT(groundFogCanvas());fc2.wrapS=fc2.wrapT=THREE.RepeatWrapping;fc2.repeat.set(3,3);
  const fp=new THREE.Mesh(new THREE.PlaneGeometry(n+2,n+2),new THREE.MeshBasicMaterial({map:fc2,transparent:true,opacity:L===0?.5:.32,color:fogCol,depthWrite:false}));
  fp.rotation.x=-Math.PI/2;fp.position.set(n/2,.05+L*.13,n/2);fp.renderOrder=1;scene.add(fp);
  fogPlanes.push({tex:fc2,spd:(L===0?1:-1)*(.008+L*.006)});
 }
 // 开放天空穹顶
 if(theme.sky)skyDome(scene,n,theme.sky[0],theme.sky[1]);
 else if(li===1)skyDome(scene,n,0x04101c,0x2a4a58);
 else if(li===2)skyDome(scene,n,0x06222e,0x1a5a64);
 else if(li===3)skyDome(scene,n,0x0e2418,0x3a5c46);
 // 顶面：书廊与星穹有天花板，熔岩石窟是岩顶，无间时廊是星野
 if(li===0||li===4||theme.ceiling){
  const cc=document.createElement('canvas');cc.width=cc.height=128;const cx=cc.getContext('2d');
  if(theme.ceiling==='rock'){cx.fillStyle='#180c08';cx.fillRect(0,0,128,128);for(let i2=0;i2<46;i2++){cx.fillStyle=['#2a140c','#331a10','#100806'][i2%3];cx.beginPath();cx.arc(hash(i2*7)*128,hash(i2*13)*128,3+hash(i2*3)*9,0,7);cx.fill()}for(let i2=0;i2<10;i2++){cx.strokeStyle='#ff6a2a22';cx.beginPath();const sx3=hash(i2*17)*128,sy3=hash(i2*23)*128;cx.moveTo(sx3,sy3);cx.lineTo(sx3+hash(i2*31)*30-15,sy3+hash(i2*37)*30-15);cx.stroke()}}
  else if(li===0){cx.fillStyle='#17100c';cx.fillRect(0,0,128,128);for(let y=0;y<128;y+=32){cx.fillStyle='#241a12';cx.fillRect(0,y,128,14);cx.fillStyle='#0c0806';cx.fillRect(0,y+14,128,3)}}
  else{cx.fillStyle='#0b0824';cx.fillRect(0,0,128,128);for(let i2=0;i2<40;i2++){cx.fillStyle=i2%6?'#cbb8ff88':'#ffe9b0';cx.fillRect(hash(i2*13)*128,hash(i2*29)*128,i2%7===0?2:1,i2%7===0?2:1)}}
  const ct=CT(cc);ct.wrapS=ct.wrapT=THREE.RepeatWrapping;ct.repeat.set(n,n);
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(n,n),new THREE.MeshStandardMaterial({map:ct,roughness:.9}));
  ceil.rotation.x=Math.PI/2;ceil.position.set(n/2,WALL_H,n/2);scene.add(ceil);
 }
 // 装饰灯 / 街灯
 const fixtures=[];
 const lampColor=[0xffbc66,0xffb860,0x53ebdc,0xd3e889,0xbe92fa,0xaac8d0,0xff9040,0x8ab86a,0xc0d8f0,0xf0c060][li];
 maze.fixtures.forEach(([fx,fy])=>{
  const grp=new THREE.Group();grp.position.set(fx,0,fy);
  let mesh;
  if(li===6){ // 熔岩火把
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.04,1.0,6),new THREE.MeshStandardMaterial({color:0x2a140c,roughness:.8}));pole.position.y=.5;grp.add(pole);
   mesh=new THREE.Mesh(new THREE.ConeGeometry(.07,.24,8),new THREE.MeshStandardMaterial({color:0xffb060,emissive:0xff7a2a,emissiveIntensity:2.2}));mesh.position.y=1.12;
  }
  else if(li===7){mesh=new THREE.Mesh(new THREE.SphereGeometry(.09,10,10),new THREE.MeshStandardMaterial({color:0xb8e8a0,emissive:0x6aa84f,emissiveIntensity:1.6}));mesh.position.y=.9;} // 墓穴磷火
  else if(li===9){mesh=new THREE.Mesh(new THREE.TorusGeometry(.12,.02,8,24),new THREE.MeshStandardMaterial({color:0xf0d090,emissive:0xc89830,emissiveIntensity:1.3}));mesh.position.y=1.05;} // 时环
  else if(li===2){mesh=new THREE.Mesh(new THREE.SphereGeometry(.09,10,10),new THREE.MeshStandardMaterial({color:0x9ff5e6,emissive:0x53ebdc,emissiveIntensity:1.6}));mesh.position.y=.95;}
  else if(li===4){mesh=new THREE.Mesh(new THREE.TorusGeometry(.12,.02,8,24),new THREE.MeshStandardMaterial({color:0xccb0ec,emissive:0x9d82c6,emissiveIntensity:1.2}));mesh.position.y=1.05;}
  else if(li===3){mesh=new THREE.Mesh(new THREE.SphereGeometry(.11,10,10),new THREE.MeshStandardMaterial({color:0xe2f8aa,emissive:0xc7dc86,emissiveIntensity:1.4}));mesh.scale.y=1.25;mesh.position.y=1.0;}
  else{const pole=new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,1.15,6),new THREE.MeshStandardMaterial({color:0x1a2530,roughness:.6}));pole.position.y=.57;grp.add(pole);
   mesh=new THREE.Mesh(new THREE.BoxGeometry(.16,.2,.16),new THREE.MeshStandardMaterial({color:0xffca76,emissive:lampColor,emissiveIntensity:1.5}));mesh.position.y=1.24;}
  grp.add(mesh);
  const halo=makeHalo(lampColor,1.15);halo.position.copy(mesh.position);grp.add(halo);
  const light=new THREE.PointLight(lampColor,1.5,4.6,2);light.position.copy(mesh.position);grp.add(light);
  // 灯具下方的小型体积光柱
  const cone=new THREE.Mesh(new THREE.ConeGeometry(.36,1.05,10,1,true),new THREE.MeshBasicMaterial({color:lampColor,transparent:true,opacity:.055,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false}));
  cone.position.y=mesh.position.y-.56;grp.add(cone);
  scene.add(grp);fixtures.push({grp,mesh,halo,light,cone,x:fx,y:fy});
 });
 // 任务道具
 const itemMeshes=[];
 const itemColor=[0xffd28d,0xffe289,0x73f8d9,0xb5e499,0xcea6fe,0xc8e4ea,0xffa050,0xa8e088,0xd0e8ff,0xf0c060][li];
 const tType=theme.type;
 maze.items.forEach(([ix,iy],ii)=>{
  const grp=new THREE.Group();grp.position.set(ix,0,iy);
  let mesh;
  if(tType==='keypair'){ // 阴符 / 阳符：两个半圆
   mesh=new THREE.Mesh(new THREE.CylinderGeometry(.16,.16,.05,24,1,false,ii===0?Math.PI/2:-Math.PI/2,Math.PI),new THREE.MeshStandardMaterial({color:0xffe2a8,emissive:0xffc26a,emissiveIntensity:1.6,side:THREE.DoubleSide}));
   mesh.rotation.x=Math.PI/2;mesh.rotation.z=ii===0?0:Math.PI;
  }else if(tType==='lamps'){ // 熄灭的街灯 / 祭火
   const pole=new THREE.Mesh(new THREE.CylinderGeometry(.02,.03,1.35,6),new THREE.MeshStandardMaterial({color:0x16222c,roughness:.6}));pole.position.y=.67;grp.add(pole);
   mesh=new THREE.Mesh(new THREE.BoxGeometry(.18,.22,.18),new THREE.MeshStandardMaterial({color:0x22333f,emissive:0x000000,emissiveIntensity:0}));mesh.position.y=1.46;
  }else if(tType==='core'){mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.15,0),new THREE.MeshStandardMaterial({color:0xadfff2,emissive:0x53ebdc,emissiveIntensity:2}));}
  else if(tType==='stone'){mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(.15,0),new THREE.MeshStandardMaterial({color:0xc7d898,emissive:0x8aa855,emissiveIntensity:.9,roughness:.7}));}
  else{mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.15,0),new THREE.MeshStandardMaterial({color:0xd2c4ff,emissive:itemColor,emissiveIntensity:1.8}));}
  if(tType!=='lamps')mesh.position.y=1.0;
  mesh.castShadow=true;
  grp.add(mesh);
  const halo=makeHalo(itemColor,tType==='lamps'?0:1.5);halo.position.y=tType==='lamps'?1.46:1.0;grp.add(halo);
  const light=new THREE.PointLight(itemColor,tType==='lamps'?0:1.8,4.2,2);light.position.y=1.0;grp.add(light);
  scene.add(grp);itemMeshes.push({grp,mesh,halo,light,x:ix,y:iy,base:mesh.position.y});
 });
 // 遗物
 let relicMesh=null;
 if(maze.relic){
  const grp=new THREE.Group();grp.position.set(maze.relic[0],0,maze.relic[1]);
  const gold=new THREE.MeshStandardMaterial({color:0xf3d389,emissive:0xd9a94f,emissiveIntensity:1.5,metalness:.6,roughness:.3});
  let mesh;
  if(li===0){mesh=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.3,10),gold);mesh.rotation.z=Math.PI/2.4;}
  else if(li===1){mesh=new THREE.Mesh(new THREE.ConeGeometry(.1,.24,10),new THREE.MeshStandardMaterial({color:0xffd9a0,emissive:0xff9a3c,emissiveIntensity:2}));}
  else if(li===2){mesh=new THREE.Mesh(new THREE.SphereGeometry(.11,12,12),new THREE.MeshStandardMaterial({color:0xd8ffe8,emissive:0xa8ffd0,emissiveIntensity:1.6,transparent:true,opacity:.85}));}
  else if(li===3){mesh=new THREE.Mesh(new THREE.ConeGeometry(.12,.2,12,1,true),gold);mesh.rotation.x=Math.PI;}
  else{mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.13,1),gold);}
  mesh.position.y=1.0;grp.add(mesh);
  const halo=makeHalo(0xffd98a,1.9);halo.position.y=1.0;grp.add(halo);
  const light=new THREE.PointLight(0xffce7a,1.4,3.6,2);light.position.y=1.1;grp.add(light);
  scene.add(grp);relicMesh={grp,mesh,halo,light};
 }
 // 半幅残图
 let mapMesh=null;
 if(maze.mapPiece){
  const grp=new THREE.Group();grp.position.set(maze.mapPiece[0],0,maze.mapPiece[1]);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.34,8),new THREE.MeshStandardMaterial({color:0xd9c9a0,emissive:0x8a7340,emissiveIntensity:.7,roughness:.8}));
  mesh.rotation.z=Math.PI/2.6;mesh.position.y=1.0;grp.add(mesh);
  const halo=makeHalo(0xd8e6ff,1.25);halo.position.y=1.0;grp.add(halo);
  scene.add(grp);mapMesh={grp,mesh,halo};
 }
 // 光门
 const doorGrp=new THREE.Group();
 const [dx,dy]=maze.door;doorGrp.position.set(dx,0,dy);
 const dCanvas=doorPainter(theme);const dt2=CT(dCanvas);
 const portal=new THREE.Mesh(new THREE.PlaneGeometry(.96,1.92),new THREE.MeshBasicMaterial({map:dt2,transparent:true,opacity:.62}));
 portal.position.y=.98;doorGrp.add(portal);
 const frame=new THREE.Mesh(new THREE.BoxGeometry(1.06,.1,.14),new THREE.MeshStandardMaterial({color:0x6b5638,emissive:new THREE.Color(theme.accent),emissiveIntensity:.35}));
 frame.position.y=2.02;doorGrp.add(frame);
 const doorLight=new THREE.PointLight(new THREE.Color(theme.accent),1.6,4.5,2);doorLight.position.y=1.2;doorGrp.add(doorLight);
 // 朝向最近的走廊
 const dirs4=[[1,0,0],[-1,0,Math.PI],[0,1,Math.PI/2],[0,-1,-Math.PI/2]];
 for(const [ox,oy,rot] of dirs4){if(maze.map[Math.floor(dy)+oy]?.[Math.floor(dx)+ox]==='.'){doorGrp.rotation.y=rot;break}}
 scene.add(doorGrp);
 // 天气粒子
 let particles=null;
 if(li===1){ // 雨
  const cnt=900,pos=new Float32Array(cnt*3),spd=new Float32Array(cnt);
  for(let i=0;i<cnt;i++){pos[i*3]=hash(i*7)*n;pos[i*3+1]=hash(i*13)*6;pos[i*3+2]=hash(i*17)*n;spd[i]=2.6+hash(i*23)*2.4}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  particles={pts:new THREE.Points(geo,new THREE.PointsMaterial({map:rainTex,size:.34,transparent:true,opacity:.5,depthWrite:false,color:0xbcd7e6})),kind:'rain',spd};
  scene.add(particles.pts);
 }else if(li===2){ // 气泡
  const cnt=260,pos=new Float32Array(cnt*3);
  for(let i=0;i<cnt;i++){pos[i*3]=hash(i*7)*n;pos[i*3+1]=hash(i*13)*2.4;pos[i*3+2]=hash(i*17)*n}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  particles={pts:new THREE.Points(geo,new THREE.PointsMaterial({map:dotTex,size:.05,transparent:true,opacity:.55,depthWrite:false,color:0xa7fff4})),kind:'bubbles'};
  scene.add(particles.pts);
 }else if(li===3){ // 落叶
  const cnt=160,pos=new Float32Array(cnt*3);
  for(let i=0;i<cnt;i++){pos[i*3]=hash(i*7)*n;pos[i*3+1]=hash(i*13)*3;pos[i*3+2]=hash(i*17)*n}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  particles={pts:new THREE.Points(geo,new THREE.PointsMaterial({map:leafTex,size:.09,transparent:true,opacity:.8,depthWrite:false,color:0xbcd88a})),kind:'leaves'};
  scene.add(particles.pts);
 }else if(li===4){ // 星尘
  const cnt=420,pos=new Float32Array(cnt*3);
  for(let i=0;i<cnt;i++){pos[i*3]=hash(i*7)*n;pos[i*3+1]=.2+hash(i*13)*3.4;pos[i*3+2]=hash(i*17)*n}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  particles={pts:new THREE.Points(geo,new THREE.PointsMaterial({map:dotTex,size:.05,transparent:true,opacity:.85,depthWrite:false,color:0xd6c2ff})),kind:'stars'};
  scene.add(particles.pts);
 }else if(li===6){ // 熔岩火星
  const cnt=240,pos=new Float32Array(cnt*3),spd=new Float32Array(cnt);
  for(let i=0;i<cnt;i++){pos[i*3]=hash(i*7)*n;pos[i*3+1]=hash(i*13)*2.4;pos[i*3+2]=hash(i*17)*n;spd[i]=.3+hash(i*23)*.5}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  particles={pts:new THREE.Points(geo,new THREE.PointsMaterial({map:dotTex,size:.05,transparent:true,opacity:.85,depthWrite:false,color:0xff9040,blending:THREE.AdditiveBlending})),kind:'embers',spd};
  scene.add(particles.pts);
 }else if(li===8){ // 风雪
  const cnt=800,pos=new Float32Array(cnt*3),spd=new Float32Array(cnt);
  for(let i=0;i<cnt;i++){pos[i*3]=hash(i*7)*n;pos[i*3+1]=hash(i*13)*5;pos[i*3+2]=hash(i*17)*n;spd[i]=.9+hash(i*23)*1.1}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  particles={pts:new THREE.Points(geo,new THREE.PointsMaterial({map:dotTex,size:.06,transparent:true,opacity:.8,depthWrite:false,color:0xe8f2ff})),kind:'snow',spd};
  scene.add(particles.pts);
 }else if(li===5){ // 雾中浮尘（浓）
  const cnt=320,pos=new Float32Array(cnt*3);
  for(let i=0;i<cnt;i++){pos[i*3]=hash(i*7)*n;pos[i*3+1]=.2+hash(i*13)*2.2;pos[i*3+2]=hash(i*17)*n}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  particles={pts:new THREE.Points(geo,new THREE.PointsMaterial({map:dotTex,size:.05,transparent:true,opacity:.55,depthWrite:false,color:0xa8bcc2})),kind:'dust'};
  scene.add(particles.pts);
 }else if(li===7){ // 墓穴磷火
  const cnt=200,pos=new Float32Array(cnt*3);
  for(let i=0;i<cnt;i++){pos[i*3]=hash(i*7)*n;pos[i*3+1]=.25+hash(i*13)*1.8;pos[i*3+2]=hash(i*17)*n}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  particles={pts:new THREE.Points(geo,new THREE.PointsMaterial({map:dotTex,size:.045,transparent:true,opacity:.6,depthWrite:false,color:0x8ab86a,blending:THREE.AdditiveBlending})),kind:'dust'};
  scene.add(particles.pts);
 }else if(li===9){ // 金色时砂
  const cnt=380,pos=new Float32Array(cnt*3);
  for(let i=0;i<cnt;i++){pos[i*3]=hash(i*7)*n;pos[i*3+1]=.2+hash(i*13)*3.2;pos[i*3+2]=hash(i*17)*n}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  particles={pts:new THREE.Points(geo,new THREE.PointsMaterial({map:dotTex,size:.05,transparent:true,opacity:.9,depthWrite:false,color:0xf0c060,blending:THREE.AdditiveBlending})),kind:'stars'};
  scene.add(particles.pts);
 }else{ // 书廊尘埃
  const cnt=180,pos=new Float32Array(cnt*3);
  for(let i=0;i<cnt;i++){pos[i*3]=hash(i*7)*n;pos[i*3+1]=.3+hash(i*13)*1.9;pos[i*3+2]=hash(i*17)*n}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  particles={pts:new THREE.Points(geo,new THREE.PointsMaterial({map:dotTex,size:.035,transparent:true,opacity:.5,depthWrite:false,color:0xf9d8a9})),kind:'dust'};
  scene.add(particles.pts);
 }
 // 雨城月亮
 if(li===1){
  const moon=new THREE.Mesh(new THREE.SphereGeometry(1.2,16,16),new THREE.MeshBasicMaterial({color:0xd8e8e4,fog:false}));
  moon.position.set(n*.7,14,-6);scene.add(moon);
  const mLight=new THREE.DirectionalLight(0x9db8c4,.35);mLight.position.set(n*.7,14,-6);scene.add(mLight);
 }
 // 深海顶光柱
 if(li===2){for(let i=0;i<5;i++){const beam=new THREE.Mesh(new THREE.ConeGeometry(.7,4,10,1,true),new THREE.MeshBasicMaterial({color:0x53ebdc,transparent:true,opacity:.05,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,depthWrite:false}));beam.position.set(hash(i*31)*n,3.2,hash(i*47)*n);scene.add(beam)}}
 // 星穹星云
 if(li===4){const neb=makeHalo(0x8f6fe0,14);neb.material.opacity=.3;neb.position.set(n/2,6,n/2);scene.add(neb)}
 // 暗门拉杆
 let leverMesh=null,secretState=null;
 if(maze.secret){
  const [lx2,ly2]=maze.secret.lever;
  const grp=new THREE.Group();grp.position.set(lx2+.5,0,ly2+.5);
  const ped=new THREE.Mesh(new THREE.CylinderGeometry(.09,.13,.52,8),new THREE.MeshStandardMaterial({color:0x3a3f4a,roughness:.55,metalness:.3}));
  ped.position.y=.26;ped.castShadow=true;grp.add(ped);
  const handle=new THREE.Mesh(new THREE.BoxGeometry(.05,.32,.05),new THREE.MeshStandardMaterial({color:0xc9a86a,emissive:0x8a6a30,emissiveIntensity:.7}));
  handle.position.y=.62;handle.rotation.z=.55;grp.add(handle);
  const halo=makeHalo(0xd8b060,.75);halo.position.y=.62;grp.add(halo);
  scene.add(grp);leverMesh={grp,handle,halo};
  secretState={opened:false,anim:-1};
 }
 // 游荡生灵（前五境）
 const creature=li<5?(()=> {
  const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');
  if(li===0){const gr=x.createRadialGradient(32,30,2,32,30,22);gr.addColorStop(0,'#ffe9b0');gr.addColorStop(.4,'#e8a850cc');gr.addColorStop(1,'#e8a85000');x.fillStyle=gr;x.fillRect(0,0,64,64);x.fillStyle='#fff5d8';x.beginPath();x.ellipse(32,28,5,9,0,0,7);x.fill()}
  else if(li===1){x.fillStyle='#0a1218';x.beginPath();x.ellipse(32,34,16,13,0,0,7);x.fill();x.fillStyle='#9fe8f0';x.beginPath();x.arc(26,30,3,0,7);x.arc(38,30,3,0,7);x.fill()}
  else if(li===2){x.fillStyle='#7df2dd';x.beginPath();x.ellipse(30,32,14,7,0,0,7);x.fill();x.beginPath();x.moveTo(42,32);x.lineTo(54,24);x.lineTo(54,40);x.closePath();x.fill();x.fillStyle='#032830';x.beginPath();x.arc(24,30,2.4,0,7);x.fill()}
  else if(li===3){const gr=x.createRadialGradient(32,32,2,32,32,20);gr.addColorStop(0,'#e4ffb0');gr.addColorStop(.5,'#9ac858aa');gr.addColorStop(1,'#9ac85800');x.fillStyle=gr;x.fillRect(0,0,64,64);x.fillStyle='#f2ffd0';x.beginPath();x.ellipse(32,30,4,8,0,0,7);x.fill()}
  else{const gr=x.createRadialGradient(32,32,2,32,32,22);gr.addColorStop(0,'#f0e2ff');gr.addColorStop(.4,'#a988f5bb');gr.addColorStop(1,'#a988f500');x.fillStyle=gr;x.fillRect(0,0,64,64)}
  const ct=CT(c);
  const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:ct,transparent:true,depthWrite:false}));
  spr.scale.setScalar(li===1?.5:.4);
  const halo=makeHalo([0xffd28d,0x6fd8e0,0x53ebdc,0xc7dc86,0xcea6fe][li],1.0);
  // 出生点：离玩家最远的一条走廊
  const cells2=[];for(let y=1;y<n-1;y++)for(let xx=1;xx<n-1;xx++)if(maze.map[y][xx]==='.'&&dist(xx+.5,y+.5,...maze.start)>5)cells2.push([xx+.5,y+.5]);
  const home=cells2.length?cells2[Math.floor(hash(li*77)*cells2.length)]:[maze.door[0],maze.door[1]];
  spr.position.set(home[0],1.05,home[1]);halo.position.copy(spr.position);scene.add(spr,halo);
  return {spr,halo,x:home[0],y:home[1],tx:home[0],ty:home[1],sndT:6};
 })():null;
 // 噬影者（后五境）：烟雾之身 + 赤瞳
 const monsters=[];
 if(theme.monsters){
  const smokeC=document.createElement('canvas');smokeC.width=smokeC.height=64;const sx2=smokeC.getContext('2d');
  const gr2=sx2.createRadialGradient(32,36,3,32,36,28);gr2.addColorStop(0,'rgba(6,4,12,.98)');gr2.addColorStop(.55,'rgba(10,8,20,.7)');gr2.addColorStop(1,'rgba(10,8,20,0)');sx2.fillStyle=gr2;sx2.fillRect(0,0,64,64);
  sx2.fillStyle='rgba(20,14,34,.5)';sx2.beginPath();sx2.ellipse(32,52,14,9,0,0,7);sx2.fill();
  const smokeTex=CT(smokeC);
  const farCells=[];for(let y=1;y<n-1;y++)for(let xx=1;xx<n-1;xx++)if(maze.map[y][xx]==='.'&&dist(xx+.5,y+.5,...maze.start)>6)farCells.push([xx+.5,y+.5]);
  for(let mi=0;mi<theme.monsters;mi++){
   const grp=new THREE.Group();
   const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeTex,transparent:true,depthWrite:false,opacity:.96}));
   spr.scale.set(.95,1.4,1);spr.position.y=.82;grp.add(spr);
   const eL=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0xff2a20,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
   const eR=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0xff2a20,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
   eL.scale.setScalar(.07);eR.scale.setScalar(.07);eL.position.set(-.085,1.04,0);eR.position.set(.085,1.04,0);grp.add(eL,eR);
   const light=new THREE.PointLight(0xff2018,.9,3.4,2);light.position.y=1.0;grp.add(light);
   const home=farCells.length?farCells[Math.floor(hash(li*131+mi*57+3)*farCells.length)]:[maze.door[0],maze.door[1]];
   grp.position.set(home[0],0,home[1]);scene.add(grp);
   monsters.push({grp,spr,eyes:[eL,eR],light,x:home[0],y:home[1],tx:home[0],ty:home[1],hx:home[0],hy:home[1],mode:'patrol',stunT:0,path:null,pathI:0,repathT:0,growled:false,seed:mi*7.3+li});
  }
 }
 // 闪光符箓（武器补给）
 const wardMeshes=[];
 (maze.wards||[]).forEach(([wx2,wy2])=>{
  const grp=new THREE.Group();grp.position.set(wx2,0,wy2);
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.16,.24),new THREE.MeshStandardMaterial({color:0xf5e6c0,emissive:0xd8a030,emissiveIntensity:.9,side:THREE.DoubleSide}));
  mesh.position.y=1.0;grp.add(mesh);
  const halo=makeHalo(0xffd070,1.1);halo.position.y=1.0;grp.add(halo);
  scene.add(grp);wardMeshes.push({grp,mesh,halo,taken:false});
 });
 // 宝箱
 let chestMesh=null;
 if(maze.chest){
  const grp=new THREE.Group();grp.position.set(maze.chest[0],0,maze.chest[1]);
  const body=new THREE.Mesh(new THREE.BoxGeometry(.5,.3,.34),new THREE.MeshStandardMaterial({color:0x5a3a20,roughness:.6,metalness:.2}));
  body.position.y=.19;body.castShadow=true;grp.add(body);
  const lid=new THREE.Group();lid.position.set(0,.34,-.17);
  const lidM=new THREE.Mesh(new THREE.BoxGeometry(.5,.12,.34),new THREE.MeshStandardMaterial({color:0x6a4526,roughness:.55,metalness:.2,emissive:0x2a1808,emissiveIntensity:.4}));
  lidM.position.set(0,.06,.17);lid.add(lidM);grp.add(lid);
  const trim=new THREE.Mesh(new THREE.BoxGeometry(.52,.05,.36),new THREE.MeshStandardMaterial({color:0xd8a850,emissive:0x8a5a18,emissiveIntensity:.8,metalness:.7,roughness:.35}));
  trim.position.y=.33;grp.add(trim);
  const halo=makeHalo(0xffce70,1.3);halo.position.y=.5;grp.add(halo);
  const light=new THREE.PointLight(0xffb850,1.1,3.2,2);light.position.y=.7;grp.add(light);
  scene.add(grp);chestMesh={grp,lid,halo,light,opened:false,anim:-1};
 }
 return {scene,fixtures,itemMeshes,relicMesh,mapMesh,doorGrp,portal,doorLight,particles,hemi,fogPlanes,leverMesh,secretState,cellInst,walls,creature,monsters,wardMeshes,chestMesh};
}
const worlds=themes.map((_,i)=>buildScene(i));
/* ---------------- 后期处理：Bloom + 色调输出 ---------------- */
const composer=new EffectComposer(renderer);
const renderPass=new RenderPass(worlds[0].scene,camera);
const bloomPass=new UnrealBloomPass(new THREE.Vector2(1280,720),.45,.55,.78);
const outputPass=new OutputPass();
composer.addPass(renderPass);composer.addPass(bloomPass);composer.addPass(outputPass);

/* ---------------- 游戏状态 ---------------- */
let level=0,world=mazes[0],sc=worlds[0],px=world.start[0],py=world.start[1],a=world.heading,pitch=0;
let elapsed=0,walked=0,unlocked=0,found=[],seen=new Set(),showMap=false,overlay=false,keys={},last=performance.now(),noticeTimer=0,passed=new Set();
let bobPhase=0,bobAmp=.14,flash=0,nextFlash=7,qualityLevel=0,frameEMA=16,lastQCheck=0,lastStepCycle=0,bellTimer=0,bellPulse=0,relicTaken=false,mapTaken=false,combineT=-1;
let wardCharges=0,timeLeft=null,failMode=false,lastTick=-1,heartT=0,catchCd=0,calmT=0;
let relics=[false,false,false,false,false];
try{const saved=JSON.parse(localStorage.getItem('fiveRealmsRelics'));if(Array.isArray(saved))relics=relics.map((v,i)=>!!saved[i])}catch(e){}
try{unlocked=clamp(Number(localStorage.getItem('fiveRealmsUnlocked'))||0,0,9)}catch(e){}
// 玩家手提灯笼：聚光灯投射真实阴影 + 近距离暖光晕
const lantern=new THREE.SpotLight(0xffc27a,2.2,9.5,.78,.55,1.5);
lantern.castShadow=true;lantern.shadow.mapSize.set(1024,1024);
lantern.shadow.camera.near=.1;lantern.shadow.camera.far=11;lantern.shadow.bias=-.002;
lantern.position.set(0,.1,0);
const lanternTarget=new THREE.Object3D();lanternTarget.position.set(0,-.18,-3.2);camera.add(lanternTarget);lantern.target=lanternTarget;
camera.add(lantern);
const lanternGlow=new THREE.PointLight(0xffb060,.55,2.8,2);lanternGlow.position.set(0,.15,.1);camera.add(lanternGlow);
// 引路萤
const wispGroup=new THREE.Group();
let wisps=[];
// 屏幕边缘指示
const cues=[];for(let i=0;i<4;i++){const d=document.createElement('div');d.className='cue';d.textContent='❯';view.appendChild(d);cues.push(d)}

function isFloor(x,y){return world.map[Math.floor(y)]?.[Math.floor(x)]==='.'}
function free(x,y){const r=.215;return isFloor(x-r,y-r)&&isFloor(x+r,y-r)&&isFloor(x-r,y+r)&&isFloor(x+r,y+r)}
function reveal(){const cx=Math.floor(px),yy=Math.floor(py);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let x=cx+dx,y=yy+dy;if(x>=0&&y>=0&&x<world.w&&y<world.h)seen.add(cellKey(x,y))}const known=[...seen].filter(s=>{const [x,y]=s.split(',').map(Number);return world.map[y][x]==='.'}).length;$('percent').textContent='已探索 '+Math.min(100,Math.round(known/world.reachable*100))+'%'}
function itemWord(){return themes[level].noun}
function updateTask(){let t=themes[level],num=found.filter(Boolean).length;$('goal').textContent=t.objective;
 let sub=t.task;
 if(num){if(t.type==='keypair')sub=num>=2?'双符合璧 · 星钥已成':`已找到${found[0]?'阴符':'阳符'} · 还差另一半`;
  else if(t.type==='lamps')sub=`已经点亮 ${num}/${t.count} · ${t.noun}`;
  else if(t.type==='shards')sub=`已寻回 ${num}/${t.count} · ${t.noun}`;
  else sub=`已找到${t.noun}`}
 $('goalSub').textContent=sub;
 if(num>=t.count)$('goal').textContent=t.type==='stone'?'带着旧石走向山门，并按 E 放下':t.type==='keypair'?'星钥已成 · 前往回廊尽头的门':`线索齐全 · 寻找出口（${num}/${t.count}）`}
function announce(msg,delay=2900){const e=$('notice');e.textContent=msg;e.classList.add('show');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>e.classList.remove('show'),delay)}
function goldFlash(){const f=$('gflash');f.classList.add('on');setTimeout(()=>f.classList.remove('on'),140)}
function renderProgress(){const n=$('progress');n.innerHTML='';themes.forEach((t,i)=>{const b=document.createElement('button');b.textContent=i+1;b.type='button';b.title=`第${i+1}境：${t.title}${i>unlocked?'（未解锁）':''}`;b.setAttribute('aria-label',b.title);b.disabled=i>unlocked;b.className=i===level?'current':i<level?'passed':'';b.addEventListener('click',()=>{if(i!==level)load(i)});n.append(b)})}
function renderRelics(){const bar=$('relicBar');bar.innerHTML='';relicDefs.forEach((d,i)=>{const s=document.createElement('span');s.textContent=d.icon;s.title=`${d.name}：${d.desc}${relics[i]?'':'（尚未获得）'}`;s.className=relics[i]?'owned':'';bar.append(s)})}
function fadeThrough(){const f=$('fade');f.classList.add('on');setTimeout(()=>f.classList.remove('on'),320)}
function cineBars(){stage.classList.add('cine');clearTimeout(cineBars._t);cineBars._t=setTimeout(()=>stage.classList.remove('cine'),2100)}

function updateWardHud(){const has=!!themes[level].wards;$('wardCount').hidden=!has;$('wardCount').textContent='符箓 ×'+wardCharges;$('wardBtn').textContent='符箓 Q'+(wardCharges?' ×'+wardCharges:'')}
function load(i){
 level=i;world=mazes[i];sc=worlds[i];const theme=themes[i];
 sc.scene.add(rig);renderPass.scene=sc.scene;
 bloomPass.strength=[.4,.55,.5,.4,.55,.6,.62,.5,.55,.6][i];
 document.documentElement.style.setProperty('--accent',theme.accent);document.documentElement.style.setProperty('--accent2',theme.accent2);
 px=world.start[0];py=world.start[1];a=world.heading;pitch=0;flash=0;const tn=performance.now()/1000;nextFlash=tn+5+hash(i*13)*6;
 elapsed=0;walked=0;found=world.items.map(()=>false);keys={};seen=new Set();overlay=false;showMap=false;relicTaken=relics[i];mapTaken=false;combineT=-1;wisps=[];wispGroup.clear();bellPulse=0;
 wardCharges=theme.startWards||0;timeLeft=theme.timeLimit||null;failMode=false;lastTick=-1;heartT=0;catchCd=0;calmT=theme.monsters?14:0;
 $('clock').classList.remove('danger');
 // 重置场景内物件状态
 const isLamps=theme.type==='lamps';
 sc.itemMeshes.forEach((im,ii)=>{im.grp.visible=true;im.taken=false;if(isLamps){im.light.intensity=0;im.halo.material.opacity=0;im.mesh.material.emissiveIntensity=0;im.mesh.material.emissive.set(0x000000)}else{im.light.intensity=1.8;im.halo.material.opacity=1}});
 sc.wardMeshes.forEach(w=>{w.grp.visible=true;w.taken=false});
 if(sc.chestMesh){sc.chestMesh.opened=false;sc.chestMesh.anim=-1;sc.chestMesh.lid.rotation.x=0;sc.chestMesh.light.intensity=1.1}
 sc.monsters.forEach(m=>{m.x=m.hx;m.y=m.hy;m.tx=m.hx;m.ty=m.hy;m.mode='patrol';m.stunT=0;m.path=null;m.repathT=0;m.growled=false;m.grp.position.set(m.x,0,m.y)});
 updateWardHud();
 if(sc.relicMesh)sc.relicMesh.grp.visible=!relicTaken;
 if(sc.mapMesh)sc.mapMesh.grp.visible=true;
 sc.portal.material.opacity=.62;
 $('result').classList.remove('show');$('mapbox').classList.remove('open');$('mapBtn').textContent='地图 M';
 $('roomTitle').textContent=`第${['一','二','三','四','五','六','七','八','九','十'][i]}境 · ${theme.title} / ${theme.tag}`;
 $('topLead').textContent=theme.subtitle;
 $('footerTask').textContent=`旅程 ${String(i+1).padStart(2,'0')} / 10`;$('footerDesc').textContent=theme.tip;
 updateTask();reveal();renderProgress();renderRelics();view.focus();fadeThrough();cineBars();AudioSys.setScene(i);
 announce(`第${i+1}境 · ${theme.title}：${theme.subtitle}`,3200);
 if(theme.monsters)setTimeout(()=>{if(level===i&&!overlay)announce('噬影者还在沉睡，很快就会醒来游荡——'+(theme.startWards?'你带着一张符箓，':'')+'拾得闪光符箓后按 Q 可以定住它。',4200)},3400);
}
function nearGate(){return dist(px,py,...world.door)<1.55}
function nearItem(i){return dist(px,py,...world.items[i])<.76}
function acquire(i){
 if(found[i])return;found[i]=true;const tt=themes[level],no=found.filter(Boolean).length;
 const im=sc.itemMeshes[i];im.taken=true;
 if(tt.type==='lamps'){ // 点亮而不是收走
  im.light.intensity=2.2;im.halo.material.opacity=1;im.halo.material.color.set(0xffe289);im.halo.scale.setScalar(1.6);im.mesh.material.emissive.set(0xffca76);im.mesh.material.emissiveIntensity=1.8;
  AudioSys.chime(no);announce(`✦ 第 ${no} 处${tt.noun}已经亮起（${no}/${tt.count}），黑暗里多了一处暖光。`,3200);
 }else{
  im.grp.visible=false;AudioSys.chime(no-1);
  if(tt.type==='keypair'){
   if(no>=2){combineT=0;goldFlash();AudioSys.door();announce('✦ 阴符与阳符在你掌心合二为一——星钥成了！',3800)}
   else{goldFlash();announce(`✦ 找到了${found[0]?'阴符':'阳符'}。半符无言，还差它的另一半。`,3600)}
  }
  else announce(tt.type==='shards'?`✦ 找到了第 ${no} 份${tt.noun}（${no}/${tt.count}）。`:tt.type==='stone'?'✦ 拾起旧石。记得把它送回山门。':tt.type==='core'?`✦ ${tt.noun}回到了你手中。`:'✦ 找到线索！',3200);
 }
 updateTask();
}
function collectRelic(){
 relicTaken=true;relics[level]=true;
 try{localStorage.setItem('fiveRealmsRelics',JSON.stringify(relics))}catch(e){}
 if(sc.relicMesh)sc.relicMesh.grp.visible=false;
 goldFlash();AudioSys.chime(4);renderRelics();
 announce(`✦ 拾得遗物「${relicDefs[level].name}」——${relicDefs[level].desc}。它会陪你走完剩下的旅程。`,4600);
}
function collectMap(){
 mapTaken=true;if(sc.mapMesh)sc.mapMesh.grp.visible=false;
 AudioSys.chime(2);goldFlash();
 // 揭开一半未探索区域
 const unseen=[];for(let y=0;y<world.h;y++)for(let x=0;x<world.w;x++)if(world.map[y][x]==='.'&&!seen.has(cellKey(x,y)))unseen.push([x,y]);
 const rr=rng((level+1)*777+Math.floor(elapsed*10));unseen.sort(()=>rr()-.5);
 const take=Math.ceil(unseen.length/2);for(let i=0;i<take;i++)seen.add(cellKey(...unseen[i]));
 reveal();if(showMap)drawMap();
 announce('✦ 拾得半幅残图——迷雾散去，地图上揭开了一半的区域。',3800);
}
function collectWard(w){
 w.taken=true;w.grp.visible=false;wardCharges=Math.min(5,wardCharges+1);updateWardHud();
 AudioSys.chime(1);goldFlash();
 announce('✦ 拾得一张闪光符箓——按 Q 释放，可以定住逼近的噬影者。',3400);
}
function openChest(){
 const c=sc.chestMesh;if(!c||c.opened)return;c.opened=true;c.anim=0;
 wardCharges=Math.min(5,wardCharges+1);
 let msg='✦ 打开宝箱——里面静静躺着一张闪光符箓。';
 if(themes[level].timeLimit){timeLeft+=20;msg='✦ 打开宝箱——符箓一张，沙漏额外添了 20 秒。'}
 updateWardHud();AudioSys.chime(3);goldFlash();announce(msg,3600);
}
function useWard(){
 if(overlay)return;
 if(wardCharges<=0){announce(themes[level].wards?'没有符箓了。留意迷宫里的符纸与宝箱。':'这一境没有噬影者，符箓留到以后再用。');return}
 wardCharges--;updateWardHud();goldFlash();AudioSys.wardBlast();
 const near=sc.monsters.filter(m=>dist(px,py,m.x,m.y)<4.5);
 if(near.length){near.forEach(m=>{m.stunT=6;m.mode='stun';m.path=null;m.growled=false});announce(`⚡ 符箓炸开一团强光——${near.length>1?'噬影者们':'噬影者'}被定在原地！`,3000)}
 else announce('⚡ 符箓的光散入黑暗……附近没有噬影者。',2600);
}
function fail(){
 overlay=true;failMode=true;keys={};if(document.pointerLockElement===view)document.exitPointerLock();
 AudioSys.thunder();
 const t=themes[level];
 $('resultChapter').textContent=`第 ${level+1} 境 / 10 · ${t.tag}`;
 $('resultTitle').textContent='沙漏流尽 · 时光耗尽';
 $('quote').textContent='“'+t.phrase+'”';
 $('reflection').textContent='噬影者仍在时廊里游荡。再快一点，或者更果断地用掉符箓——宝箱里还有时间。';
 $('resultStat').textContent=`本次找到 ${found.filter(Boolean).length}/${t.count} · 探索 ${$('percent').textContent.replace('已探索 ','')}`;
 $('next').textContent='再试一次 ↻';
 $('result').classList.add('show');
}
function tryCollect(){
 if(overlay)return;
 world.items.forEach((pos,i)=>{if(!found[i]&&nearItem(i))acquire(i)});
 if(!relicTaken&&world.relic&&dist(px,py,...world.relic)<.85)collectRelic();
 if(!mapTaken&&world.mapPiece&&dist(px,py,...world.mapPiece)<.85)collectMap();
 sc.wardMeshes.forEach(w=>{if(!w.taken&&dist(px,py,w.grp.position.x,w.grp.position.z)<.8)collectWard(w)});
}
function interact(){
 if(overlay)return;tryCollect();
 // 暗门机关
 if(sc.secretState&&!sc.secretState.opened&&world.secret&&dist(px,py,world.secret.lever[0]+.5,world.secret.lever[1]+.5)<1.4){
  sc.secretState.opened=true;sc.secretState.anim=0;
  AudioSys.rumble();announce('⚙ 机关转动——附近的某面墙正在缓缓沉入地面。',3600);return;
 }
 // 宝箱
 if(sc.chestMesh&&!sc.chestMesh.opened&&dist(px,py,sc.chestMesh.grp.position.x,sc.chestMesh.grp.position.z)<1.3){openChest();return}
 if(nearGate()){if(found.every(Boolean)){complete();return}announce(themes[level].type==='keypair'?'门上的锁孔是一对半圆。只有合璧的双符才能打开它。':'这道门暂时打不开。还有线索留在迷宫里。');return}
 const nearby=world.items.some((pos,i)=>!found[i]&&dist(px,py,...pos)<1.25)||(!relicTaken&&world.relic&&dist(px,py,...world.relic)<1.4)||(!mapTaken&&world.mapPiece&&dist(px,py,...world.mapPiece)<1.4);
 announce(nearby?'线索就在附近，再向前一点。':'这里暂时没有需要调查的东西。');
}
function complete(){
 overlay=true;failMode=false;keys={};passed.add(level);if(document.pointerLockElement===view)document.exitPointerLock();
 if(level<9&&unlocked<level+1){unlocked=level+1;try{localStorage.setItem('fiveRealmsUnlocked',String(unlocked))}catch(e){}}
 AudioSys.door();const t=themes[level];
 $('resultChapter').textContent=`第 ${level+1} 境 / 10 · ${t.tag}`;
 $('resultTitle').textContent=level===9?'十境走完，你就是答案':`已走出 · ${t.title}`;
 $('quote').textContent='“'+t.phrase+'”';$('reflection').textContent=t.explain;
 $('resultStat').textContent=(t.timeLimit?`沙漏剩余 ${Math.max(0,Math.ceil(timeLeft||0))} 秒`:`本境用时 ${$('clock').textContent}`)+` · 探索 ${$('percent').textContent.replace('已探索 ','')} · 遗物 ${relics.filter(Boolean).length}/5`;
 $('next').textContent=level===9?'从第一境重新出发 ↻':'进入下一境 →';
 $('result').classList.add('show');renderProgress();
}
function updateNear(){
 if(overlay)return;
 const theme=themes[level],got=found.filter(Boolean).length;
 let txt='继续探索迷宫的岔路',small='提示 H · 地图 M · E 调查'+(theme.wards?' · Q 符箓':'');
 let ni=found.findIndex((f,i)=>!f&&nearItem(i));
 const mNear=sc.monsters.length?Math.min(...sc.monsters.map(m=>m.stunT>0?99:dist(px,py,m.x,m.y))):99;
 if(mNear<3.2){txt='噬影者就在附近——它在靠近';small=wardCharges>0?'按 Q 释放符箓定住它':'没有符箓了，快离开这条走廊'}
 else if(sc.secretState&&!sc.secretState.opened&&world.secret&&dist(px,py,world.secret.lever[0]+.5,world.secret.lever[1]+.5)<1.5){txt='墙根处有一根不起眼的拉杆';small='按 E 扳动机关'}
 else if(sc.chestMesh&&!sc.chestMesh.opened&&dist(px,py,sc.chestMesh.grp.position.x,sc.chestMesh.grp.position.z)<1.5){txt='阴影里有一只镶金的宝箱';small='按 E 打开'}
 else if(ni>=0){txt=theme.type==='lamps'?'微弱的'+theme.noun+'就在身边':'你发现了发光的线索';small='继续走近一点，即可收集'}
 else if(nearGate()){txt=got===theme.count?(theme.type==='stone'?'山门正在等你归还旧石':'光门已经可以开启'):'出口被封印，需要先完成本关任务';small='按 E 或点击「调查」'}
 else if(got>=theme.count){txt=theme.type==='stone'?'带着旧石前往山门':'线索已经集齐，去寻找光门';small='遇到岔路可以打开地图'}
 else if(theme.type==='lamps'){txt=`已点亮 ${got}/${theme.count} · ${theme.noun}`;small='靠近即会点亮'}
 else if(theme.type==='keypair'&&got===1){txt='半符在等你找到另一半';small='留意迷宫另一端的微光'}
 $('near').innerHTML=txt+'<small>'+small+'</small>';
 const dirs=['东','东南','南','西南','西','西北','北','东北'];let angle=(a*180/Math.PI+360)%360;
 $('compass').textContent='◈ '+dirs[Math.round(angle/45)%8];
 if(timeLeft!=null){const tl=Math.max(0,timeLeft);$('clock').textContent='⏳'+String(Math.floor(tl/60)).padStart(2,'0')+':'+String(Math.floor(tl%60)).padStart(2,'0');$('clock').classList.toggle('danger',tl<30)}
 else $('clock').textContent=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(Math.floor(elapsed%60)).padStart(2,'0');
}
/* ---------------- 小地图 ---------------- */
function drawMap(){
 if(!showMap)return;const ctx=$('map').getContext('2d'),w=180,n=world.w,s=w/n;
 ctx.fillStyle='#081522';ctx.fillRect(0,0,w,w);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){if(!seen.has(cellKey(x,y)))continue;const c=world.map[y][x];ctx.fillStyle=c==='1'?'#2e4350':c==='3'?themes[level].accent:'#819196';ctx.fillRect(x*s+.65,y*s+.65,s-1.3,s-1.3)}
 const mark=(pos,col)=>{let xx=Math.floor(pos[0]),yy=Math.floor(pos[1]);if(!relics[0]&&!seen.has(cellKey(xx,yy)))return;ctx.save();ctx.translate(pos[0]*s,pos[1]*s);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,-4.4);ctx.lineTo(4.4,0);ctx.lineTo(0,4.4);ctx.lineTo(-4.4,0);ctx.closePath();ctx.fill();ctx.restore()};
 mark(world.door,'#bd9ef7');world.items.forEach((pos,i)=>{if(!found[i])mark(pos,themes[level].accent)});
 if(!relicTaken&&world.relic)mark(world.relic,'#ffd98a');if(!mapTaken&&world.mapPiece)mark(world.mapPiece,'#9fc8ff');
 if(world.secret&&!(sc.secretState&&sc.secretState.opened))mark([world.secret.lever[0]+.5,world.secret.lever[1]+.5],'#d8b060');
 if(sc.chestMesh&&!sc.chestMesh.opened)mark([sc.chestMesh.grp.position.x,sc.chestMesh.grp.position.z],'#ffce70');
 sc.wardMeshes.forEach(w=>{if(!w.taken)mark([w.grp.position.x,w.grp.position.z],'#ffe9a8')});
 sc.monsters.forEach(m=>{if(m.stunT<=0)mark([m.x,m.y],'#ff3a2a')});
 ctx.save();ctx.translate(px*s,py*s);ctx.rotate(a);ctx.fillStyle='#fff4bd';ctx.beginPath();ctx.moveTo(6.6,0);ctx.lineTo(-3.8,-4.4);ctx.lineTo(-2,0);ctx.lineTo(-3.8,4.4);ctx.closePath();ctx.fill();ctx.restore();
}
function toggleMap(){showMap=!showMap;$('mapbox').classList.toggle('open',showMap);$('mapBtn').textContent=showMap?'收起地图 M':'地图 M';drawMap()}
/* ---------------- 指路 & 引路萤 ---------------- */
function findPathFrom(sx,sy,tx,ty){
 const ex=Math.floor(tx),ey=Math.floor(ty);
 const key=(x,y)=>x+','+y,ok=(x,y)=>{const c=world.map[y]?.[x];return c==='.'||c==='3'};
 const q=[[sx,sy]],prev=new Map([[key(sx,sy),null]]);
 for(let i=0;i<q.length;i++){const [x,y]=q[i];
  if(x===ex&&y===ey){const pts=[];let cur=[x,y],k=key(x,y);while(cur){pts.unshift([cur[0]+.5,cur[1]+.5]);const pk=prev.get(k);cur=pk?pk.split(',').map(Number):null;if(cur)k=pk}return pts}
  for(const [dx2,dy2] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx2,ny=y+dy2;if(!ok(nx,ny))continue;const nk=key(nx,ny);if(prev.has(nk))continue;prev.set(nk,key(x,y));q.push([nx,ny])}}
 return null;
}
function findPath(tx,ty){return findPathFrom(Math.floor(px),Math.floor(py),tx,ty)}
function spawnWisps(path){
 for(let k=0;k<7;k++){
  const s=makeHalo(0xffe9a8,.5);wispGroup.add(s);
  wisps.push({sprite:s,path,offset:-k*.42,speed:2.6});
 }
 sc.scene.add(wispGroup);
}
function hint(){
 if(overlay)return;
 let i=found.findIndex(v=>!v),target=i>=0?world.items[i]:(!relicTaken&&world.relic?world.relic:(!mapTaken&&world.mapPiece?world.mapPiece:world.door));
 const dx=target[0]-px,dy=target[1]-py;let angle=(Math.atan2(dy,dx)*180/Math.PI+360)%360;
 const dirs=['东','东南','南','西南','西','西北','北','东北'];
 if(relics[2]){const path=findPath(...target);if(path&&path.length>1){path[0]=[px,py];spawnWisps(path);announce(`引路萤向着${dirs[Math.round(angle/45)%8]}方飞去——跟着它们。`,3500);AudioSys.chime(1);return}}
 announce(`${i>=0?itemWord():'光门'}大致在你的${dirs[Math.round(angle/45)%8]}方。注意：方向不等于直线路径。`,3500);
}

/* ---------------- 移动与碰撞 ---------------- */
function step(dx,dy){const nx=px+dx,ny=py+dy,oldX=px,oldY=py;if(free(nx,py))px=nx;if(free(px,ny))py=ny;walked+=dist(px,py,oldX,oldY);if(Math.floor(px)!==Math.floor(oldX)||Math.floor(py)!==Math.floor(oldY))reveal();tryCollect()}
function move(dt){
 let f=0,s=0,rot=0;
 if(keys.w||keys.ArrowUp||keys.forward)f++;if(keys.s||keys.ArrowDown||keys.backward)f--;
 if(keys.a)s--;if(keys.d)s++;if(keys.ArrowLeft||keys.turnL)rot--;if(keys.ArrowRight||keys.turnR)rot++;
 a+=rot*dt*2.35;const inv=Math.max(1,Math.hypot(f,s));
 if(f||s){
  step((Math.cos(a)*f-Math.sin(a)*s)*dt*2.9/inv,(Math.sin(a)*f+Math.cos(a)*s)*dt*2.9/inv);
  bobPhase+=dt*7.6;const cycle=Math.floor(bobPhase/Math.PI);
  if(cycle!==lastStepCycle){lastStepCycle=cycle;AudioSys.footstep()}
 }else bobPhase+=dt*1.25;
 const target=(f||s)?1:.14;bobAmp+=(target-bobAmp)*Math.min(1,dt*4.5);
}
/* ---------------- 主循环 ---------------- */
camera.rotation.order='YXZ';
const V3=new THREE.Vector3();
function animate(now){
 requestAnimationFrame(animate);
 const dtRaw=now-last,dt=Math.min(.05,dtRaw/1000);last=now;
 frameEMA=frameEMA*.94+Math.min(80,dtRaw)*.06;
 if(now-lastQCheck>2200){lastQCheck=now;
  const caps=[1.6,1.25,1.0,.8];
  if(frameEMA>28&&qualityLevel<3){qualityLevel++;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,caps[qualityLevel]));composer.setPixelRatio(Math.min(window.devicePixelRatio||1,caps[qualityLevel]))}
  else if(frameEMA<15&&qualityLevel>0){qualityLevel--;renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,caps[qualityLevel]));composer.setPixelRatio(Math.min(window.devicePixelRatio||1,caps[qualityLevel]))}
 }
 const t=now/1000;
 if(!overlay){elapsed+=dt;move(dt)}
 // 相机：头部摆动 + 呼吸
 const bobY=Math.sin(bobPhase*2)*.045*bobAmp+Math.sin(t*.82)*.008;
 rig.position.set(px,EYE+bobY,py);
 camera.rotation.y=-a-Math.PI/2;camera.rotation.x=pitch;
 // 灯笼 flicker（长明渔火加成）
 const lanBase=relics[1]?3.6:2.2;
 lantern.intensity=lanBase*(.88+.12*Math.sin(t*6.7)+.05*Math.sin(t*15.3));
 lantern.distance=relics[1]?12.5:9.5;lantern.angle=relics[1]?.92:.78;
 lanternGlow.intensity=(relics[1]?.85:.55)*(.85+.15*Math.sin(t*8.1));
 sc.scene.fog.density=themes[level].fogD*(relics[1]?.85:1);
 // 灯具：只点亮最近的 6 盏
 const fx2=sc.fixtures.map(f=>({f,d:dist(px,py,f.x,f.y)})).sort((u,v)=>u.d-v.d);
 fx2.forEach(({f,d},i)=>{f.light.visible=i<6;if(f.light.visible)f.light.intensity=1.5*(.85+.15*Math.sin(t*1.9+i))*(d<1.2?1.4:1);f.halo.material.opacity=.7+.3*Math.sin(t*1.9+i*1.8);f.cone.material.opacity=(.04+.025*Math.sin(t*2.1+i))*(f.light.visible?1:.4);if(f.mesh.material.emissiveIntensity!==undefined)f.mesh.material.emissiveIntensity=1.3+.4*Math.sin(t*2.1+i)});
 // 道具动画
 sc.itemMeshes.forEach((im,i)=>{
  if(im.taken){if(themes[level].type==='lamps'&&im.light.intensity>0)im.light.intensity=2.2*(.9+.1*Math.sin(t*7+i));return}
  im.grp.rotation.y+=dt*1.1;
  if(themes[level].type!=='lamps')im.mesh.position.y=im.base+Math.sin(t*2.8+i)*.06;
  im.halo.scale.setScalar((themes[level].type==='lamps'?1.4:1.5)*(1+.12*Math.sin(t*3+i*2)));
 });
 // 符箓漂浮
 sc.wardMeshes.forEach((w,i)=>{if(!w.taken){w.grp.rotation.y+=dt*1.6;w.mesh.position.y=1+Math.sin(t*3+i)*.05;w.halo.scale.setScalar(1.1+.15*Math.sin(t*3.4+i))}});
 // 宝箱动画
 if(sc.chestMesh){
  if(sc.chestMesh.anim>=0){sc.chestMesh.anim+=dt/1.1;const p3=Math.min(1,sc.chestMesh.anim);sc.chestMesh.lid.rotation.x=-p3*1.9;sc.chestMesh.light.intensity=1.1+p3*2.2;if(p3>=1)sc.chestMesh.anim=-1}
  if(!sc.chestMesh.opened)sc.chestMesh.halo.scale.setScalar(1.3+.2*Math.sin(t*2.4));
 }
 if(sc.relicMesh&&sc.relicMesh.grp.visible){sc.relicMesh.grp.rotation.y+=dt*.9;sc.relicMesh.mesh.position.y=1+Math.sin(t*2.2)*.07;sc.relicMesh.halo.scale.setScalar(1.9+.25*Math.sin(t*2.6))}
 if(sc.mapMesh&&sc.mapMesh.grp.visible){sc.mapMesh.grp.rotation.y+=dt*1.4;sc.mapMesh.mesh.position.y=1+Math.sin(t*2.5+1)*.05}
 // 光门呼吸
 const unlockedDoor=found.every(Boolean)&&found.length>0;
 sc.portal.material.opacity=unlockedDoor?.8+.16*Math.sin(t*3):.45+.15*Math.sin(t*2.2);
 sc.doorLight.intensity=unlockedDoor?2.4+.5*Math.sin(t*3):1.2+.4*Math.sin(t*2.2);
 // 双符合璧时灯笼短暂闪耀
 if(combineT>=0){combineT+=dt;lantern.intensity+=Math.max(0,1.6-combineT)*4;if(combineT>1.6)combineT=-1}
 // 暗门下沉动画
 if(sc.secretState&&sc.secretState.anim>=0){
  sc.secretState.anim+=dt/1.6;const p2=Math.min(1,sc.secretState.anim);
  const [wx2,wy2]=world.secret.wall,id=sc.cellInst[wx2+','+wy2];
  const mm=new THREE.Matrix4().makeScale(1,1-p2,1);mm.setPosition(wx2+.5,WALL_H*(1-p2)/2,wy2+.5);
  sc.walls.setMatrixAt(id,mm);sc.walls.instanceMatrix.needsUpdate=true;
  if(sc.leverMesh)sc.leverMesh.handle.rotation.z=.55-p2*1.1;
  if(p2>=1){world.map=world.map.map((r,ri)=>ri===wy2?r.substring(0,wx2)+'.'+r.substring(wx2+1):r);sc.secretState.anim=-1;goldFlash();announce('暗墙完全沉入地面——一条新的路露了出来。',3000)}
 }
 // 游荡生灵：沿走廊漫游，玩家靠近会躲开
 const cr=sc.creature;
 if(cr){
  const dT=dist(cr.x,cr.y,cr.tx,cr.ty),flee=dist(cr.x,cr.y,px,py)<1.7;
  if(dT<.1){
   const cx2=Math.floor(cr.x),cy2=Math.floor(cr.y);
   let opts=[[0,1],[1,0],[0,-1],[-1,0]].map(([dx2,dy2])=>[cx2+dx2,cy2+dy2]).filter(([xx,yy])=>world.map[yy]?.[xx]==='.');
   if(opts.length){if(flee)opts.sort((p2,q2)=>dist(q2[0]+.5,q2[1]+.5,px,py)-dist(p2[0]+.5,p2[1]+.5,px,py));
    const pick=flee?opts[0]:opts[Math.floor(hash(t*13.7+cx2*7+cy2*3)*opts.length)];cr.tx=pick[0]+.5;cr.ty=pick[1]+.5}
  }else{const sp=Math.min(dT,(flee?2.7:1.0)*dt);cr.x+=(cr.tx-cr.x)/dT*sp;cr.y+=(cr.ty-cr.y)/dT*sp}
  cr.spr.position.set(cr.x,1.05+Math.sin(t*2.2)*.07,cr.y);
  cr.spr.material.opacity=flee?.35:.88;
  cr.halo.position.copy(cr.spr.position);
  cr.halo.scale.setScalar(1+.18*Math.sin(t*3.1));
  if(!overlay&&dist(px,py,cr.x,cr.y)<5){cr.sndT-=dt;if(cr.sndT<=0){cr.sndT=7+hash(t)*7;AudioSys.creature(level)}}
 }
 // 噬影者：巡逻 / 追猎 / 定身 / 扑击
 catchCd=Math.max(0,catchCd-dt);
 let nearestM=1e9;
 sc.monsters.forEach(m=>{
  const dP=dist(m.x,m.y,px,py);if(m.stunT<=0)nearestM=Math.min(nearestM,dP);
  if(m.stunT>0){
   m.stunT-=dt;m.spr.material.opacity=.5+.18*Math.sin(t*9+m.seed);m.eyes.forEach(e=>e.material.opacity=.22);m.light.intensity=.12;
   if(m.stunT<=0){m.mode='patrol'}
  }else if(!overlay){
   m.spr.material.opacity=.96;m.eyes.forEach(e=>e.material.opacity=.9+.1*Math.sin(t*5+m.seed));
   m.light.intensity=.9+.3*Math.sin(t*6+m.seed);
   const range=themes[level].chaseRange||6.5;
   const chasing=m.mode==='chase';
   if(calmT<=0&&dP<range&&!chasing){m.mode='chase';m.repathT=0;if(!m.growled){AudioSys.growl();m.growled=true}}
   else if((dP>=range+1||calmT>0)&&chasing){m.mode='patrol';m.growled=false}
   const spd=(m.mode==='chase'?themes[level].monsterSpeed||2.5:1.05)*dt;
   if(m.mode==='chase'){
    m.repathT-=dt;
    if(m.repathT<=0){m.repathT=.7;m.path=findPathFrom(Math.floor(m.x),Math.floor(m.y),Math.floor(px),Math.floor(py));m.pathI=1}
    if(m.path&&m.pathI<m.path.length){
     const wp=m.path[m.pathI],dW=dist(m.x,m.y,wp[0],wp[1]);
     if(dW<.14)m.pathI++;else{m.x+=(wp[0]-m.x)/dW*Math.min(spd,dW);m.y+=(wp[1]-m.y)/dW*Math.min(spd,dW)}
    }else if(dP>0){m.x+=(px-m.x)/dP*Math.min(spd,dP);m.y+=(py-m.y)/dP*Math.min(spd,dP)}
   }else{
    const dT=dist(m.x,m.y,m.tx,m.ty);
    if(dT<.1){
     const cx2=Math.floor(m.x),cy2=Math.floor(m.y);
     const opts=[[0,1],[1,0],[0,-1],[-1,0]].map(([dx2,dy2])=>[cx2+dx2,cy2+dy2]).filter(([xx,yy])=>world.map[yy]?.[xx]==='.');
     if(opts.length){const pick=opts[Math.floor(hash(t*9.1+m.seed+cx2*3+cy2*7)*opts.length)];m.tx=pick[0]+.5;m.ty=pick[1]+.5}
    }else{m.x+=(m.tx-m.x)/dT*Math.min(spd,dT);m.y+=(m.ty-m.y)/dT*Math.min(spd,dT)}
   }
   // 抓住玩家：拖回入口
   if(dP<.55&&catchCd<=0){
    catchCd=2.5;AudioSys.growl(true);AudioSys.heart(1);
    const f=$('gflash');f.classList.add('red','on');setTimeout(()=>f.classList.remove('on','red'),700);
    px=world.start[0];py=world.start[1];a=world.heading;pitch=0;wisps=[];wispGroup.clear();reveal();
    m.x=m.hx;m.y=m.hy;m.tx=m.hx;m.ty=m.hy;m.mode='patrol';m.path=null;m.growled=false;
    if(timeLeft!=null)timeLeft=Math.max(5,timeLeft-12);
    announce('噬影者扑了上来——你被拖回了入口'+(timeLeft!=null?'，沙漏流失了 12 秒':'')+'。',3400);
   }
  }
  m.grp.position.set(m.x,Math.sin(t*1.7+m.seed)*.05,m.y);
 });
 // 心跳：噬影者逼近时的听觉预警
 if(!overlay&&sc.monsters.length&&nearestM<5.5){heartT-=dt;if(heartT<=0){heartT=clamp(nearestM*.22,.32,1.15);AudioSys.heart(clamp(1.3-nearestM*.18,.3,1))}}
 // 噬影者沉睡期
 if(calmT>0&&!overlay){calmT-=dt;if(calmT<=0&&themes[level].monsters)announce('噬影者醒了——听声辨位，别被堵进死角。',3200)}
 // 限时沙漏
 if(timeLeft!=null&&!overlay){
  timeLeft-=dt;
  const tl=Math.ceil(timeLeft);
  if(tl<=10&&tl>=1&&tl!==lastTick){lastTick=tl;AudioSys.tick()}
  if(timeLeft<=0){timeLeft=0;fail()}
 }
 // 引路萤
 wisps=wisps.filter(w=>{w.offset+=dt*w.speed;const pts=w.path;
  if(w.offset>=pts.length-1){wispGroup.remove(w.sprite);return false}
  const i0=clamp(Math.floor(w.offset),0,pts.length-2),fr=w.offset-i0;
  const wx=pts[i0][0]+(pts[i0+1][0]-pts[i0][0])*fr,wz=pts[i0][1]+(pts[i0+1][1]-pts[i0][1])*fr;
  w.sprite.position.set(wx,1+Math.sin(t*3+w.offset)*0.08,wz);
  w.sprite.material.opacity=w.offset<0?0:clamp(1.4-w.offset/pts.length,0,1);
  return true});
 // 天气粒子
 const P=sc.particles;
 if(P){const arr=P.pts.geometry.attributes.position.array,n=world.w;
  if(P.kind==='rain'){for(let i=0;i<P.spd.length;i++){arr[i*3+1]-=P.spd[i]*dt;arr[i*3]+=dt*.5;if(arr[i*3+1]<0){arr[i*3+1]=5.5;arr[i*3]=hash(i*7+t)*n}if(arr[i*3]>n)arr[i*3]-=n}}
  else if(P.kind==='bubbles'){for(let i=0;i<arr.length/3;i++){arr[i*3+1]+=dt*(.2+(i%5)*.05);arr[i*3]+=Math.sin(t+i)*dt*.08;if(arr[i*3+1]>2.5)arr[i*3+1]=0}}
  else if(P.kind==='leaves'){for(let i=0;i<arr.length/3;i++){arr[i*3+1]-=dt*(.25+(i%4)*.06);arr[i*3]+=Math.sin(t*1.3+i)*dt*.25;if(arr[i*3+1]<0)arr[i*3+1]=3}}
  else if(P.kind==='stars'){P.pts.rotation.y+=dt*.012}
  else if(P.kind==='embers'){for(let i=0;i<P.spd.length;i++){arr[i*3+1]+=P.spd[i]*dt;arr[i*3]+=Math.sin(t*2+i)*dt*.12;if(arr[i*3+1]>2.7){arr[i*3+1]=.05;arr[i*3]=hash(i*7+t)*n;arr[i*3+2]=hash(i*13+t)*n}}}
  else if(P.kind==='snow'){for(let i=0;i<P.spd.length;i++){arr[i*3+1]-=P.spd[i]*dt;arr[i*3]+=Math.sin(t*.8+i)*dt*.55;arr[i*3+2]+=dt*.4;if(arr[i*3+1]<0){arr[i*3+1]=4.6;arr[i*3]=hash(i*7+t)*n}if(arr[i*3+2]>n)arr[i*3+2]-=n}}
  else{for(let i=0;i<arr.length/3;i++){arr[i*3]+=Math.sin(t*.5+i)*dt*.05;arr[i*3+1]+=Math.cos(t*.4+i*2)*dt*.03}}
  P.pts.geometry.attributes.position.needsUpdate=true;
 }
 // 闪电
 if(level===1){if(t>nextFlash){flash=1;nextFlash=t+5+hash(t)*11;AudioSys.thunder()}flash*=Math.exp(-dt*4.6);if(flash<.01)flash=0;sc.hemi.intensity=.5+flash*2.4}else flash=0;
 // 听风铃
 if(relics[3]&&!overlay){
  const un=world.items.filter((p,i)=>!found[i]);
  if(un.length){const nd=Math.min(...un.map(p=>dist(px,py,...p)));
   if(nd<4.2){bellTimer-=dt;if(bellTimer<=0){bellTimer=.9+nd*.45;bellPulse=1;AudioSys.bell(clamp(1.2-nd*.2,.25,1))}}else bellTimer=.5}
 }
 bellPulse*=Math.exp(-dt*2.2);$('bpulse').style.opacity=bellPulse>.03?bellPulse*.9:0;
 // 时之徽记：屏幕边缘方向指示
 cues.forEach(c=>c.style.opacity=0);
 if(relics[4]&&!overlay){
  const targets=world.items.filter((p,i)=>!found[i]);const list=targets.length?targets:[world.door];
  list.slice(0,4).forEach((pos,i)=>{
   const dx=pos[0]-px,dy=pos[1]-py;if(Math.hypot(dx,dy)<1.2)return;
   let diff=Math.atan2(dy,dx)-a;while(diff>Math.PI)diff-=2*Math.PI;while(diff<-Math.PI)diff+=2*Math.PI;
   if(Math.abs(diff)<.8)return;
   const c=cues[i];c.className='cue '+(diff>0?'r':'l');c.style.opacity=.85;c.style.top=`calc(50% + ${clamp(-pitch*120,-60,60)}px)`;
  });
 }
 // 地面雾流动
 sc.fogPlanes.forEach(fp=>{fp.tex.offset.x+=dt*fp.spd;fp.tex.offset.y+=dt*fp.spd*.6});
 if(qualityLevel>=3)renderer.render(sc.scene,camera);else composer.render();
 updateNear();drawMap();
}
/* ---------------- 程序化音频（与场景一一对应） ---------------- */
const AudioSys={
 ctx:null,master:null,scene:-1,nodes:[],muted:false,
 ensure(){if(this.ctx)return!!this.ctx;try{this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=.85;this.master.connect(this.ctx.destination)}catch(e){}return!!this.ctx},
 wake(){if(!this.ensure())return;if(this.ctx.state==='suspended')this.ctx.resume();if(this.scene!==level&&!this.muted)this.setScene(level)},
 noiseBuf(){if(this._nb)return this._nb;const c=this.ctx,b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;return this._nb=b},
 stopScene(){this.nodes.forEach(n=>{try{if(n.stop)n.stop()}catch(e){}try{n.disconnect()}catch(e){}});this.nodes=[]},
 noise(out,type,freq,Q,g,lfoRate,lfoDepth){const c=this.ctx,src=c.createBufferSource();src.buffer=this.noiseBuf();src.loop=true;const f=c.createBiquadFilter();f.type=type;f.frequency.value=freq;f.Q.value=Q||1;const gn=c.createGain();gn.gain.value=g;src.connect(f);f.connect(gn);gn.connect(out);src.start();if(lfoRate){const lfo=c.createOscillator(),lg=c.createGain();lfo.frequency.value=lfoRate;lg.gain.value=lfoDepth;lfo.connect(lg);lg.connect(gn.gain);lfo.start();this.nodes.push(lfo)}this.nodes.push(src,gn)},
 tone(out,freq,g,type,detune){const c=this.ctx,o=c.createOscillator();o.type=type||'sine';o.frequency.value=freq;if(detune)o.detune.value=detune;const gn=c.createGain();gn.gain.value=g;o.connect(gn);gn.connect(out);o.start();this.nodes.push(o,gn)},
 setScene(i){if(!this.ctx||this.muted)return;if(this.scene===i)return;this.scene=i;this.stopScene();try{const c=this.ctx,t=c.currentTime,out=c.createGain();out.gain.setValueAtTime(.0001,t);out.gain.exponentialRampToValueAtTime(1,t+2.8);out.connect(this.master);this.nodes.push(out);
  if(i===0){this.noise(out,'lowpass',220,1,.05,.05,.018);this.tone(out,110,.006)}
  else if(i===1){this.noise(out,'lowpass',880,1,.15,.07,.05);this.noise(out,'bandpass',2300,.8,.045,.11,.02)}
  else if(i===2){this.noise(out,'lowpass',250,1,.11,.06,.05);this.tone(out,58,.05);this.tone(out,87.3,.032,'sine',4)}
  else if(i===3){this.noise(out,'bandpass',620,.5,.065,.09,.035);this.noise(out,'bandpass',1450,1.4,.018,.17,.01)}
  else if(i===4){[174.6,220,261.6,349.2].forEach((f,k)=>this.tone(out,f,.024,'sine',k%2?5:-4));this.noise(out,'highpass',6200,1,.011,.21,.007)}
  else if(i===5){this.noise(out,'bandpass',420,.6,.09,.06,.04);this.noise(out,'bandpass',1800,1.2,.02,.13,.01)} // 雾城阴风
  else if(i===6){this.noise(out,'lowpass',140,1,.14,.08,.06);this.tone(out,46,.05);this.noise(out,'bandpass',900,.7,.03,.3,.02)} // 熔岩低鸣
  else if(i===7){this.tone(out,55,.05);this.tone(out,82.4,.028,'sine',5);this.noise(out,'lowpass',300,1,.04,.05,.02)} // 墓穴挽歌
  else if(i===8){this.noise(out,'bandpass',750,.8,.13,.18,.07);this.noise(out,'highpass',3800,1,.02,.3,.012)} // 风雪呼啸
  else{[196,246.9,293.7,392].forEach((f,k)=>this.tone(out,f,.026,'sine',k%2?6:-5));this.noise(out,'highpass',5200,1,.012,.25,.008)} // 时廊颤音
  }catch(e){}},
 footstep(){if(!this.ctx||this.muted)return;try{const c=this.ctx,t=c.currentTime,src=c.createBufferSource();src.buffer=this.noiseBuf();const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=380+Math.random()*140;const gn=c.createGain();gn.gain.setValueAtTime(.11,t);gn.gain.exponentialRampToValueAtTime(.001,t+.12);src.connect(f);f.connect(gn);let tail=gn;if(c.createStereoPanner){const pan=c.createStereoPanner();this._alt=!this._alt;pan.pan.value=this._alt?.22:-.22;gn.connect(pan);tail=pan}tail.connect(this.master);src.start(t,Math.random()*1.5);src.stop(t+.14)}catch(e){}},
 chime(n){if(!this.ctx||this.muted)return;try{const c=this.ctx,t=c.currentTime,notes=[523.25,587.33,659.25,783.99,880],base=notes[clamp(n,0,4)];
  const dl=c.createDelay();dl.delayTime.value=.27;const fb=c.createGain();fb.gain.value=.28;dl.connect(fb);fb.connect(dl);dl.connect(this.master);
  [[base,.16,0],[base*1.5,.07,.05]].forEach(([fq,g0,dt2])=>{const o=c.createOscillator();o.type='sine';o.frequency.value=fq;const gn=c.createGain();gn.gain.setValueAtTime(.0001,t+dt2);gn.gain.exponentialRampToValueAtTime(g0,t+dt2+.02);gn.gain.exponentialRampToValueAtTime(.0001,t+dt2+1.6);o.connect(gn);gn.connect(this.master);gn.connect(dl);o.start(t+dt2);o.stop(t+dt2+1.7)})}catch(e){}},
 door(){if(!this.ctx||this.muted)return;try{const c=this.ctx,t=c.currentTime;[261.63,329.63,392,523.25].forEach(fq=>{const o=c.createOscillator();o.type='sine';o.frequency.value=fq;const gn=c.createGain();gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(.06,t+.9);gn.gain.exponentialRampToValueAtTime(.0001,t+3.6);o.connect(gn);gn.connect(this.master);o.start(t);o.stop(t+3.7)});
  const src=c.createBufferSource();src.buffer=this.noiseBuf();const f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(180,t);f.frequency.exponentialRampToValueAtTime(2400,t+2.2);const gn=c.createGain();gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(.045,t+.5);gn.gain.exponentialRampToValueAtTime(.0001,t+2.6);src.connect(f);f.connect(gn);gn.connect(this.master);src.start(t);src.stop(t+2.7)}catch(e){}},
 thunder(){if(!this.ctx||this.muted)return;try{const c=this.ctx,t=c.currentTime+.38,src=c.createBufferSource();src.buffer=this.noiseBuf();src.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(150,t);f.frequency.exponentialRampToValueAtTime(55,t+2);const gn=c.createGain();gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(.34,t+.09);gn.gain.exponentialRampToValueAtTime(.0001,t+2.3);src.connect(f);f.connect(gn);gn.connect(this.master);src.start(t);src.stop(t+2.4)}catch(e){}},
 bell(v){if(!this.ctx||this.muted)return;try{const c=this.ctx,t=c.currentTime;[[1567.98,.05],[2093,.02]].forEach(([fq,g0])=>{const o=c.createOscillator();o.type='sine';o.frequency.value=fq;const gn=c.createGain();gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(g0*v+.0001,t+.015);gn.gain.exponentialRampToValueAtTime(.0001,t+.9);o.connect(gn);gn.connect(this.master);o.start(t);o.stop(t+1)})}catch(e){}},
 rumble(){if(!this.ctx||this.muted)return;try{const c=this.ctx,t=c.currentTime,src=c.createBufferSource();src.buffer=this.noiseBuf();src.loop=true;const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=95;const gn=c.createGain();gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(.32,t+.12);gn.gain.exponentialRampToValueAtTime(.0001,t+1.8);src.connect(f);f.connect(gn);gn.connect(this.master);src.start(t);src.stop(t+1.9);
  const o=c.createOscillator();o.type='sine';o.frequency.setValueAtTime(46,t);o.frequency.exponentialRampToValueAtTime(30,t+1.5);const g2=c.createGain();g2.gain.setValueAtTime(.0001,t);g2.gain.exponentialRampToValueAtTime(.2,t+.15);g2.gain.exponentialRampToValueAtTime(.0001,t+1.7);o.connect(g2);g2.connect(this.master);o.start(t);o.stop(t+1.8)}catch(e){}},
 creature(i){if(!this.ctx||this.muted)return;try{const c=this.ctx,t=c.currentTime,conf=[[520,760],[300,190],[420,920],[360,300],[1180,1560]][i]||[[520,760]][0];
  const o=c.createOscillator();o.type='sine';o.frequency.setValueAtTime(conf[0],t);o.frequency.exponentialRampToValueAtTime(conf[1],t+.28);
  const gn=c.createGain();gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(.05,t+.05);gn.gain.exponentialRampToValueAtTime(.0001,t+.55);o.connect(gn);gn.connect(this.master);o.start(t);o.stop(t+.6)}catch(e){}},
 growl(big){if(!this.ctx||this.muted)return;try{const c=this.ctx,t=c.currentTime,o=c.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(big?92:70,t);o.frequency.exponentialRampToValueAtTime(big?36:50,t+.7);
  const f=c.createBiquadFilter();f.type='lowpass';f.frequency.value=320;const gn=c.createGain();gn.gain.setValueAtTime(.0001,t);gn.gain.exponentialRampToValueAtTime(big?.24:.12,t+.08);gn.gain.exponentialRampToValueAtTime(.0001,t+.95);o.connect(f);f.connect(gn);gn.connect(this.master);o.start(t);o.stop(t+1)}catch(e){}},
 heart(v){if(!this.ctx||this.muted)return;try{const c=this.ctx,t=c.currentTime;[[0,.16],[.15,.1]].forEach(([dt2,g0])=>{const o=c.createOscillator();o.type='sine';o.frequency.setValueAtTime(66,t+dt2);o.frequency.exponentialRampToValueAtTime(44,t+dt2+.1);const gn=c.createGain();gn.gain.setValueAtTime(.0001,t+dt2);gn.gain.exponentialRampToValueAtTime(g0*v+.0001,t+dt2+.02);gn.gain.exponentialRampToValueAtTime(.0001,t+dt2+.19);o.connect(gn);gn.connect(this.master);o.start(t+dt2);o.stop(t+dt2+.21)})}catch(e){}},
 tick(){if(!this.ctx||this.muted)return;try{const c=this.ctx,t=c.currentTime,o=c.createOscillator();o.type='square';o.frequency.value=1180;const gn=c.createGain();gn.gain.setValueAtTime(.05,t);gn.gain.exponentialRampToValueAtTime(.0001,t+.07);o.connect(gn);gn.connect(this.master);o.start(t);o.stop(t+.08)}catch(e){}},
 wardBlast(){if(!this.ctx||this.muted)return;try{const c=this.ctx,t=c.currentTime,src=c.createBufferSource();src.buffer=this.noiseBuf();const f=c.createBiquadFilter();f.type='highpass';f.frequency.setValueAtTime(400,t);f.frequency.exponentialRampToValueAtTime(4200,t+.4);const gn=c.createGain();gn.gain.setValueAtTime(.26,t);gn.gain.exponentialRampToValueAtTime(.0001,t+.8);src.connect(f);f.connect(gn);gn.connect(this.master);src.start(t);src.stop(t+.85);this.chime(4)}catch(e){}},
 toggle(){this.muted=!this.muted;$('sndBtn').textContent=this.muted?'🔇':'🔊';$('sndBtn').classList.toggle('off',this.muted);$('sndBtn').setAttribute('aria-pressed',String(!this.muted));if(!this.ctx)return;if(this.muted){this.ctx.suspend()}else{this.ctx.resume();this.scene=-1;this.setScene(level)}}
};

/* ---------------- 尺寸 / 全屏 ---------------- */
const stage=R.querySelector('.card');
function resizeRenderer(){
 const rect=view.getBoundingClientRect();
 const w=Math.max(280,rect.width),h=Math.max(190,rect.height);
 renderer.setSize(w,h,false);composer.setSize(w,h);
 camera.aspect=w/h;camera.updateProjectionMatrix();
}
let fullFallback=false;
function activeFullscreen(){return document.fullscreenElement===stage||fullFallback}
function syncFullscreen(){
 const expanded=activeFullscreen();
 $('fullBtn').textContent=expanded?'⛶ 退出全屏':'⛶ 全屏探索';
 $('fullBtn').setAttribute('aria-pressed',String(expanded));
 $('fullBtn').title=expanded?'退出全屏（Esc 或 F）':'全屏探索（快捷键 F）';
 requestAnimationFrame(()=>{resizeRenderer();view.focus({preventScroll:true})});
}
async function toggleFullscreen(){
 if(document.fullscreenElement===stage){try{await document.exitFullscreen()}catch(e){}return}
 if(fullFallback){fullFallback=false;stage.classList.remove('immersive-fallback');syncFullscreen();return}
 try{if(!stage.requestFullscreen)throw new Error('unavailable');await stage.requestFullscreen({navigationUI:'hide'})}
 catch(e){fullFallback=true;stage.classList.add('immersive-fallback');syncFullscreen()}
}
$('fullBtn').addEventListener('pointerdown',e=>e.stopPropagation());
$('fullBtn').addEventListener('click',e=>{e.stopPropagation();toggleFullscreen()});
document.addEventListener('fullscreenchange',syncFullscreen);
window.addEventListener('resize',()=>requestAnimationFrame(resizeRenderer));
if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>requestAnimationFrame(resizeRenderer)).observe(view);
/* ---------------- 输入 ---------------- */
const finePointer=typeof matchMedia==='undefined'||matchMedia('(pointer:fine)').matches;
let locked=false;
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===view});
document.addEventListener('mousemove',e=>{if(locked&&!overlay){a+=e.movementX*.0024;pitch=clamp(pitch-e.movementY*.0019,-.95,.95)}});
view.addEventListener('click',e=>{if(e.target.closest('.result,.mapbox,.fullscreen-btn,.snd-btn,#intro'))return;if(finePointer&&!locked&&view.requestPointerLock){try{const lp=view.requestPointerLock();if(lp&&lp.catch)lp.catch(()=>{})}catch(err){}}});
function active(){return R.contains(document.activeElement)||activeFullscreen()||locked}
document.addEventListener('keydown',e=>{
 if(!R.isConnected||!active())return;
 const k=e.key.length===1?e.key.toLowerCase():e.key;
 if(k==='Escape'&&fullFallback){fullFallback=false;stage.classList.remove('immersive-fallback');syncFullscreen();return}
 if(k==='f'&&!e.repeat){toggleFullscreen();e.preventDefault();return}
 if('wasd'.includes(k)||k.startsWith('Arrow')){keys[k]=true;e.preventDefault()}
 if(e.repeat)return;
 if(k==='m'){toggleMap();e.preventDefault()}else if(k==='e'){interact();e.preventDefault()}else if(k==='h'){hint();e.preventDefault()}else if(k==='q'){useWard();e.preventDefault()}
});
document.addEventListener('keyup',e=>{let k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=false});
window.addEventListener('blur',()=>keys={});
let dragging=false,lastX=0,lastY=0;
view.addEventListener('pointerdown',e=>{if(e.target.closest('.result,.mapbox,.fullscreen-btn,.snd-btn,#intro'))return;AudioSys.wake();dragging=true;lastX=e.clientX;lastY=e.clientY;view.setPointerCapture(e.pointerId);view.focus()});
view.addEventListener('pointermove',e=>{if(!dragging||locked||overlay)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;a+=dx*.0068;pitch=clamp(pitch-dy*.0045,-.95,.95)});
view.addEventListener('pointerup',()=>dragging=false);view.addEventListener('pointercancel',()=>dragging=false);
R.querySelectorAll('[data-control]').forEach(b=>{const k=b.dataset.control;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[k]=true;view.focus()});const up=e=>{keys[k]=false;e.preventDefault()};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',()=>keys[k]=false)});
$('actBtn').addEventListener('click',()=>{interact();view.focus()});
$('hintBtn').addEventListener('click',()=>{hint();view.focus()});
$('mapBtn').addEventListener('click',()=>{toggleMap();view.focus()});
$('next').addEventListener('click',()=>{if(failMode){failMode=false;load(level)}else load(level===9?0:level+1)});
$('wardBtn').addEventListener('click',()=>{useWard();view.focus()});
$('sndBtn').addEventListener('pointerdown',e=>e.stopPropagation());
$('sndBtn').addEventListener('click',e=>{e.stopPropagation();AudioSys.ensure();AudioSys.toggle();view.focus()});
$('startBtn').addEventListener('click',()=>{$('intro').classList.add('hide');AudioSys.ensure();AudioSys.wake();AudioSys.setScene(level);view.focus();cineBars()});
/* ---------------- 启动 ---------------- */
load(0);resizeRenderer();requestAnimationFrame(animate);
window.__FIVE_REALMS_TEST__={
 get state(){return{level,px,py,a,elapsed,found:[...found],overlay,unlocked,failMode,relics:[...relics],relicTaken,mapTaken,seen:seen.size,door:world.door,items:world.items,relic:world.relic,mapPiece:world.mapPiece,wards:world.wards,chest:world.chest,chestOpened:sc.chestMesh?sc.chestMesh.opened:null,wardCharges,timeLeft,calmT,monsters:sc.monsters.map(m=>({x:m.x,y:m.y,mode:m.mode,stun:m.stunT})),secret:world.secret,secretOpened:sc.secretState?sc.secretState.opened:null,map:world.map,reachable:world.reachable}},
 load,setPosition(x,y){px=x;py=y;reveal();tryCollect()},interact,nearGate,complete,hint,useWard,fail,
 setTime(v){timeLeft=v},
 setCalm(v){calmT=v},
 moveMonster(i2,x,y){const m=sc.monsters[i2];if(m){m.x=x;m.y=y;m.tx=x;m.ty=y}},
 advance(){load(Math.min(9,level+1))},get allMazes(){return mazes},
 get display(){return{fullscreen:activeFullscreen(),view:[view.clientWidth,view.clientHeight],quality:qualityLevel,webgl:!!renderer.getContext()}}
};
