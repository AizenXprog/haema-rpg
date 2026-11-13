// HÆMA Estúdio LAB — tinta livre vetorial e independente da malha lógica.
// Uma pincelada permanece editável/exportável como dados, não como PNG achatado.
export const SURFACE_COLORS={
 grass:[61,96,67],stone:[113,116,111],earth:[139,103,72],water:[43,109,128],
 sand:[181,153,105],wood:[133,95,62],brick:[126,89,74],marble:[167,160,145]
};
const cache=new WeakMap();
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function sanitizeSurfaceStroke(raw,cols,rows){
 if(!raw||!Object.prototype.hasOwnProperty.call(SURFACE_COLORS,raw.material)||!Array.isArray(raw.points))return null;
 if(raw.points.length<1||raw.points.length>450)return null;
 const pts=[];
 for(const p of raw.points){
  if(!p||!finite(p.x)||!finite(p.y)||p.x<0||p.y<0||p.x>cols||p.y>rows)return null;
  if(pts.length&&Math.hypot(pts[pts.length-1].x-p.x,pts[pts.length-1].y-p.y)<.012)continue;
  pts.push({x:Math.round(p.x*1000)/1000,y:Math.round(p.y*1000)/1000});
 }
 if(!pts.length)return null;
 return {material:raw.material,radius:finite(raw.radius)?clamp(raw.radius,.2,5):1,
  softness:finite(raw.softness)?clamp(raw.softness,0,1):.7,
  opacity:finite(raw.opacity)?clamp(raw.opacity,.1,1):1,
  points:pts};
}
function rgba(rgb,a){return 'rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+Math.max(0,Math.min(1,a)).toFixed(3)+')';}
function line(ctx,points,cell){
 const x=points[0].x*cell,y=points[0].y*cell;
 ctx.beginPath();ctx.moveTo(x,y);
 if(points.length===1){ctx.lineTo(x+.004,y+.004);return;}
 if(points.length===2){ctx.lineTo(points[1].x*cell,points[1].y*cell);return;}
 for(let i=1;i<points.length-1;i++){
  const current=points[i],next=points[i+1];
  ctx.quadraticCurveTo(current.x*cell,current.y*cell,
    (current.x+next.x)*cell*.5,(current.y+next.y)*cell*.5);
 }
 const last=points[points.length-1];
 ctx.lineTo(last.x*cell,last.y*cell);
}
export function drawSurfaceStroke(ctx,stroke,cell=48,{preview=false}={}){
 if(!stroke?.points?.length||!SURFACE_COLORS[stroke.material]||!ctx?.beginPath)return;
 const color=SURFACE_COLORS[stroke.material];
 const width=stroke.radius*cell*2,soft=clamp(stroke.softness,0,1),opacity=clamp(stroke.opacity,.1,1);
 ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
 if(preview)ctx.globalAlpha=.65;
 // Three continuous edges avoid any tile-square silhouette.
 const layers=[
  {width:width*(1+soft*.52),alpha:.12},
  {width:width*(1+soft*.14),alpha:.38},
  {width:width*(1-soft*.28),alpha:.80}
 ];
 for(const layer of layers){
  line(ctx,stroke.points,cell);ctx.lineWidth=Math.max(.5,layer.width);
  ctx.strokeStyle=rgba(color,layer.alpha*opacity);ctx.stroke();
 }
 if(stroke.material==='water'&&stroke.points.length>=2){
  line(ctx,stroke.points,cell);ctx.lineWidth=Math.max(.4,cell*.035);
  ctx.strokeStyle='rgba(173,218,213,'+(.14*opacity).toFixed(3)+')';ctx.stroke();
 }
 ctx.restore();
}
export function invalidateSurfacePaint(scene){cache.delete(scene);}
export function renderSurfacePaint(ctx,scene,cell=48){
 const strokes=scene.surfaceStrokes||[];
 if(!strokes.length)return false;
 const width=scene.cols*cell,height=scene.rows*cell;
 if(typeof document==='undefined'||!ctx?.drawImage){
  for(const stroke of strokes)drawSurfaceStroke(ctx,stroke,cell);
  return true;
 }
 let stored=cache.get(scene);
 if(!stored||stored.length!==strokes.length||stored.width!==width||stored.height!==height){
  const quality=Math.min(1,Math.sqrt(2200000/(width*height)));
  const canvas=document.createElement('canvas');
  canvas.width=Math.ceil(width*quality);canvas.height=Math.ceil(height*quality);
  const off=canvas.getContext('2d');
  if(!off)return false;
  off.scale(quality,quality);
  for(const stroke of strokes)drawSurfaceStroke(off,stroke,cell);
  stored={canvas,width,height,length:strokes.length};
  cache.set(scene,stored);
 }
 ctx.save();ctx.imageSmoothingEnabled=true;
 ctx.drawImage(stored.canvas,0,0,width,height);ctx.restore();
 return true;
}
export function appendSurfacePoint(points,point,{spacing=.12,max=450}={}){
 if(!finite(point?.x)||!finite(point?.y)||points.length>=max)return false;
 const prev=points[points.length-1];
 if(prev&&Math.hypot(prev.x-point.x,prev.y-point.y)<spacing)return false;
 points.push({x:Math.round(point.x*1000)/1000,y:Math.round(point.y*1000)/1000});
 return true;
}
