'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
let total=0;const check=(v,msg)=>{assert.ok(v,msg);total++;};
const html=fs.readFileSync('estudio.html','utf8');
const editor=fs.readFileSync('studio/editor.js','utf8');
const storage=fs.readFileSync('studio/storage.js','utf8');
const art=fs.readFileSync('studio/prop-art.js','utf8');
const scene=fs.readFileSync('studio/scene.js','utf8');
const css=fs.readFileSync('studio/clean.css','utf8');
for(const id of ['open-map-library','local-map-browser','new-local-map','duplicate-local-map','delete-local-map','local-map-message']){
 check(html.includes('id="'+id+'"'),'map browser control '+id);
}
for(const field of ['loadNamedProject','saveNamedProject','listNamedProjects','deleteNamedProject','createMapId']){
 check(storage.includes('export async function '+field)||storage.includes('export const '+field),'map api '+field);
 check(editor.includes(field),'editor wires map api '+field);
}
check(storage.includes("const DB_NAME='haema-studio-local'"),'keeps database name');
check(storage.includes("indexedDB.open(DB_NAME,1)"),'keeps version 1 and existing records');
check(storage.includes("store.get(ownerKey(owner))"),'legacy 0.1-0.3 load preserved');
check(storage.includes("store.put({...scene,id:ownerKey(owner)"),'legacy recovery save preserved');
check(storage.includes('IDBKeyRange.bound(prefix,prefix+'),'map enumeration scoped to signed-in owner');
check(storage.includes("store.delete(mapKey(owner,mapId))"),'delete map cannot target arbitrary store entries');
check(editor.includes("const legacy=await loadProject(ownerId)"),'old map imported without deletion');
check(editor.includes('await persistCurrent();'),'active map saved before scene switch');
check(editor.includes("scene=safeScene(stored);activeMapId=id"),'switch loads separately');
check(editor.includes("scene=restored;activeMapId=id;rememberActive()"),'JSON imports become separately stored maps');
check(editor.includes("scene=next;activeMapId=nextId;rememberActive()"),'new/duplicated maps get unique ids');
check(editor.includes("clearTimeout(saveTimer)"),'pending save managed when switching maps');
check(editor.includes('getCoalescedEvents'),'coalesced mouse/stylus samples supported');
check(editor.includes('paintLine(gesture.previous,q,false)'),'interpolates movement');
check(editor.includes('Math.ceil(distance/.15)'),'brush stamps spaced under one cell');
const section=editor.slice(editor.indexOf('function paintLine('),editor.indexOf('// Only relevant controls'));
const stamps=[];let updates=0;
const paintLine=new Function('paint','changed',section+'\nreturn paintLine;')(
 (point,update)=>{stamps.push({...point});assert.equal(update,false);},()=>{updates++;}
);
paintLine({x:1,y:2},{x:9,y:2});
check(stamps.length>=53,'long drag interpolated across many sub-cell stamps');
check(stamps[0].x>1&&stamps[stamps.length-1].x===9,'stroke reaches end precisely');
check(stamps.every((p,i)=>i===0||p.x-stamps[i-1].x<=.151),'no gaps in brush path');
check(updates===1,'brush rerenders only once per interpolated pointer event');
stamps.length=0;updates=0;
paintLine({x:0,y:0},{x:5,y:0},false);
check(updates===0,'coalesced samples do not trigger redundant full renders');
check(editor.includes("if(tool==='token'||tool==='prop'){gesture={mode:'stamp'}"),'props and tokens are not painted repeatedly on drag');
check(editor.includes("if(gesture?.mode==='paint')paintLine(gesture.previous,p,false)"),'pointer up paints the final segment');
check(editor.includes("canvas.addEventListener('pointercancel',event=>"),'pointer cancel handled');
check(scene.includes("drawStyledProp(ctx,p,CELL)"),'new illustration engine wired into actual scene');
check(scene.includes("if(!drawStyledProp(ctx,p,CELL))drawProp(ctx,p)"),'unsupported props preserved via fallback');
check(html.includes('studio/editor.js?v=7'),'new editor revision used');
check(html.includes('studio/clean.css?v=5'),'stylesheet cache refreshed');
check(css.includes('.studio-map-browser'),'browser styled');
check(!html.includes('id="selected-object-label"Nenhum'),'malformed selection heading repaired');
const {drawStyledProp}=new Function(art.replace(/^export /gm,'')+'\nreturn {drawStyledProp};')();
const ops=[];
const ctx=new Proxy({},{
 get(o,k){if(k==='createRadialGradient')return ()=>({addColorStop(){}});if(k in o)return o[k];return (...args)=>{ops.push([k,...args]);};},
 set(o,k,v){o[k]=v;return true}
});
for(const type of ['tree','bush','rock','pillar','table','bed','chair','shelf','cabinet','chest','crate','barrel']){
 const before=ops.length;
 check(drawStyledProp(ctx,{type,x:4.5,y:8.3,rotation:0},48)===true,type+' illustrated');
 check(ops.length>before+8,type+' has detailed vector operations');
}
check(drawStyledProp(ctx,{type:'torch',x:4,y:4},48)===false,'legacy illustration fallback preserved');
const painted=[];
const ctx2=new Proxy({},{
 get(o,k){if(k==='createRadialGradient')return ()=>({addColorStop(){}});if(k in o)return o[k];return (...args)=>painted.push([k,...args]);},
 set(o,k,v){if(k==='fillStyle')painted.push(['color',v]);o[k]=v;return true}
});
drawStyledProp(ctx2,{type:'tree',x:4,y:3},48);
const one=JSON.stringify(painted);
painted.length=0;drawStyledProp(ctx2,{type:'tree',x:4,y:3},48);
check(JSON.stringify(painted)===one,'tree appearance stable between frames');
painted.length=0;drawStyledProp(ctx2,{type:'tree',x:9,y:7},48);
check(JSON.stringify(painted)!==one,'different trees generate visibly different detail');
for(const file of ['studio/editor.js','studio/scene.js','studio/storage.js','studio/prop-art.js']){
 cp.execFileSync('node',['--check',file]);total++;
}
console.log(total+' map library, brush stroke and illustration checks passed');
