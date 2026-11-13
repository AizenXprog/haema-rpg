// HÆMA Estúdio 0.5 LAB — original grid-edge topology for shared room walls.
// Legacy freehand/diagonal walls are kept unchanged; architectural walls are deduplicated.
const near=(a,b)=>Math.abs(a-b)<1e-6;
const integral=n=>Number.isFinite(n)&&near(n,Math.round(n));
const half=n=>Number.isFinite(n)&&near(n-Math.floor(n),.5);
const edge=(kind,at,position)=>kind+':'+at+':'+position;
function structuralSegments(wall){
 const {x1,y1,x2,y2}=wall;
 if(![x1,y1,x2,y2].every(Number.isFinite))return null;
 if(integral(y1)&&near(y1,y2)&&integral(x1)&&integral(x2)&&!near(x1,x2)){
  return {kind:'h',fixed:Math.round(y1),from:Math.min(x1,x2),to:Math.max(x1,x2)};
 }
 if(integral(x1)&&near(x1,x2)&&integral(y1)&&integral(y2)&&!near(y1,y2)){
  return {kind:'v',fixed:Math.round(x1),from:Math.min(y1,y2),to:Math.max(y1,y2)};
 }
 return null;
}
function doorEdge(prop){
 if(prop?.type!=='door')return null;
 if(integral(prop.y)&&half(prop.x))return edge('h',Math.round(prop.y),Math.floor(prop.x));
 if(integral(prop.x)&&half(prop.y))return edge('v',Math.round(prop.x),Math.floor(prop.y));
 return null;
}
function roomEdges(room,side){
 const {x,y,w,h}=room,segments=[];
 if(side==='north'||side==='south'){
  const at=side==='north'?y:y+h;
  for(let i=x;i<x+w;i++)segments.push(edge('h',at,i));
 }else{
  const at=side==='west'?x:x+w;
  for(let i=y;i<y+h;i++)segments.push(edge('v',at,i));
 }
 return segments;
}
function automaticSide(existing,room,props){
 const sides=['west','east','north','south'];
 let best='south',count=0;
 const established=new Set([...existing,...(props||[]).map(doorEdge).filter(Boolean)]);
 for(const side of sides){
  const score=roomEdges(room,side).filter(k=>established.has(k)).length;
  if(score>count){best=side;count=score;}
 }
 return best;
}
function openingFor(room,side,props){
 const {x,y,w,h}=room;
 const matching=(props||[]).find(p=>{
  const key=doorEdge(p);
  return key!==null&&roomEdges(room,side).includes(key);
 });
 if(matching)return {x:matching.x,y:matching.y,existing:true};
 const midX=x+Math.floor(w/2),midY=y+Math.floor(h/2);
 if(side==='north')return {x:midX+.5,y,existing:false};
 if(side==='south')return {x:midX+.5,y:y+h,existing:false};
 if(side==='west')return {x,y:midY+.5,existing:false};
 return {x:x+w,y:midY+.5,existing:false};
}
function mergeUnitEdges(edgeSet){
 const groups=new Map();
 for(const key of edgeSet){
  const [kind,fixed,position]=key.split(':');
  const group=kind+':'+fixed;
  if(!groups.has(group))groups.set(group,[]);
  groups.get(group).push(Number(position));
 }
 const merged=[];
 for(const [group,values] of [...groups].sort(([a],[b])=>a.localeCompare(b))){
  values.sort((a,b)=>a-b);
  const [kind,fixedText]=group.split(':'),fixed=Number(fixedText);
  let start=null,end=null;
  const push=()=>{
   if(start===null)return;
   merged.push(kind==='h'?{x1:start,y1:fixed,x2:end,y2:fixed}:{x1:fixed,y1:start,x2:fixed,y2:end});
  };
  for(const position of values){
   if(start===null){start=position;end=position+1;}
   else if(position===end)end++;
   else{push();start=position;end=position+1;}
  }
  push();
 }
 return merged;
}
export function planRoomTopology(existingWalls,existingProps,room,{maxWalls=400,maxProps=500}={}){
 const {x,y,w,h}=room;
 if(![x,y,w,h].every(integral)||w<3||h<3)throw Error('Cômodo inválido para a topologia.');
 const set=new Set(),free=[];
 for(const wall of existingWalls||[]){
  const segment=structuralSegments(wall);
  if(!segment){free.push(wall);continue;}
  for(let at=segment.from;at<segment.to;at++)set.add(edge(segment.kind,segment.fixed,at));
 }
 const door=room.door===false?false:
  ['north','south','east','west'].includes(room.door)?room.door:
  room.door==='auto'?automaticSide(set,room,existingProps):'south';
 for(const side of ['north','south','east','west']){
  for(const key of roomEdges(room,side))set.add(key);
 }
 let doorProp=null;
 const openings=(existingProps||[]).map(doorEdge).filter(Boolean);
 if(door){
  const position=openingFor(room,door,existingProps);
  if(!position.existing){
   if((existingProps||[]).length>=maxProps)throw Error('Limite de objetos do mapa atingido.');
   doorProp={x:position.x,y:position.y,type:'door',rotation:['north','south'].includes(door)?0:90};
   openings.push(doorEdge(doorProp));
  }
 }
 for(const open of openings)set.delete(open);
 const walls=[...free,...mergeUnitEdges(set)];
 if(walls.length>maxWalls)throw Error('Limite de paredes atingido. Divida o mapa em ambientes menores.');
 return {walls,door,doorProp};
}
