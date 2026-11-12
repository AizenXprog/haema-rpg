// HÆMA Estúdio 0.3 — continuous terrain renderer.
// The logical cells are NEVER drawn as rectangles. A world-coordinate material field
// blends terrain across noisy boundaries; the result is cached and repainted in patches.
const COLOR={
 grass:[55,79,59],stone:[107,106,99],earth:[118,92,70],water:[40,96,111],
 sand:[154,128,89],wood:[111,77,53],brick:[119,87,76],marble:[151,148,139]
};
const cache=new WeakMap();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
function random2(x,y){
 let n=Math.imul(x+47291,374761393)^Math.imul(y+61943,668265263);
 n=Math.imul(n^(n>>>13),1274126177);
 return ((n^(n>>>16))>>>0)/4294967295;
}
function noise(x,y){
 const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
 const a=random2(ix,iy)*(1-fx)+random2(ix+1,iy)*fx;
 const b=random2(ix,iy+1)*(1-fx)+random2(ix+1,iy+1)*fx;
 return a*(1-fy)+b*fy;
}
function weights(f){
 // Neighbour blending is limited to 21% on either side of a cell boundary.
 // Identical neighbours blend into exactly the same pigment, removing tile seams.
 const band=.22;
 const left=f<band?1-smooth(f/band):0;
 const right=f>1-band?smooth((f-1+band)/band):0;
 return [left,1-left-right,right];
}
function sourceAt(scene,x,y){
 const xx=clamp(x,0,scene.cols-1),yy=clamp(y,0,scene.rows-1);
 const i=yy*scene.cols+xx;
 return {type:scene.tiles[i],height:scene.heights?.[i]||0};
}
export function sampleTerrain(scene,worldX,worldY,cell=48){
 // Both warps are in *world* coordinates, never restart at tile edges.
 // Reuse the same low-frequency noise for material boundaries and pigment.
 // Three samples per pixel, instead of the previous eight, keep brushing responsive.
 const low=noise(worldX/68+12.4,worldY/68+9.1);
 const bendX=(low-.5)*24+Math.sin(worldY*.056+low*7)*2.4;
 const bendY=(noise(worldX/99+27,worldY/99+16)-.5)*20+
   Math.sin(worldX*.062+low*5)*2.5;
 const u=(worldX+bendX)/cell,v=(worldY+bendY)/cell;
 const ix=Math.floor(u),iy=Math.floor(v),wx=weights(u-ix),wy=weights(v-iy);
 let r=0,g=0,b=0,h=0,water=0;
 for(let j=-1;j<=1;j++){
  if(wy[j+1]<.0001)continue;
  for(let i=-1;i<=1;i++){
   const w=wx[i+1]*wy[j+1];if(w<.0001)continue;
   const t=sourceAt(scene,ix+i,iy+j);
   const c=COLOR[t.type]||COLOR.grass;
   r+=c[0]*w;g+=c[1]*w;b+=c[2]*w;
   h+=t.height*w;if(t.type==='water')water+=w;
  }
 }
 const mid=noise(worldX/19+6.3,worldY/19+13.4);
 const fine=random2(Math.floor(worldX/2),Math.floor(worldY/2));
 // Details are continuous across same-material cells, not seeded per tile.
 let shade=(low-.5)*24+(mid-.5)*11+(fine-.5)*7+h*6;
 const woodGrain=Math.cos((worldY+low*5)*Math.PI/6.9);
 const stoneGrain=mid;
 const wave=Math.sin(worldY*.095+worldX*.025+low*4.1);
 const material=sourceAt(scene,clamp(Math.floor(u),0,scene.cols-1),clamp(Math.floor(v),0,scene.rows-1)).type;
 if(material==='wood')shade+=woodGrain*5;
 if(material==='marble')shade+=(Math.sin(worldX*.036+worldY*.02+low*9)> .94?-18:3);
 if(material==='stone'||material==='brick')shade+=(stoneGrain-.5)*12;
 if(material==='water')shade+=wave*5+(mid-.5)*9;
 if(material==='sand')shade+=Math.sin(worldX*.035+worldY*.12+low*5)*3;
 // Fine light rim at coasts, not a straight line at CELL boundaries.
 if(water>.06&&water<.94)shade+=Math.sin(Math.PI*water)*23;
 // Elevation follows the warped field. No straight rectangular cliff strokes.
 const elevationContour=h>0&&Math.abs(h-Math.round(h))<.075?-4:0;
 shade+=elevationContour;
 return [
  clamp(Math.round(r+shade),0,255),
  clamp(Math.round(g+shade*(material==='grass'?1.13:1)),0,255),
  clamp(Math.round(b+shade*.91),0,255)
 ];
}
function createSurface(scene,cell){
 if(typeof document==='undefined')return null;
 const fullW=scene.cols*cell,fullH=scene.rows*cell;
 // Resolution cap protects common machines and large 80x80-cell scenes.
 const quality=Math.min(.66,Math.sqrt(1600000/(fullW*fullH)));
 const width=Math.max(1,Math.ceil(fullW*quality)),height=Math.max(1,Math.ceil(fullH*quality));
 const canvas=document.createElement('canvas');
 canvas.width=width;canvas.height=height;
 const context=canvas.getContext('2d',{alpha:false,willReadFrequently:false});
 if(!context||!context.createImageData||!context.putImageData)return null;
 const record={canvas,context,quality,width,height,fullW,fullH,
  dirty:{x0:0,y0:0,x1:width,y1:height}};
 cache.set(scene,record);return record;
}
function mergeDirty(record,x0,y0,x1,y1){
 x0=clamp(Math.floor(x0),0,record.width);
 y0=clamp(Math.floor(y0),0,record.height);
 x1=clamp(Math.ceil(x1),0,record.width);
 y1=clamp(Math.ceil(y1),0,record.height);
 if(x1<=x0||y1<=y0)return;
 const old=record.dirty;
 record.dirty=old?{
  x0:Math.min(x0,old.x0),y0:Math.min(y0,old.y0),
  x1:Math.max(x1,old.x1),y1:Math.max(y1,old.y1)
 }:{x0,y0,x1,y1};
}
export function invalidateTerrain(scene,x0=0,y0=0,x1=scene.cols,y1=scene.rows,cell=48){
 const record=cache.get(scene);if(!record)return;
 // Blends and procedural warp may reference neighbouring logical cells.
 const pad=cell*.65,scale=record.quality;
 mergeDirty(record,(x0*cell-pad)*scale,(y0*cell-pad)*scale,
  (x1*cell+pad)*scale,(y1*cell+pad)*scale);
}
function flush(scene,record,cell){
 const rect=record.dirty;if(!rect)return;
 const width=rect.x1-rect.x0,height=rect.y1-rect.y0;
 const image=record.context.createImageData(width,height);
 const data=image.data,scale=record.quality;
 let offset=0;
 for(let y=0;y<height;y++){
  const worldY=(rect.y0+y+.5)/scale;
  for(let x=0;x<width;x++){
   const worldX=(rect.x0+x+.5)/scale;
   const c=sampleTerrain(scene,worldX,worldY,cell);
   data[offset++]=c[0];data[offset++]=c[1];data[offset++]=c[2];data[offset++]=255;
  }
 }
 record.context.putImageData(image,rect.x0,rect.y0);
 record.dirty=null;
}
export function renderTerrain(ctx,scene,cell=48){
 if(!ctx?.drawImage||typeof document==='undefined')return false;
 let record=cache.get(scene);
 if(!record||record.fullW!==scene.cols*cell||record.fullH!==scene.rows*cell){
  record=createSurface(scene,cell);
 }
 if(!record)return false;
 flush(scene,record,cell);
 ctx.save();
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(record.canvas,0,0,record.fullW,record.fullH);
 ctx.restore();
 return true;
}