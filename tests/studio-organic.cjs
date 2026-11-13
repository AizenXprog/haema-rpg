'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++};
const load=(file,doc)=>{
 const source=fs.readFileSync(file,'utf8').replace(/^export /gm,'');
 return new Function('document',source+'\nreturn {sampleTerrain:typeof sampleTerrain==="function"?sampleTerrain:undefined,invalidateTerrain:typeof invalidateTerrain==="function"?invalidateTerrain:undefined,renderTerrain:typeof renderTerrain==="function"?renderTerrain:undefined,sampleFogOpacity:typeof sampleFogOpacity==="function"?sampleFogOpacity:undefined,invalidateFog:typeof invalidateFog==="function"?invalidateFog:undefined,renderFog:typeof renderFog==="function"?renderFog:undefined}')(doc);
};
const makeDoc=()=>{
 const records=[];
 const document={createElement(type){
  assert.equal(type,'canvas');
  const context={
   puts:0,last:null,createImageData(w,h){return {width:w,height:h,data:new Uint8ClampedArray(w*h*4)}},
   putImageData(image,x,y){this.puts++;this.last={image,x,y};}
  };
  const canvas={width:0,height:0,getContext(){return context}};
  records.push({canvas,context});return canvas;
 }};
 return {document,records};
};
const terrainContext={save(){},restore(){},drawImage(){this.draws=(this.draws||0)+1},draws:0};
const scene={cols:4,rows:4,tiles:Array(16).fill('grass'),heights:Array(16).fill(0),fog:Array(16).fill(0)};
const rasterDoc=makeDoc(),terrain=load('studio/terrain-renderer.js',rasterDoc.document);
for(let y of [8,24,49,93,139]){
 const a=terrain.sampleTerrain(scene,47.5,y),b=terrain.sampleTerrain(scene,48.5,y);
 const delta=Math.max(...a.map((value,i)=>Math.abs(value-b[i])));
 ok(delta<24,'same-material crossing near 48px must be continuous');
}
ok(terrain.renderTerrain(terrainContext,scene,48),'first raster render');
ok(rasterDoc.records[0].context.puts===1,'initial terrain rasterized once');
ok(terrainContext.draws===1,'terrain delivered to output canvas');
terrain.renderTerrain(terrainContext,scene,48);
ok(rasterDoc.records[0].context.puts===1,'static terrain cache reused without rebuilding');
scene.tiles[5]='water';
terrain.invalidateTerrain(scene,1,1,2,2,48);
terrain.renderTerrain(terrainContext,scene,48);
ok(rasterDoc.records[0].context.puts===2,'only changed region rasterized after painting');
const rect=rasterDoc.records[0].context.last;
ok(rect.image.width<rasterDoc.records[0].canvas.width,'dirty paint updates patch rather than entire map');
scene.tiles[5]='grass';
terrain.invalidateTerrain(scene,1,1,2,2,48);
terrain.renderTerrain(terrainContext,scene,48);
ok(rasterDoc.records[0].context.puts===3,'erase changes terrain cache');
const fogDoc=makeDoc(),fog=load('studio/fog-renderer.js',fogDoc.document);
scene.fog[5]=1;
const cell=48;
for(const [x,y] of [[50,50],[95,50],[50,95],[95,95]]){
 ok(fog.sampleFogOpacity(scene,x,y,cell)===1,'hidden logical pixels fully opaque');
}
const edge=fog.sampleFogOpacity(scene,48+48,72,cell);
ok(edge>0&&edge<=1,'soft edge shades revealed neighbour');
ok(fog.sampleFogOpacity(scene,3,3,cell)===0,'distant revealed pixel unmasked');
const proj={save(){},restore(){},drawImage(){this.calls=(this.calls||0)+1},calls:0};
ok(fog.renderFog(proj,scene,{player:true,cell}),'player fog raster');
ok(fogDoc.records[0].context.puts===1,'fog raster created once');
const im=fogDoc.records[0].context.last.image;
const hiddenOffset=(72*192+72)*4+3;
ok(im.data[hiddenOffset]===255,'player hidden region must use full alpha channel');
fog.renderFog(proj,scene,{player:true,cell});
ok(fogDoc.records[0].context.puts===1,'fog cache reused');
scene.fog.fill(0);fog.invalidateFog(scene,1,1,2,2,48);
fog.renderFog(proj,scene,{player:true,cell});
ok(fogDoc.records[0].context.puts===2,'fog invalidated after reveal');
ok(fog.sampleFogOpacity(scene,72,72,cell)===0,'newly revealed pixel becomes transparent');
const sceneSource=fs.readFileSync('studio/scene.js','utf8');
const editor=fs.readFileSync('studio/editor.js','utf8');
ok(sceneSource.includes("renderTerrain(ctx,scene,CELL)"),'organic engine wired into scene');
ok(sceneSource.includes("renderFog(ctx,scene,{player,cell:CELL})"),'soft fog wired into scene');
ok(editor.includes("invalidateTerrain(scene,x0,y0,x1,y1,CELL)"),'brush invalidation wired');
ok(editor.includes("invalidateFog(scene,x0,y0,x1,y1,CELL)"),'fog invalidation wired');
ok(editor.includes("gesture?.mode==='prop-drag'"),'object drag implemented');
ok(editor.includes("selectedProp.rotation="),'object rotation implemented');
const html=fs.readFileSync('estudio.html','utf8');
for(const id of ['selected-rotate-left','selected-rotate-right','selected-duplicate','selected-delete'])ok(html.includes('id="'+id+'"'),'selection action exists: '+id);
for(const path of ['studio/terrain-renderer.js','studio/fog-renderer.js','studio/editor.js','studio/scene.js']){
 cp.execFileSync('node',['--check',path]);checks++;
}
console.log(checks+' organic terrain, fog privacy and object editing checks passed');
