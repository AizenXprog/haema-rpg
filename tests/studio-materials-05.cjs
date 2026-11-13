'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
const src=fs.readFileSync('studio/terrain-renderer.js','utf8').replace(/^export /gm,'');
const {materialRelief,sampleTerrain}=new Function(src+'\nreturn {materialRelief,sampleTerrain};')();
let checks=0;const ok=(x,m)=>{assert.ok(x,m);checks++};
const kinds=['grass','earth','sand','stone','wood','brick','marble','water'];
for(const type of kinds){
 for(let i=0;i<40;i++){
  const x=i*2.7,y=i*3.1,detail=materialRelief(type,x,y,.37,.52,.77);
  ok(Number.isFinite(detail)&&Math.abs(detail)<=40,'bounded '+type+' surface grain');
  ok(detail===materialRelief(type,x,y,.37,.52,.77),'deterministic '+type+' surface grain');
 }
}
ok(materialRelief('water',4,9)===0,'depth and foam remain responsible for water shading');
ok(materialRelief('brick',10,0)!==materialRelief('brick',10,5),'brick mortar visible');
ok(materialRelief('wood',10,13.6)!==materialRelief('wood',10,17),'wood seams visible');
const scene={cols:12,rows:12,tiles:Array(144).fill('grass'),heights:Array(144).fill(0)};
for(let y=3;y<9;y++)for(let x=3;x<9;x++)scene.tiles[y*12+x]='water';
for(let y=0;y<576;y+=16)for(let x=0;x<576;x+=16){
 const px=sampleTerrain(scene,x,y);
 ok(px.every(c=>Number.isInteger(c)&&c>=0&&c<=255),'RGB safe for mixed water and vegetation');
}
ok(src.includes('shade+=materialRelief(material,worldX,worldY,low,mid,fine)'), 'visual surface generator wired into raster');
cp.execFileSync('node',['--check','studio/terrain-renderer.js']);checks++;
console.log(checks+' procedural material/terrain continuity checks passed');
