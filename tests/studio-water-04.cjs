'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
let checks=0;const ok=(value,label)=>{assert.ok(value,label);checks++};
const source=fs.readFileSync('studio/terrain-renderer.js','utf8').replace(/^export /gm,'');
const {shorelineProfile,sampleTerrain}=new Function(source+'\nreturn {shorelineProfile,sampleTerrain};')();
const dry=shorelineProfile(0),deep=shorelineProfile(1),shore=shorelineProfile(.5);
ok(dry.blend===0&&dry.depth===0&&dry.foam===0,'dry land remains unchanged');
ok(deep.blend===1&&deep.depth===1&&deep.foam<1e-10,'deep water has no artificial white outline');
ok(shore.blend>0&&shore.blend<1&&shore.foam>.25,'organic shoreline has graded foam');
ok(shorelineProfile(NaN).blend===0&&shorelineProfile(900).depth===1,'invalid coverage safely normalized');
const cols=12,rows=12,tiles=Array(cols*rows).fill('grass');
for(let y=3;y<9;y++)for(let x=3;x<9;x++)tiles[y*cols+x]='water';
const scene={cols,rows,tiles,heights:Array(cols*rows).fill(0)};
const inland=sampleTerrain(scene,48,48),center=sampleTerrain(scene,288,288);
ok(center[2]>center[0]&&center[1]>center[0],'deep water has blue/green pigment');
ok(inland[1]>inland[0],'land retains green vegetation');
ok(JSON.stringify(sampleTerrain(scene,288,288))===JSON.stringify(center),'water material deterministic');
for(let y=0;y<576;y+=24)for(let x=0;x<576;x+=24){
 const rgb=sampleTerrain(scene,x,y);
 ok(rgb.length===3&&rgb.every(c=>Number.isInteger(c)&&c>=0&&c<=255),'terrain RGB in 0..255');
}
const sceneModule=fs.readFileSync('studio/scene.js','utf8');
ok(sceneModule.includes("terrain-renderer.js?v=3"),'live scene loads updated terrain renderer');
ok(sceneModule.indexOf('renderTerrain(ctx,scene,CELL)')<sceneModule.indexOf('renderFog(ctx,scene,{player,cell:CELL})'),'water is masked by player fog');
cp.execFileSync('node',['--check','studio/terrain-renderer.js']);checks++;
console.log(checks+' organic shoreline and water depth checks passed');