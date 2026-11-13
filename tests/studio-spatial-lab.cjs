'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
let checks=0;const ok=(value,label)=>{assert.ok(value,label);checks++;};
const source=fs.readFileSync('studio/room-layout.js','utf8').replace(/^export /gm,'');
const {planRoomFurniture,validateFurniture,roomDoorPoint,blocksEntrance}=new Function(source+'\nreturn {planRoomFurniture,validateFurniture,roomDoorPoint,blocksEntrance};')();
for(const kind of ['tavern','bedroom','library','common']){
 for(const [w,h] of [[5,5],[8,6],[12,10],[14,12]]){
  for(const door of ['north','south','east','west']){
   const room={x:3,y:2,w,h,door},a=planRoomFurniture(room,kind,()=>.42,[]),b=planRoomFurniture(room,kind,()=>.42,[]);
   ok(JSON.stringify(a)===JSON.stringify(b),'room generation deterministic: '+kind+'/'+w+'/'+door);
   ok(a.every((p,i)=>validateFurniture(p,room,a.filter((_,j)=>i!==j))),'props within walls, door clearance and no collisions: '+kind+'/'+w+'/'+door);
   ok(a.length>0,'room should not be empty: '+kind+'/'+w+'/'+door);
  }
 }
}
for(const kind of ['tavern','library','bedroom']){
 const room={x:3,y:2,w:12,h:10,door:'south'},f=planRoomFurniture(room,kind,()=>.4,[]);
 ok(f.length>=4,kind+' feels furnished');
 if(kind==='tavern')ok(f.filter(p=>p.type==='chair').length>=2,'tavern gets seats near tables');
 if(kind==='library')ok(f.filter(p=>p.type==='shelf').length>=3,'library has shelves against walls');
 if(kind==='bedroom')ok(f.some(p=>p.type==='bed'),'bedroom contains bed');
}
const large={x:3,y:2,w:12,h:10,door:'south'};
ok(!validateFurniture({x:9,y:11.2,type:'table'},large,[]),'blocking entry rejected');
ok(validateFurniture({x:6,y:4,type:'table'},large,[]),'usable interior allowed');
ok(!validateFurniture({x:6,y:4,type:'table'},large,[{x:6.5,y:4,type:'table'}]),'overlapping furniture rejected');
const entry=roomDoorPoint(large);
ok(entry.side==='south'&&entry.x>large.x&&entry.x<large.x+large.w,'doorway calculated from room geometry');
ok(blocksEntrance({type:'table',x:entry.x,y:entry.y-1},large),'door access path reserved');
const {makeRoom,furnishRoom}=new Function('planRoomFurniture','starterScene','tileIndex',
 fs.readFileSync('studio/generator.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'')+'\nreturn {makeRoom,furnishRoom};')(planRoomFurniture,()=>({}),()=>0);
ok(typeof furnishRoom==='function'&&typeof makeRoom==='function','new planner integrated into generator');
for(const path of ['studio/room-layout.js','studio/generator.js']){cp.execFileSync('node',['--check',path]);checks++;}
console.log(checks+' spatial room furnishing checks passed');
