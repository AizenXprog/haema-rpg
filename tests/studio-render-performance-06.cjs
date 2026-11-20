'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
let count=0;const ok=(v,name)=>{assert.ok(v,name);count++;};
const schedSrc=fs.readFileSync('studio/render-scheduler.js','utf8').replace(/^export /gm,'');
const {createRenderScheduler}=new Function(schedSrc+'\nreturn {createRenderScheduler};')();
let tasks=[],paints=0;
const schedule=fn=>{const id={fn};tasks.push(id);return id;};
const cancel=id=>{tasks=tasks.filter(t=>t!==id);};
const scheduler=createRenderScheduler(()=>paints++,{schedule,cancel});
for(let i=0;i<200;i++)scheduler.request();
ok(tasks.length===1,'200 pointermove renders coalesce into one rAF');
tasks.shift().fn();ok(paints===1,'first frame rendered exactly once');
scheduler.request();scheduler.request();scheduler.flush();
ok(paints===2&&tasks.length===0,'urgent flush renders once and cancels pending frame');
scheduler.request();scheduler.dispose();
ok(tasks.length===0,'dispose cancels pending render');
scheduler.request();ok(tasks.length===0,'disposed scheduler rejects work');
const editor=fs.readFileSync('studio/editor.js','utf8');
ok(editor.includes('const canvasRender=createRenderScheduler(paintFrame)')&&editor.includes('function render(){canvasRender.request();}'),
 'editor actually schedules instead of rendering synchronously');

let created=0,canvasRecords=[];
const makeCtx=()=>new Proxy({
 createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4),width:w,height:h};},
 putImageData(){},
 createRadialGradient(){return {addColorStop(){}};},
 createLinearGradient(){return {addColorStop(){}};},
 drawImage(){},fillRect(){},save(){},restore(){},
}, {get(obj,key){return key in obj?obj[key]:()=>{};},set(obj,k,v){obj[k]=v;return true}});
const document={createElement(tag){
 assert.equal(tag,'canvas');created++;
 const c={width:0,height:0,getContext:()=>makeCtx()};
 canvasRecords.push(c);return c;
}};
const fogSrc=fs.readFileSync('studio/fog-renderer.js','utf8').replace(/^export /gm,'');
const fog=new Function('document',fogSrc+'\nreturn {renderFog,fogCoverage};')(document);
let fills=[],draws=0;
const context=new Proxy({save(){},restore(){},drawImage(){draws++;},fillRect(...a){fills.push(a)}},
 {get(obj,key){return key in obj?obj[key]:()=>{};},set(obj,key,val){obj[key]=val;return true;}});
const scene={cols:12,rows:8,fog:Array(96).fill(0)};
ok(fog.renderFog(context,scene,{player:true})&&created===0&&draws===0,
 'fully revealed fog avoids all raster allocation and pixel iteration');
scene.fog.fill(1);fog.renderFog(context,scene,{player:true});
ok(created===0&&fills.some(([x,y,w,h])=>w===576&&h===384),
 'fully hidden fog uses one opaque rectangle, no pixel allocation');
scene.fog.fill(0);scene.fog[2*12+3]=1;
fog.renderFog(context,scene,{player:true});
ok(created===1&&draws===1,'partial fog renders cached alpha surface');
ok(fills.some(([x,y,w,h])=>x===3*48&&y===2*48&&w===48&&h===48),
 'hidden player tile masked at exact native pixel boundaries');
scene.fog.fill(0);fog.renderFog(context,scene,{player:true});
ok(created===1&&draws===1,'clearing fog discards cache and skips raster');
scene.fog[2*12+4]=1;fog.renderFog(context,scene,{player:true});
ok(created===2,'new concealed tile rebuilds clean fog instead of retaining old hidden pixels');
const recordBefore=created;
const originalCreate=document.createElement;
document.createElement=tag=>{
 const c=originalCreate(tag);
 c.getContext=()=>({...makeCtx(),createImageData(){throw Error('surface size inspected')}});return c;
};
const large={cols:80,rows:80,fog:Array(6400).fill(0)};large.fog[10]=1;
assert.throws(()=>fog.renderFog(context,large,{player:true}),/surface size inspected/);count++;
const canvas=canvasRecords[canvasRecords.length-1];
ok(canvas.width*canvas.height<=1250000,'80x80 fog raster under 1.25m px instead of 14.7m px');
ok(canvas.width<3840&&canvas.height<3840,'large fog uses adaptive working resolution');
document.createElement=originalCreate;

let spriteRenders=0;
const artDocument={createElement(tag){spriteRenders++;
 return {width:0,height:0,getContext:()=>makeCtx()};}};
const artSource=fs.readFileSync('studio/prop-art.js','utf8').replace(/^export /gm,'');
const {drawStyledProp}=new Function('document',artSource+'\nreturn {drawStyledProp};')(artDocument);
const ctx=makeCtx();
ok(drawStyledProp(ctx,{type:'tree',x:3.5,y:4.5},48),'tree art renders');
ok(drawStyledProp(ctx,{type:'tree',x:3.5,y:4.5},48),'identical tree render repeats');
ok(spriteRenders===1,'same tree uses cached sprite instead of rebuilding Canvas paths');
ok(drawStyledProp(ctx,{type:'tree',x:5.5,y:4.5},48)&&spriteRenders===2,'distinct tree variation stays independent');
ok(drawStyledProp(ctx,{type:'table',x:5.5,y:4.5},48)&&spriteRenders===3,'object material types do not share sprites');

const sceneSource=fs.readFileSync('studio/scene.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const drawCounters={props:0};
const preamble=[
 'const renderTerrain=()=>true;',
 'const renderFog=()=>true;',
 'const renderSurfacePaint=()=>true;',
 'const drawAtmosphere=()=>{};',
 'const drawStyledProp=()=>{drawCounters.props++;return true;};',
 'const drawSmartBridges=()=>{};',
 'const drawPath=()=>{};'
].join('\n');
const {drawScene}=new Function('drawCounters',preamble+'\n'+sceneSource+'\nreturn {drawScene};')(drawCounters);
const map={cols:28,rows:18,tiles:Array(504).fill('grass'),heights:Array(504).fill(0),
 fog:Array(504).fill(0),props:[{type:'tree',x:1,y:1},{type:'tree',x:22,y:13}],
 tokens:[],walls:[],paths:[],surfaceStrokes:[]};
drawScene(ctx,map,{viewport:{x0:0,y0:0,x1:150,y1:150},grid:false});
ok(drawCounters.props===1,'offscreen prop skipped while master is zoomed in');
drawCounters.props=0;
drawScene(ctx,map,{player:true,grid:false});
ok(drawCounters.props===2,'player projection still renders all visible props');
for(const file of ['studio/render-scheduler.js','studio/fog-renderer.js','studio/prop-art.js','studio/editor.js','studio/scene.js'])
 {cp.execFileSync('node',['--check',file]);count++;}
console.log(count+' responsive rendering, fog privacy, sprite and viewport checks passed');
