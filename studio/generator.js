// HÆMA 0.2 — geração procedural própria de cenas e cômodos (sem assets externos).
import {starterScene,tileIndex} from './scene.js?v=7';
import {planRoomFurniture} from './room-layout.js?v=1';
import {planRoomTopology} from './room-topology.js?v=1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const seedFrom=value=>{let n=2166136261;for(const c of String(value))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0};
const random=seed=>{let state=seed>>>0;return()=>{state=(state+0x6D2B79F5)>>>0;let t=Math.imul(state^(state>>>15),1|state);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296}};
const addProp=(s,p)=>{if(s.props.length<500&&p.x>=0&&p.y>=0&&p.x<=s.cols&&p.y<=s.rows)s.props.push(p)};
export function makeRoom(s,opts={}){
 const x=clamp(Math.floor(opts.x??4),0,s.cols-3),y=clamp(Math.floor(opts.y??4),0,s.rows-3);
 const w=clamp(Math.floor(opts.w??8),3,s.cols-x),h=clamp(Math.floor(opts.h??7),3,s.rows-y);
 const floor=['wood','stone','marble','brick'].includes(opts.floor)?opts.floor:'wood';
 const door=opts.door===false?false:(['north','south','west','east','auto'].includes(opts.door)?opts.door:'south');
 // Build connected room perimeter before painting, so failures are atomic.
 const structure=planRoomTopology(s.walls,s.props,{x,y,w,h,door});
 for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){
  s.tiles[tileIndex(s,xx,yy)]=floor;s.heights[tileIndex(s,xx,yy)]=0;
 }
 s.walls=structure.walls;
 if(structure.doorProp)addProp(s,structure.doorProp);
 return {x,y,w,h,floor,door:structure.door};
}
function decorateRoom(s,room,rand,kind='common'){
 const choices=planRoomFurniture(room,kind,rand,s.props);
 for(const prop of choices)addProp(s,prop);
}
export function furnishRoom(scene,room,kind='empty',seed='interior'){
 if(kind==='empty')return 0;
 if(!['bedroom','library','tavern','common'].includes(kind))throw Error('Ambiente desconhecido.');
 const before=scene.props.length;
 const rand=random(seedFrom(String(seed)+':'+room.x+':'+room.y+':'+kind));
 decorateRoom(scene,room,rand,kind);
 return scene.props.length-before;
}
export function generateScene(kind='forest',seed=Date.now(),dimensions={}){
 const rand=random(seedFrom(seed)),s=starterScene();
 const cols=Number(dimensions.cols??s.cols),rows=Number(dimensions.rows??s.rows);
 if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols<8||cols>80||rows<8||rows>80)
  throw Error('A geração aceita mapas de 8 a 80 células por lado.');
 s.cols=cols;s.rows=rows;
 s.atmosphere={preset:kind==='dungeon'?'underground':kind==='tavern'?'sunset':'day',strength:kind==='dungeon'?.86:1};
 s.tiles=Array(cols*rows).fill('grass');s.fog=Array(cols*rows).fill(0);s.heights=Array(cols*rows).fill(0);
 s.tokens=[];s.props=[];s.walls=[];s.paths=[];s.surfaceStrokes=[];s.background=null;
 const sx=n=>n*cols/28,sy=n=>n*rows/18;
 const spacious=cols>=20&&rows>=14;
 const scaledRoom=(x,y,w,h,options={})=>makeRoom(s,{
  x:Math.round(sx(x)),y:Math.round(sy(y)),w:Math.max(3,Math.round(sx(w))),
  h:Math.max(3,Math.round(sy(h))),...options
 });
 const set=(x,y,t)=>{if(x>=0&&y>=0&&x<cols&&y<rows)s.tiles[tileIndex(s,x,y)]=t};
 const hill=(cx,cy,r,peak=3)=>{for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const distance=Math.hypot((x+.5-cx)*1.02,y+.5-cy);const height=Math.max(0,Math.min(4,Math.ceil((r-distance)/Math.max(1,r/peak))));const i=tileIndex(s,x,y);s.heights[i]=Math.max(s.heights[i],height);}};
 if(kind==='forest'||kind==='lake'){
  s.name=kind==='forest'?'Bosque antigo · cenário gerado':'Lago e margem · cenário gerado';
  const unit=Math.min(cols/28,rows/18);
  hill(sx(5),sy(5),6.7*unit,3);hill(sx(23),sy(13),5.1*unit,2);hill(sx(19),sy(3),4.1*unit,2);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const wobble=Math.sin(y/Math.max(.2,rows/18)*.63+seedFrom(seed)%10)*sx(1.8)+Math.cos(y/Math.max(.2,rows/18)*.31)*sx(1.3);
   const road=Math.abs(x-(cols/2+wobble))<Math.max(.55,sx(1.4));
   const water=kind==='lake'?x<sx(6)+Math.sin(y/Math.max(.2,rows/18)*.42)*sx(2.6)+(y>sy(11)?sx(2):0):
    Math.hypot((x-sx(22))/(sx(1.2)),(y-sy(10))/(sy(1.4)))<3.4;
   if(water){set(x,y,'water');s.heights[tileIndex(s,x,y)]=0;}
   else if(kind==='lake'&&x<sx(9)+Math.sin(y/Math.max(.2,rows/18)*.42)*sx(2.6))set(x,y,'sand');
   else if(road)set(x,y,'earth');
   else if(rand()<.07)set(x,y,'earth');
  }
  for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){
   const tile=s.tiles[tileIndex(s,x,y)];if(tile!=='grass')continue;
   if(rand()<.15){addProp(s,{x:x+.5+(rand()-.5)*.5,y:y+.5+(rand()-.5)*.5,type:'tree'});}
   else if(rand()<.09)addProp(s,{x:x+.5,y:y+.5,type:'bush'});
   else if(rand()<.035)addProp(s,{x:x+.5,y:y+.5,type:'rock'});
  }
 }else if(kind==='tavern'){
  s.name='Estalagem antiga · cenário gerado';s.tiles.fill('earth');s.heights.fill(0);
  if(spacious){
   const rooms=[
    scaledRoom(3,3,12,12,{floor:'wood',door:'south'}),
    scaledRoom(15,3,10,6,{floor:'wood',door:'south'}),
    scaledRoom(15,9,10,6,{floor:'wood',door:'west'})
   ];
   decorateRoom(s,rooms[0],rand,'tavern');decorateRoom(s,rooms[1],rand,'bedroom');decorateRoom(s,rooms[2],rand,'library');
   for(let k=0;k<3;k++)addProp(s,{x:sx(6+k*3.4),y:sy(5.4),type:'table'});
   addProp(s,{x:sx(12),y:sy(13),type:'hearth'});
  }else{
   const room=makeRoom(s,{x:1,y:1,w:cols-2,h:rows-2,floor:'wood',door:'south'});
   decorateRoom(s,room,rand,'tavern');
   addProp(s,{x:cols*.5,y:rows*.5,type:'hearth'});
  }
 }else if(kind==='dungeon'){
  s.name='Ruínas subterrâneas · cenário gerado';s.tiles.fill('earth');s.heights.fill(0);
  if(spacious){
   const rooms=[
    scaledRoom(2,3,10,11,{floor:'stone',door:'east'}),
    scaledRoom(12,5,6,6,{floor:'stone',door:'west'}),
    scaledRoom(18,2,8,13,{floor:'stone',door:'west'})
   ];
   rooms.forEach((room,i)=>decorateRoom(s,room,rand,i===0?'common':i===1?'library':'bedroom'));
   for(const p of [{x:sx(8.5),y:sy(4.5)},{x:sx(20.5),y:sy(12.5)}])addProp(s,{...p,type:'torch'});
  }else{
   const room=makeRoom(s,{x:1,y:1,w:cols-2,h:rows-2,floor:'stone',door:'south'});
   decorateRoom(s,room,rand,'common');
   addProp(s,{x:cols*.5,y:rows*.5,type:'torch'});
  }
 }else throw Error('Tipo de geração desconhecido.');
 return s;
}
