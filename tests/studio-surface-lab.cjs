'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
let checks=0;const ok=(v,label)=>{assert.ok(v,label);checks++};
const source=fs.readFileSync('studio/surface-paint.js','utf8').replace(/^export /gm,'');
const paint=new Function('document',source+'\nreturn {SURFACE_COLORS,sanitizeSurfaceStroke,appendSurfacePoint,drawSurfaceStroke,renderSurfacePaint,invalidateSurfacePaint};')(undefined);
const sceneSource=fs.readFileSync('studio/scene.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const {starterScene,safeScene}=new Function('sanitizeSurfaceStroke',sceneSource+'\nreturn {starterScene,safeScene};')(paint.sanitizeSurfaceStroke);
const raw={material:'water',radius:1.65,softness:.72,opacity:.9,
 points:[{x:1.5,y:2.2},{x:2.5,y:3.1},{x:4.6,y:4.1}]};
const validated=paint.sanitizeSurfaceStroke(raw,28,18);
ok(validated?.material==='water','water material accepted');
ok(validated.points.length===3,'stroke retains control points');
ok(validated.radius===1.65&&validated.softness===.72,'stroke dimensions retained');
ok(!paint.sanitizeSurfaceStroke({...raw,material:'unknown'},28,18),'invalid paint material rejected');
ok(!paint.sanitizeSurfaceStroke({...raw,points:[{x:900,y:1}]},28,18),'outside map coordinate rejected');
ok(!paint.sanitizeSurfaceStroke({...raw,points:[{x:NaN,y:1}]},28,18),'invalid position rejected');
ok(paint.sanitizeSurfaceStroke({...raw,radius:100,softness:8,opacity:0},28,18).radius===5,'brush radius clamped');
ok(paint.sanitizeSurfaceStroke({...raw,radius:100,softness:8,opacity:0},28,18).opacity===.1,'brush opacity clamped');
ok(paint.sanitizeSurfaceStroke({...raw,radius:100,softness:8,opacity:0},28,18).softness===1,'softness clamped');
let pts=[];ok(paint.appendSurfacePoint(pts,{x:1,y:2}),'brush starts');
ok(!paint.appendSurfacePoint(pts,{x:1.04,y:2.04}),'subthreshold move skipped');
ok(paint.appendSurfacePoint(pts,{x:1.25,y:2.05}),'continuous move retained');
const scene=starterScene();
scene.surfaceStrokes=[raw];
ok(safeScene(scene).surfaceStrokes.length===1,'strokes saved in scene JSON');
ok(safeScene(JSON.parse(JSON.stringify(scene))).surfaceStrokes[0].material==='water','legacy JSON export/import includes strokes');
const old=starterScene();delete old.surfaceStrokes;ok(safeScene(old).surfaceStrokes.length===0,'older scenes migrate without strokes');
scene.surfaceStrokes=[{...raw,material:'evil'},raw];
ok(safeScene(scene).surfaceStrokes.length===1,'invalid imported stroke stripped');
const strokes=[];
const ctx=new Proxy({
 save(){strokes.push('save');},restore(){strokes.push('restore')},
 beginPath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},stroke(){strokes.push('stroke')}
},{get(o,k){return o[k]},set(o,k,v){o[k]=v;return true;}});
paint.drawSurfaceStroke(ctx,validated,48);
ok(strokes.filter(x=>x==='stroke').length>=4,'water brush layered with smooth rim');
ok(strokes[0]==='save'&&strokes[strokes.length-1]==='restore','canvas transforms restored');
const html=fs.readFileSync('estudio.html','utf8'),editor=fs.readFileSync('studio/editor.js','utf8'),drawing=fs.readFileSync('studio/scene.js','utf8');
for(const id of ['terrain-brush-mode','terrain-softness','terrain-opacity','surface-undo-stroke','surface-clear-strokes','terrain-brush-explanation'])
 ok(html.includes('id="'+id+'"'),'organic brush UI: '+id);
ok(html.includes('value="organic"'),'freeform is default mode');
ok(html.includes('value="cells"'),'original cell painting preserved');
ok(editor.includes("gesture={mode:'surface'"),'brush starts continuously');
ok(editor.includes("gesture?.mode==='surface'"),'brush follows mouse while pressed');
ok(editor.includes('scene.surfaceStrokes.push(stroke)'),'brush commits vector on pointer release');
ok(editor.includes("snapshot();scene.surfaceStrokes.pop()"),'removing last stroke undoable');
ok(editor.includes('invalidateSurfacePaint(scene)'),'cached surface invalidation wired');
ok(drawing.includes('renderSurfacePaint(ctx,scene,CELL)'),'surface paint is included in every map rendering');
ok(drawing.indexOf('renderSurfacePaint(ctx,scene,CELL)')<drawing.indexOf('renderFog(ctx,scene,{player,cell:CELL})'),'player fog masks terrain painting');
ok(!source.includes('fetch(')&&!source.includes('https://'),'free paint entirely local');
for(const path of ['studio/surface-paint.js','studio/editor.js','studio/scene.js']){
 cp.execFileSync('node',['--check',path]);checks++;
}
console.log(checks+' subcell organic brush, JSON/undo and projection privacy checks passed');
