'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('studio/map-size.js','utf8').replace(/^export /gm,'');
const {validateMapSize,createEmptyMap,resizeMapScene}=new Function(source+'\nreturn {validateMapSize,createEmptyMap,resizeMapScene};')();
let count=0;const ok=(v,m)=>{assert.ok(v,m);count++};
for(const [c,r] of [[7,10],[20,81],[9.5,10],[0,0]]){assert.throws(()=>validateMapSize(c,r));count++;}
ok(validateMapSize(80,80).cols===80,'max size');
const old=createEmptyMap({version:1,cols:28,rows:18},12,8,'Antigo');
old.tiles[2*12+3]='water';old.heights[2*12+3]=2;
old.props=[{x:4,y:4},{x:11,y:7}];old.tokens=[{x:11,y:7}];
old.walls=[{x1:1,y1:1,x2:11,y2:1}];
old.paths=[{points:[{x:1,y:2},{x:11,y:2}]}];
old.surfaceStrokes=[{points:[{x:1,y:2},{x:11,y:2}]}];
const original=JSON.stringify(old),large=resizeMapScene(old,40,30);
ok(large.scene.tiles[2*40+3]==='water'&&large.scene.heights[2*40+3]===2,'terrain retained');
ok(large.scene.fog[29*40+39]===1,'new areas remain fogged for players');
ok(large.scene.props.length===2&&large.scene.paths.length===1,'expansion preserves geometry');
ok(JSON.stringify(old)===original,'original untouched');
const small=resizeMapScene(old,8,8);
ok(small.cropped&&small.removed.props===1&&small.removed.tokens===1,'crop reports removed content');
ok(small.removed.paths===1&&small.removed.surfaceStrokes===1&&small.removed.walls===1,'partial vectors not accidentally rejoined');
ok(small.scene.tiles[2*8+3]==='water','shared cells stay intact');
const html=fs.readFileSync('estudio.html','utf8'),editor=fs.readFileSync('studio/editor.js','utf8');
for(const id of ['map-size-preset','map-width','map-height','resize-local-map'])ok(html.includes('id="'+id+'"'),'UI '+id);
ok(editor.includes('resizeMapScene(scene,cols,rows)'),'resize wired');

const sceneModule=fs.readFileSync('studio/scene.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const engine=new Function('const drawStyledProp=()=>false;\n'+sceneModule+'\nreturn {starterScene,tileIndex,safeScene};')();
const furnitureModule=fs.readFileSync('studio/room-layout.js','utf8').replace(/^export /gm,'');
const {planRoomFurniture}=new Function(furnitureModule+'\nreturn {planRoomFurniture};')();
const generatedModule=fs.readFileSync('studio/generator.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const {generateScene}=new Function('starterScene','tileIndex','planRoomFurniture',generatedModule+'\nreturn {generateScene};')(
 engine.starterScene,engine.tileIndex,planRoomFurniture);
for(const [cols,rows] of [[8,8],[16,12],[40,26],[80,80]]){
 for(const kind of ['forest','lake','tavern','dungeon']){
  const generated=generateScene(kind,'size-regression',{cols,rows});
  ok(generated.cols===cols&&generated.rows===rows,'generator respects '+cols+'x'+rows+'/'+kind);
  ok(engine.safeScene(generated).tiles.length===cols*rows,'generated JSON valid for '+kind);
 }
}

console.log(count+' map dimension tests passed');
