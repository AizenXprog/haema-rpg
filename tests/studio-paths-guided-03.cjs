'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
let checks=0;const ok=(v,msg)=>{assert.ok(v,msg);checks++};
const geometrySource=fs.readFileSync('studio/path-geometry.js','utf8').replace(/^export /gm,'');
const g=new Function(geometrySource+'\nreturn {sanitizePath,makePath,simplifyPoints,addStrokePoint,nearestPath,movePath,drawPath};')();
const sceneSource=fs.readFileSync('studio/scene.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const sceneApi=new Function('sanitizePath','drawPath','drawStyledProp',sceneSource+'\nreturn {starterScene,safeScene,tileIndex,drawScene};')(g.sanitizePath,g.drawPath,()=>false);
const genSource=fs.readFileSync('studio/generator.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const layoutSource=fs.readFileSync('studio/room-layout.js','utf8').replace(/^export /gm,'');
const {planRoomFurniture}=new Function(layoutSource+'\nreturn {planRoomFurniture};')();
const topologySource=fs.readFileSync('studio/room-topology.js','utf8').replace(/^export /gm,'');
const {planRoomTopology}=new Function(topologySource+'\nreturn {planRoomTopology};')();
const gen=new Function('starterScene','tileIndex','planRoomFurniture','planRoomTopology',genSource+'\nreturn {generateScene,makeRoom,furnishRoom};')(sceneApi.starterScene,sceneApi.tileIndex,planRoomFurniture,planRoomTopology);
const promptSource=fs.readFileSync('studio/guided-generator.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const guided=new Function('generateScene','makePath',promptSource+'\nreturn {interpretDescription,generateFromDescription};')(gen.generateScene,g.makePath);
const points=[{x:2,y:2},{x:3,y:2.2},{x:4,y:3.1},{x:5,y:4},{x:8,y:4}];
const road=g.makePath('road',points,{width:1.5,material:'stone',cols:28,rows:18});
ok(road.kind==='road'&&road.material==='stone','editable material');
ok(road.points.length===5,'path points valid');
ok(g.sanitizePath(road,28,18)?.width===1.5,'path roundtrip');
ok(!g.sanitizePath({...road,kind:'evil'},28,18),'invalid kind refused');
ok(!g.sanitizePath({...road,points:[{x:1,y:1},{x:90,y:2}]},28,18),'out of bounds refused');
ok(!g.sanitizePath({...road,points:[{x:0,y:1},{x:NaN,y:2}]},28,18),'NaN coordinates refused');
ok(!g.sanitizePath({...road,points:[{x:1,y:1}]},28,18),'one point refused');
ok(g.sanitizePath({...road,width:900},28,18)?.width===4,'width clamped');
const originals=road.points.map(p=>({...p}));
g.movePath(road,originals,250,-250,28,18);
ok(road.points.every(p=>p.x>=0&&p.x<=28&&p.y>=0&&p.y<=18),'drag clamps all points');
ok(g.nearestPath([road],{x:road.points[1].x,y:road.points[1].y})===road,'path hit test');
ok(g.nearestPath([road],{x:0,y:18})===null,'distant path not selected');
let stroke=[];const ctx=new Proxy({save(){},restore(){},stroke(){stroke.push(this.lineWidth)},moveTo(){},lineTo(){},quadraticCurveTo(){},beginPath(){},setLineDash(){}},{get(o,k){return o[k]??(()=>{})},set(o,k,v){o[k]=v;return true}});
g.drawPath(ctx,road,48);ok(stroke.length>=3,'path rendered with layered strokes');
ok(stroke.every(w=>w>0&&Number.isFinite(w)),'all path widths finite');
const dense=[{x:0,y:0},{x:1,y:0.01},{x:2,y:0.02},{x:3,y:0.03},{x:4,y:0}];
ok(g.simplifyPoints(dense,.1).length===2,'mouse stroke simplification');
let strokePoints=[{x:1,y:1}];ok(!g.addStrokePoint(strokePoints,{x:1.03,y:1.03}),'near-identical points skipped');
ok(g.addStrokePoint(strokePoints,{x:2,y:1.4}),'distant points kept');
const scene=sceneApi.starterScene();ok(scene.paths.length===0,'legacy template includes empty paths');
delete scene.paths;ok(sceneApi.safeScene(scene).paths.length===0,'v0.1/v0.2 imports do not require paths');
scene.paths=[g.makePath('river',[{x:1,y:1},{x:25,y:15}],{width:2,cols:28,rows:18})];
ok(sceneApi.safeScene(scene).paths.length===1,'roads and rivers survive JSON import');
const exported=JSON.parse(JSON.stringify(scene));ok(sceneApi.safeScene(exported).paths[0].kind==='river','paths roundtrip JSON');
const samples=[
 ['floresta densa com um rio e uma estrada','forest',2],
 ['lago com margens de areia','lake',0],
 ['taverna antiga com caminho','tavern',1],
 ['biblioteca antiga nas ruínas','dungeon',0],
 ['caverna sem árvores e com rio','dungeon',1]
];
for(const [text,expected,pathsCount]of samples){
 const plan=guided.interpretDescription(text);
 ok(plan.base===expected,'prompt maps correct scene type '+text);
 const a=guided.generateFromDescription(text,'seed-stable'),b=guided.generateFromDescription(text,'seed-stable');
 ok(a.scene.paths.length===pathsCount,'prompt creates correct path count '+text);
 ok(JSON.stringify(a.scene)===JSON.stringify(b.scene),'prompt deterministic '+text);
 ok(sceneApi.safeScene(a.scene).paths.length===pathsCount,'prompt paths persist '+text);
}
ok(guided.interpretDescription('floresta sem árvores').vegetation==='none','negation parsed');
const noTrees=guided.generateFromDescription('floresta sem árvores','stable').scene;
ok(noTrees.props.every(p=>p.type!=='tree'&&p.type!=='bush'),'negated trees excluded');
ok(guided.generateFromDescription('floresta densa','stable').scene.props.length>gen.generateScene('forest','stable').props.length,'dense forest adds props');
assert.throws(()=>guided.interpretDescription('algo genérico'),/referências/);checks++;
assert.throws(()=>guided.interpretDescription('abc'),/seis/);checks++;
assert.throws(()=>guided.interpretDescription('floresta '+('a'.repeat(340))),/320/);checks++;
const html=fs.readFileSync('estudio.html','utf8'),editor=fs.readFileSync('studio/editor.js','utf8'),source=fs.readFileSync('studio/scene.js','utf8');
for(const id of ['guided-description','guided-generate','guided-feedback','path-width','road-material','selected-path-controls','selected-path-delete']){
 ok(html.includes('id="'+id+'"'),'control exists '+id);
}
for(const kind of ['road','river'])ok(html.includes('data-tool="'+kind+'"'),'tool '+kind+' exposed');
ok(editor.includes("gesture={mode:'path'"),'path drawing gesture wired');
ok(editor.includes("gesture?.mode==='path-drag'"),'path drag wired');
ok(editor.includes("scene.paths.push(path)"),'new paths committed to scene');
ok(editor.includes("generateFromDescription(value"),'guided prompt connected to generate');
ok(editor.includes("snapshot();scene.paths=scene.paths.filter"),'path deletion undoable');
ok(editor.includes("scene.paths.push(copy);selectedPath=copy"),'path duplication undoable');
ok(source.indexOf('for(const path of scene.paths')<source.indexOf("renderFog(ctx,scene,{player"),'paths drawn BELOW fog mask');
ok(!promptSource.includes('fetch(')&&!promptSource.includes('https://'),'no prompt network submission');
console.log(checks+' vector paths and local description generator checks passed');
