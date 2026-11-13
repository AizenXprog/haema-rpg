// HÆMA Estúdio 0.3 — privacy-preserving soft fog.
// Hidden logical cells are ALWAYS 100% opaque in the player projection.
// A soft, irregular feather extends only into neighbouring *revealed* terrain.
const fogCache=new WeakMap();
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const shadow=(distance,width)=>{const t=clamp(1-distance/width,0,1);return t*t*(3-2*t);};
function covered(scene,x,y){
 if(x<0||y<0||x>=scene.cols||y>=scene.rows)return false;
 return !!scene.fog[y*scene.cols+x];
}
export function sampleFogOpacity(scene,worldX,worldY,cell=48){
 const x=Math.floor(worldX/cell),y=Math.floor(worldY/cell);
 if(covered(scene,x,y))return 1; // Critical: never reveal a hidden pixel through feathering.
 const fx=worldX/cell-x,fy=worldY/cell-y;
 const bendX=Math.sin(worldY*.072+1.4)*2.6+Math.sin(worldY*.038+3.2)*2.3;
 const bendY=Math.sin(worldX*.081+2.1)*2.6+Math.sin(worldX*.035+.7)*2.3;
 const range=cell*.45;
 let alpha=0;
 if(covered(scene,x-1,y))alpha=Math.max(alpha,shadow(Math.max(0,fx*cell+bendX),range));
 if(covered(scene,x+1,y))alpha=Math.max(alpha,shadow(Math.max(0,(1-fx)*cell-bendX),range));
 if(covered(scene,x,y-1))alpha=Math.max(alpha,shadow(Math.max(0,fy*cell+bendY),range));
 if(covered(scene,x,y+1))alpha=Math.max(alpha,shadow(Math.max(0,(1-fy)*cell-bendY),range));
 // Diagonal shadows at corners avoid hard L-shaped joints.
 if(covered(scene,x-1,y-1))alpha=Math.max(alpha,shadow(Math.hypot(fx*cell,fy*cell),range*.7));
 if(covered(scene,x+1,y-1))alpha=Math.max(alpha,shadow(Math.hypot((1-fx)*cell,fy*cell),range*.7));
 if(covered(scene,x-1,y+1))alpha=Math.max(alpha,shadow(Math.hypot(fx*cell,(1-fy)*cell),range*.7));
 if(covered(scene,x+1,y+1))alpha=Math.max(alpha,shadow(Math.hypot((1-fx)*cell,(1-fy)*cell),range*.7));
 return alpha;
}
function makeCanvas(scene,cell){
 if(typeof document==='undefined')return null;
 const fullW=scene.cols*cell,fullH=scene.rows*cell;
 // The old full-resolution fog used ~59 MB of raw pixels at 80x80 cells
 // and sampled every pixel on the main thread.
 const quality=Math.min(1,Math.sqrt(1200000/(fullW*fullH)));
 const width=Math.max(1,Math.ceil(fullW*quality)),height=Math.max(1,Math.ceil(fullH*quality));
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const context=canvas.getContext('2d',{willReadFrequently:false});
 if(!context?.createImageData||!context?.putImageData)return null;
 const record={canvas,context,width,height,fullW,fullH,quality,dirty:{x0:0,y0:0,x1:width,y1:height}};
 fogCache.set(scene,record);return record;
}
export function invalidateFog(scene,x0=0,y0=0,x1=scene.cols,y1=scene.rows,cell=48){
 const record=fogCache.get(scene);if(!record)return;
 const old=record.dirty;
 const scale=record.quality;
 const left=clamp(Math.floor((x0-1)*cell*scale),0,record.width);
 const top=clamp(Math.floor((y0-1)*cell*scale),0,record.height);
 const right=clamp(Math.ceil((x1+1)*cell*scale),0,record.width);
 const bottom=clamp(Math.ceil((y1+1)*cell*scale),0,record.height);
 record.dirty=old?{
  x0:Math.min(old.x0,left),y0:Math.min(old.y0,top),
  x1:Math.max(old.x1,right),y1:Math.max(old.y1,bottom)
 }:{x0:left,y0:top,x1:right,y1:bottom};
}
function flush(scene,record,cell){
 const d=record.dirty;if(!d)return;
 const width=d.x1-d.x0,height=d.y1-d.y0;
 const image=record.context.createImageData(width,height),data=image.data;
 for(let j=0;j<height;j++)for(let i=0;i<width;i++){
  const x=(d.x0+i+.5)/record.quality,y=(d.y0+j+.5)/record.quality;
  const alpha=sampleFogOpacity(scene,x,y,cell);
  const offset=(j*width+i)*4;
  data[offset]=9;data[offset+1]=12;data[offset+2]=17;data[offset+3]=Math.round(alpha*255);
 }
 record.context.putImageData(image,d.x0,d.y0);record.dirty=null;
}
// Most generated scenes are entirely revealed. Avoid the multi-million-pixel
// fog raster and discard stale masks as soon as the fog becomes uniform.
export function fogCoverage(scene){
 let hidden=0;
 for(const cell of scene.fog||[])if(cell)hidden++;
 return hidden===0?'clear':hidden>=scene.cols*scene.rows?'covered':'partial';
}
export function renderFog(ctx,scene,{player=false,cell=48}={}){
 if(typeof document==='undefined'||!ctx?.drawImage)return false;
 const coverage=fogCoverage(scene);
 if(coverage!=='partial'){
  fogCache.delete(scene);
  if(coverage==='clear')return true;
  if(!ctx.fillRect)return false;
  ctx.save();ctx.globalAlpha=player?1:.73;
  ctx.fillStyle='#090c11';ctx.fillRect(0,0,scene.cols*cell,scene.rows*cell);
  ctx.restore();return true;
 }
 let record=fogCache.get(scene);
 if(!record||record.fullW!==scene.cols*cell||record.fullH!==scene.rows*cell)record=makeCanvas(scene,cell);
 if(!record)return false;
 flush(scene,record,cell);
 ctx.save();
 ctx.imageSmoothingEnabled=false;
 ctx.globalAlpha=player?1:.73;
 ctx.drawImage(record.canvas,0,0,record.fullW,record.fullH);
 ctx.restore();
 if(player&&ctx.fillRect){
  // Security invariant: all hidden cells are overdrawn with a fully opaque
  // mask at exact logical boundaries, even after low-resolution resampling.
  ctx.save();ctx.globalAlpha=1;ctx.fillStyle='#090c11';
  for(let y=0;y<scene.rows;y++){
   let run=-1;
   for(let x=0;x<=scene.cols;x++){
    const opaque=x<scene.cols&&!!scene.fog[y*scene.cols+x];
    if(opaque&&run<0)run=x;
    if(!opaque&&run>=0){
     ctx.fillRect(run*cell,y*cell,(x-run)*cell,cell);
     run=-1;
    }
   }
  }
  ctx.restore();
 }
 return true;
}
