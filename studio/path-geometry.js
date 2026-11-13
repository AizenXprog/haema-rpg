// HÆMA Estúdio — editor vetorial de trilhas e cursos d'água.
// Coordenadas armazenadas em células para compatibilidade com qualquer tamanho de mapa.
export const PATH_KINDS=['road','river'];
export const ROAD_MATERIALS={earth:'#8f7656',sand:'#bd9b6b',stone:'#88897f',brick:'#967769',wood:'#927056'};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const finite=(n)=>typeof n==='number'&&Number.isFinite(n);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const oneDecimal=v=>Math.round(v*1000)/1000;
export function sanitizePath(raw,cols,rows){
 if(!raw||!PATH_KINDS.includes(raw.kind)||!Array.isArray(raw.points))return null;
 if(raw.points.length<2||raw.points.length>180)return null;
 const points=[];
 for(const p of raw.points){
  if(!p||!finite(p.x)||!finite(p.y)||p.x<0||p.y<0||p.x>cols||p.y>rows)return null;
  const n={x:oneDecimal(p.x),y:oneDecimal(p.y)};
  if(!points.length||dist(n,points[points.length-1])>.015)points.push(n);
 }
 if(points.length<2)return null;
 const width=finite(raw.width)?clamp(oneDecimal(raw.width),.5,4):1.25;
 const material=Object.hasOwn(ROAD_MATERIALS,raw.material)?raw.material:'earth';
 const id=typeof raw.id==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(raw.id)?raw.id:null;
 return {id:id||'path-'+points.map(p=>Math.round(p.x*10)+'-'+Math.round(p.y*10)).join('').slice(0,36),
  kind:raw.kind,width,material,bridge:raw.bridge!==false,points};
}
export function makePath(kind,points,options={}){
 const path=sanitizePath({kind,points,width:options.width??1.25,material:options.material??'earth',bridge:options.bridge!==false,id:options.id},options.cols??80,options.rows??80);
 if(!path)throw Error('Trace um caminho válido, com pelo menos dois pontos.');
 return path;
}
function perpendicularDistance(p,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy;
 const t=den?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/den,0,1):0;
 return Math.hypot(p.x-(a.x+dx*t),p.y-(a.y+dy*t));
}
export function simplifyPoints(points,tolerance=.085){
 if(points.length<3)return points.map(p=>({...p}));
 const retain=new Set([0,points.length-1]),stack=[[0,points.length-1]];
 while(stack.length){
  const [start,end]=stack.pop();
  let max=0,index=-1;
  for(let i=start+1;i<end;i++){
   const d=perpendicularDistance(points[i],points[start],points[end]);
   if(d>max){max=d;index=i;}
  }
  if(max>tolerance&&index!==-1){retain.add(index);stack.push([start,index],[index,end]);}
 }
 return [...retain].sort((a,b)=>a-b).map(i=>({...points[i]}));
}
export function addStrokePoint(points,p,{spacing=.11,max=180}={}){
 if(!finite(p?.x)||!finite(p?.y)||points.length>=max)return false;
 if(points.length&&dist(p,points[points.length-1])<spacing)return false;
 points.push({x:oneDecimal(p.x),y:oneDecimal(p.y)});return true;
}
export function nearestPath(paths,p){
 if(!Array.isArray(paths))return null;
 let found=null,min=Infinity;
 for(let i=paths.length-1;i>=0;i--){
  const path=paths[i];if(!path?.points||path.points.length<2)continue;
  for(let j=1;j<path.points.length;j++){
   const d=perpendicularDistance(p,path.points[j-1],path.points[j]);
   const allowance=path.width/2+.27;
   if(d<=allowance&&d<min){found=path;min=d;}
  }
 }
 return found;
}
export function movePath(path,basePoints,dx,dy,cols,rows){
 if(!Array.isArray(basePoints)||basePoints.length!==path.points.length)return;
 const minX=Math.min(...basePoints.map(p=>p.x)),maxX=Math.max(...basePoints.map(p=>p.x));
 const minY=Math.min(...basePoints.map(p=>p.y)),maxY=Math.max(...basePoints.map(p=>p.y));
 dx=clamp(dx,-minX,cols-maxX);dy=clamp(dy,-minY,rows-maxY);
 path.points=basePoints.map(p=>({x:oneDecimal(p.x+dx),y:oneDecimal(p.y+dy)}));
}
function trace(ctx,points,cell){
 ctx.beginPath();ctx.moveTo(points[0].x*cell,points[0].y*cell);
 if(points.length===2){ctx.lineTo(points[1].x*cell,points[1].y*cell);return;}
 for(let i=1;i<points.length-1;i++){
  const curr=points[i],next=points[i+1];
  ctx.quadraticCurveTo(curr.x*cell,curr.y*cell,(curr.x+next.x)*cell/2,(curr.y+next.y)*cell/2);
 }
 const last=points[points.length-1];ctx.lineTo(last.x*cell,last.y*cell);
}
export function drawPath(ctx,path,cell=48,{preview=false}={}){
 if(!path?.points||path.points.length<2)return;
 const width=path.width*cell;
 const isRiver=path.kind==='river',base=isRiver?'#356f7b':(ROAD_MATERIALS[path.material]||ROAD_MATERIALS.earth);
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 if(preview){ctx.globalAlpha=.72;ctx.setLineDash([cell*.14,cell*.11]);}
 trace(ctx,path.points,cell);ctx.lineWidth=width+cell*.37;
 ctx.strokeStyle=isRiver?'#98aa907a':'#3333276e';ctx.stroke();
 trace(ctx,path.points,cell);ctx.lineWidth=width+cell*.12;
 ctx.strokeStyle=isRiver?'#9cad877a':'#bcab8b70';ctx.stroke();
 trace(ctx,path.points,cell);ctx.lineWidth=width;
 ctx.strokeStyle=base;ctx.stroke();
 if(!preview){
  trace(ctx,path.points,cell);ctx.lineWidth=Math.max(1,width*.64);
  ctx.strokeStyle=isRiver?'#6aa7ac61':'#e6d0ac32';ctx.stroke();
  // Intermittent highlights lie within the path: decorative, not a tile grid.
  ctx.lineWidth=Math.max(1,cell*.026);ctx.strokeStyle=isRiver?'#afd9d078':'#f1e2c525';
  for(let i=1;i<path.points.length;i+=Math.max(2,Math.ceil(path.points.length/16))){
   const p=path.points[i],prev=path.points[i-1],a=Math.atan2(p.y-prev.y,p.x-prev.x);
   const offset=Math.min(width*.23,cell*.28);
   ctx.beginPath();ctx.moveTo(p.x*cell-Math.sin(a)*offset,p.y*cell+Math.cos(a)*offset);
   ctx.lineTo(p.x*cell+Math.sin(a)*offset,p.y*cell-Math.cos(a)*offset);ctx.stroke();
  }
 }
 ctx.restore();
}
