// HÆMA 0.2 — geração procedural própria de cenas e cômodos (sem assets externos).
import {starterScene,tileIndex} from './scene.js?v=5';
import {planRoomFurniture} from './room-layout.js?v=1';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const seedFrom=value=>{let n=2166136261;for(const c of String(value))n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0};
const random=seed=>{let state=seed>>>0;return()=>{state=(state+0x6D2B79F5)>>>0;let t=Math.imul(state^(state>>>15),1|state);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296}};
const addProp=(s,p)=>{if(s.props.length<500&&p.x>=0&&p.y>=0&&p.x<=s.cols&&p.y<=s.rows)s.props.push(p)};
const wall=(s,x1,y1,x2,y2)=>{if(s.walls.length<400&&Math.hypot(x1-x2,y1-y2)>.05)s.walls.push({x1,y1,x2,y2})};
export function makeRoom(s,opts={}){
 const x=clamp(Math.floor(opts.x??4),0,s.cols-3),y=clamp(Math.floor(opts.y??4),0,s.rows-3);
 const w=clamp(Math.floor(opts.w??8),3,s.cols-x),h=clamp(Math.floor(opts.h??7),3,s.rows-y);
 const floor=['wood','stone','marble','brick'].includes(opts.floor)?opts.floor:'wood';
 const door=opts.door===false?false:(['north','south','west','east'].includes(opts.door)?opts.door:'south');
 const midX=x+Math.floor(w/2),midY=y+Math.floor(h/2);
 for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++){s.tiles[tileIndex(s,xx,yy)]=floor;s.heights[tileIndex(s,xx,yy)]=0;}
 // Split exactly one wall segment to leave a navigable threshold.
 if(door==='north'){wall(s,x,y,midX,y);wall(s,midX+1,y,x+w,y);}
 else wall(s,x,y,x+w,y);
 if(door==='south'){wall(s,x,y+h,midX,y+h);wall(s,midX+1,y+h,x+w,y+h);}
 else wall(s,x,y+h,x+w,y+h);
 if(door==='west'){wall(s,x,y,x,midY);wall(s,x,midY+1,x,y+h);}
 else wall(s,x,y,x,y+h);
 if(door==='east'){wall(s,x+w,y,x+w,midY);wall(s,x+w,midY+1,x+w,y+h);}
 else wall(s,x+w,y,x+w,y+h);
 if(door){
  const p=door==='north'?{x:midX+.5,y}:door==='south'?{x:midX+.5,y:y+h}:door==='west'?{x,y:midY+.5}:{x:x+w,y:midY+.5};
  addProp(s,{...p,type:'door',rotation:door==='north'||door==='south'?0:90});
 }
 return {x,y,w,h,floor,door};
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
export function generateScene(kind='forest',seed=Date.now()){
 const rand=random(seedFrom(seed)),s=starterScene();
 s.atmosphere={preset:kind==='dungeon'?'underground':kind==='tavern'?'sunset':'day',strength:kind==='dungeon'?.86:1};
 s.tiles.fill('grass');s.fog.fill(0);s.heights=Array(s.cols*s.rows).fill(0);
 s.tokens=[];s.props=[];s.walls=[];s.background=null;
 const {cols,rows}=s;
 const set=(x,y,t)=>{if(x>=0&&y>=0&&x<cols&&y<rows)s.tiles[tileIndex(s,x,y)]=t};
 const hill=(cx,cy,r,peak=3)=>{for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const distance=Math.hypot((x+.5-cx)*1.02,y+.5-cy);const height=Math.max(0,Math.min(4,Math.ceil((r-distance)/Math.max(1,r/peak))));const i=tileIndex(s,x,y);s.heights[i]=Math.max(s.heights[i],height);}};
 if(kind==='forest'||kind==='lake'){
  s.name=kind==='forest'?'Bosque antigo · cenário gerado':'Lago e margem · cenário gerado';
  hill(5,5,6.7,3);hill(23,13,5.1,2);hill(19,3,4.1,2);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
   const wobble=Math.sin(y*.63+seedFrom(seed)%10)*1.8+Math.cos(y*.31)*1.3;
   const road=Math.abs(x-(cols/2+wobble))<1.4;
   const water=kind==='lake'?x<6+Math.sin(y*.42)*2.6+(y>11?2:0):
    Math.hypot((x-22)/1.2,(y-10)/1.4)<3.4;
   if(water){set(x,y,'water');s.heights[tileIndex(s,x,y)]=0;}
   else if(kind==='lake'&&x<9+Math.sin(y*.42)*2.6)set(x,y,'sand');
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
  const rooms=[
   makeRoom(s,{x:3,y:3,w:12,h:12,floor:'wood',door:'south'}),
   makeRoom(s,{x:15,y:3,w:10,h:6,floor:'wood',door:'south'}),
   makeRoom(s,{x:15,y:9,w:10,h:6,floor:'wood',door:'west'})
  ];
  decorateRoom(s,rooms[0],rand,'tavern');decorateRoom(s,rooms[1],rand,'bedroom');decorateRoom(s,rooms[2],rand,'library');
  for(let k=0;k<3;k++)addProp(s,{x:6+k*3.4,y:5.4,type:'table'});
  addProp(s,{x:12,y:13,type:'hearth'});
 }else if(kind==='dungeon'){
  s.name='Ruínas subterrâneas · cenário gerado';s.tiles.fill('earth');s.heights.fill(0);
  const rooms=[
   makeRoom(s,{x:2,y:3,w:10,h:11,floor:'stone',door:'east'}),
   makeRoom(s,{x:12,y:5,w:6,h:6,floor:'stone',door:'west'}),
   makeRoom(s,{x:18,y:2,w:8,h:13,floor:'stone',door:'west'})
  ];
  rooms.forEach((room,i)=>decorateRoom(s,room,rand,i===0?'common':i===1?'library':'bedroom'));
  for(const p of [{x:8.5,y:4.5},{x:20.5,y:12.5}])addProp(s,{...p,type:'torch'});
 }else throw Error('Tipo de geração desconhecido.');
 return s;
}
