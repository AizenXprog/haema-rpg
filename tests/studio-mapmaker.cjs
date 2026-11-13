'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
let passed=0;
const ok=(check,label)=>{assert.ok(check,label);passed++};
const src=fs.readFileSync('studio/scene.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const engine=new Function('const drawStyledProp=()=>false;\n'+src+'\nreturn {starterScene,safeScene,drawScene,tileIndex,TERRAINS,PROPS};')();
const genSource=fs.readFileSync('studio/generator.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const layoutSource=fs.readFileSync('studio/room-layout.js','utf8').replace(/^export /gm,'');
const {planRoomFurniture}=new Function(layoutSource+'\nreturn {planRoomFurniture};')();
const topologySource=fs.readFileSync('studio/room-topology.js','utf8').replace(/^export /gm,'');
const {planRoomTopology}=new Function(topologySource+'\nreturn {planRoomTopology};')();
const {generateScene,makeRoom}=new Function('starterScene','tileIndex','planRoomFurniture','planRoomTopology',genSource+'\nreturn {generateScene,makeRoom};')(engine.starterScene,engine.tileIndex,planRoomFurniture,planRoomTopology);
for(const kind of ['forest','lake','tavern','dungeon']){
 const a=generateScene(kind,'seed-test'),b=generateScene(kind,'seed-test'),safe=engine.safeScene(a);
 ok(JSON.stringify(a)===JSON.stringify(b),kind+' deterministic seed');
 ok(safe.tiles.length===safe.cols*safe.rows,kind+' tiles');
 ok(safe.heights.length===safe.tiles.length,kind+' elevation');
 ok(safe.props.length>0,kind+' generated props');
 ok(safe.tiles.some(t=>t!=='grass'),kind+' different materials');
}
const legacy=engine.starterScene();delete legacy.heights;delete legacy.gridVisible;
const imported=engine.safeScene(legacy);
ok(imported.gridVisible===true,'existing v0.1 scenes show grid by default');
ok(imported.heights.every(h=>h===0),'existing scenes migrate elevations in memory');
const scene=engine.safeScene({...engine.starterScene(),gridVisible:false,heights:Array(28*18).fill(9)});
ok(scene.gridVisible===false,'hidden grid persists in project');
ok(scene.heights.every(h=>h===4),'elevation clamp');
const room=makeRoom(scene,{x:3,y:4,w:8,h:6,floor:'wood'});
ok(room.w===8&&room.h===6,'room geometry');
ok(scene.props.some(p=>p.type==='door'),'door placement');
ok(scene.tiles[engine.tileIndex(scene,5,6)]==='wood','room floor');
const calls={strokes:0,labels:0};
const ctx=new Proxy({
 createLinearGradient(){return {addColorStop(){}}},
 createRadialGradient(){return {addColorStop(){}}},
 stroke(){calls.strokes++},
 fillText(){calls.labels++}
},{get(o,k){return o[k]??(()=>{})},set(o,k,v){o[k]=v;return true}});
engine.drawScene(ctx,scene,{grid:false});
const without=calls.strokes;
engine.drawScene(ctx,scene,{grid:true});
ok(calls.strokes===2*without+1,'grid toggle adds exactly one overlay stroke');
const editor=fs.readFileSync('studio/editor.js','utf8');
const html=fs.readFileSync('estudio.html','utf8');
ok((html.match(/id="grid-toggle"/g)||[]).length===1,'unique grid toggle');
ok(html.includes('id="grid-state"'),'visible grid status');
ok(editor.includes('scene.gridVisible=showGrid;changed()'),'grid persisted on toggle');
ok(editor.includes('drawScene(drawingContext,scene,{player:true,grid:showGrid'),'grid also controls projection and PNG');
ok(['raise','lower','room','scatter'].every(tool=>html.includes('data-tool="'+tool+'"')),'editor tool controls');
ok(['forest','lake','tavern','dungeon'].every(type=>html.includes('data-scene-template="'+type+'"')),'generation controls');
console.log(passed+' Studio Mapmaker 0.2 tests passed');
