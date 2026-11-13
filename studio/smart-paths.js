// HÆMA Estúdio LAB — conexões geométricas e alças de edição originais.
// Referências de UX: pontes automáticas e edição vetorial por pontos. Sem código/arte proprietários.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const subtract=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const round3=x=>Math.round(x*1000)/1000;
export function segmentIntersection(a,b,c,d){
 const r=subtract(b,a),s=subtract(d,c),delta=subtract(c,a),den=cross(r,s);
 if(Math.abs(den)<1e-8)return null;
 const t=cross(delta,s)/den,u=cross(delta,r)/den;
 if(t<0||t>1||u<0||u>1)return null;
 return {x:a.x+t*r.x,y:a.y+t*r.y,t,u};
}
function segmentProjection(p,a,b){
 const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;
 const t=l?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l,0,1):0;
 const hit={x:a.x+dx*t,y:a.y+dy*t};
 return {...hit,t,distance:distance(p,hit)};
}
const BIN_SIZE=3;
function binsForSegment(a,b){
 const x0=Math.floor(Math.min(a.x,b.x)/BIN_SIZE),x1=Math.floor(Math.max(a.x,b.x)/BIN_SIZE);
 const y0=Math.floor(Math.min(a.y,b.y)/BIN_SIZE),y1=Math.floor(Math.max(a.y,b.y)/BIN_SIZE);
 const bins=[];
 for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)bins.push(x+':'+y);
 return bins;
}
export function collectBridges(paths,{limit=64}={}){
 if(!Array.isArray(paths)||limit<=0)return [];
 const roads=paths.filter(p=>p?.kind==='road'&&p.bridge!==false&&p.points?.length>=2);
 const rivers=paths.filter(p=>p?.kind==='river'&&p.points?.length>=2);
 const index=new Map();
 // Spatial hashing: crossing detection is local, not every path against every other path.
 let segmentId=0;
 for(const river of rivers)for(let i=1;i<river.points.length;i++){
  const c=river.points[i-1],d=river.points[i],vector=subtract(d,c);
  const riverLen=Math.hypot(vector.x,vector.y);
  if(riverLen<1e-4)continue;
  const segment={id:segmentId++,river,c,d,vector,riverLen};
  for(const key of binsForSegment(c,d)){
   if(!index.has(key))index.set(key,[]);
   index.get(key).push(segment);
  }
 }
 const bridges=[];
 for(const road of roads){
  for(let i=1;i<road.points.length;i++){
   const a=road.points[i-1],b=road.points[i];
   const roadDir=subtract(b,a),roadLen=Math.hypot(roadDir.x,roadDir.y);
   if(roadLen<1e-4)continue;
   const seen=new Set();
   for(const cell of binsForSegment(a,b)){
    for(const riverPart of index.get(cell)||[]){
     if(seen.has(riverPart.id))continue;
     seen.add(riverPart.id);
     const angle=Math.abs(cross(roadDir,riverPart.vector))/(roadLen*riverPart.riverLen);
     if(angle<.25)continue;
     const intersection=segmentIntersection(a,b,riverPart.c,riverPart.d);
     if(!intersection)continue;
     if(bridges.some(item=>Math.hypot(item.x-intersection.x,item.y-intersection.y)<.7))continue;
     bridges.push({
      x:round3(intersection.x),y:round3(intersection.y),
      angle:Math.atan2(roadDir.y,roadDir.x),
      length:clamp((riverPart.river.width/angle+.45),1.25,9),
      width:clamp(road.width*.98,.5,4),
      roadId:road.id,riverId:riverPart.river.id
     });
     if(bridges.length>=limit)return bridges;
    }
   }
  }
 }
 return bridges;
}
export function drawSmartBridges(ctx,paths,cell=48){
 if(!ctx?.save||!Array.isArray(paths)||paths.length<2)return 0;
 const bridges=collectBridges(paths);
 for(const b of bridges){
  const length=b.length*cell,width=b.width*cell;
  ctx.save();ctx.translate(b.x*cell,b.y*cell);ctx.rotate(b.angle);
  ctx.shadowColor='#051014a6';ctx.shadowBlur=cell*.16;ctx.shadowOffsetY=cell*.095;
  ctx.fillStyle='#34271f';ctx.fillRect(-length/2-3,-width/2-4,length+6,width+8);
  ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.fillStyle='#937053';ctx.fillRect(-length/2,-width/2,length,width);
  const planks=Math.max(3,Math.ceil(length/(cell*.18)));
  for(let k=0;k<planks;k++){
   const x=-length/2+length*k/planks;
   ctx.fillStyle=k%3===0?'#ab8460':k%3===1?'#856347':'#997450';
   ctx.fillRect(x+1,-width/2+2,length/planks-2,width-4);
   ctx.strokeStyle='#3b2b25a8';ctx.lineWidth=1;
   ctx.beginPath();ctx.moveTo(x,-width/2);ctx.lineTo(x,width/2);ctx.stroke();
  }
  // Structural rails and small post heads are readable even at overview zoom.
  for(const y of [-width/2+1,width/2-1]){
   ctx.strokeStyle='#31251e';ctx.lineWidth=Math.max(2,cell*.085);
   ctx.beginPath();ctx.moveTo(-length/2,y);ctx.lineTo(length/2,y);ctx.stroke();
   ctx.strokeStyle='#c39a6c';ctx.lineWidth=Math.max(1,cell*.037);
   ctx.beginPath();ctx.moveTo(-length/2,y-1);ctx.lineTo(length/2,y-1);ctx.stroke();
   for(let k=0;k<=4;k++){
    const x=-length/2+length*k/4;
    ctx.fillStyle='#514032';ctx.fillRect(x-3,y-3,6,6);
    ctx.fillStyle='#c09b6a';ctx.fillRect(x-2,y-3,4,3);
   }
  }
  ctx.restore();
 }
 return bridges.length;
}
export function nodeIndices(path,maxHandles=25){
 const n=path?.points?.length||0;if(n===0)return [];
 if(n<=maxHandles)return Array.from({length:n},(_,i)=>i);
 const stride=Math.ceil((n-1)/(maxHandles-1));
 const arr=[];for(let i=0;i<n;i+=stride)arr.push(i);
 if(arr[arr.length-1]!==n-1)arr.push(n-1);
 return arr;
}
export function nearestControlPoint(path,p,tolerance=.29){
 if(!path?.points||!p)return -1;
 let best=-1,dist=tolerance;
 for(const i of nodeIndices(path)){
  const d=distance(path.points[i],p);
  if(d<=dist){best=i;dist=d;}
 }
 return best;
}
export function moveControlPoint(path,index,p,cols,rows){
 if(!path?.points||index<0||index>=path.points.length||!Number.isFinite(p?.x)||!Number.isFinite(p?.y))return false;
 path.points[index]={x:round3(clamp(p.x,0,cols)),y:round3(clamp(p.y,0,rows))};
 return true;
}
export function insertControlPoint(path,p,cols,rows,{max=180,tolerance=.68}={}){
 if(!path?.points||path.points.length<2||path.points.length>=max)return -1;
 if(!Number.isFinite(p?.x)||!Number.isFinite(p?.y))return -1;
 let min=tolerance,point=null,index=-1;
 for(let i=1;i<path.points.length;i++){
  const projection=segmentProjection(p,path.points[i-1],path.points[i]);
  if(projection.distance<min&&projection.t>.05&&projection.t<.95){
   index=i;point=projection;min=projection.distance;
  }
 }
 if(index<0)return -1;
 path.points.splice(index,0,{x:round3(clamp(point.x,0,cols)),y:round3(clamp(point.y,0,rows))});
 return index;
}
export function removeControlPoint(path,index){
 if(!path?.points||path.points.length<=2||index<0||index>=path.points.length)return false;
 path.points.splice(index,1);return true;
}
export function drawControlHandles(ctx,path,cell=48,zoom=1){
 if(!ctx?.save||!path?.points)return;
 ctx.save();
 for(const i of nodeIndices(path)){
  const p=path.points[i],x=p.x*cell,y=p.y*cell;
  ctx.beginPath();ctx.arc(x,y,Math.max(4,6/Math.max(.3,zoom)),0,Math.PI*2);
  ctx.fillStyle=i===0||i===path.points.length-1?'#b7dce4':'#f4d095';
  ctx.fill();ctx.strokeStyle='#192023';ctx.lineWidth=Math.max(1,2/Math.max(.3,zoom));ctx.stroke();
 }
 ctx.restore();
}
