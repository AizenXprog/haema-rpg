'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
let tests=0;const ok=(v,label)=>{assert.ok(v,label);tests++};
const sceneSource=fs.readFileSync('studio/scene.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const {starterScene,safeScene,tileIndex}=new Function(sceneSource+'\nreturn {starterScene,safeScene,tileIndex};')();
const genSource=fs.readFileSync('studio/generator.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const layoutSource=fs.readFileSync('studio/room-layout.js','utf8').replace(/^export /gm,'');
const {planRoomFurniture}=new Function(layoutSource+'\nreturn {planRoomFurniture};')();
const {makeRoom,furnishRoom}=new Function('starterScene','tileIndex','planRoomFurniture',genSource+'\nreturn {makeRoom,furnishRoom};')(starterScene,tileIndex,planRoomFurniture);
const types=['empty','bedroom','library','tavern'];
for(const type of types){
 const s=starterScene();s.props=[];s.walls=[];
 const room=makeRoom(s,{x:5,y:4,w:11,h:9,floor:'wood'});
 const previous=s.props.length; // the room's door already exists before furnishing
 const n=furnishRoom(s,room,type,'estudio-semente');
 ok(n===s.props.length-previous,'counts newly generated furniture '+type);
 ok(type==='empty'?n===0:n>0,'preset '+type+' expected');
 ok(safeScene(s).props.length===s.props.length,'preset '+type+' survives JSON roundtrip');
 ok(s.props.every(p=>p.x>=room.x&&p.x<=room.x+room.w&&p.y>=room.y&&p.y<=room.y+room.h),'props stay in room '+type);
 const clone=starterScene();clone.props=[];clone.walls=[];
 const same=makeRoom(clone,{x:5,y:4,w:11,h:9,floor:'wood'});
 furnishRoom(clone,same,type,'estudio-semente');
 ok(JSON.stringify(s.props)===JSON.stringify(clone.props),'deterministic room furniture '+type);
}
const html=fs.readFileSync('estudio.html','utf8'),editor=fs.readFileSync('studio/editor.js','utf8');
ok(html.includes('data-tool="measure"'),'ruler accessible in rail');
ok(html.includes('id="room-preset"'),'room presets selector exists');
ok(editor.includes("gesture={mode:'measure'"),'ruler pointer gesture starts');
ok(editor.includes("gesture?.mode==='measure'"),'ruler draws measured line');
ok(editor.includes("if(gesture?.mode==='measure')"),'ruler stops gesture');
ok(editor.includes("furnishRoom(scene,room,$('room-preset').value"),'room generation wired into editor');
ok(editor.includes("showInspectorTab('mesa')"),'mesa inspector remains accessible');
ok(!editor.includes("fetch('https://"),'no remote AI or paid services');
console.log(tests+' room furnishing and tabletop ruler checks passed');
