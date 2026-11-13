'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
let tests=0;const check=(v,label)=>{assert.ok(v,label);tests++};
const lighting=fs.readFileSync('studio/atmosphere.js','utf8').replace(/^export /gm,'');
const {AMBIENT_PRESETS,normalizeAtmosphere,drawAtmosphere}=new Function(lighting+'\nreturn {AMBIENT_PRESETS,normalizeAtmosphere,drawAtmosphere};')();
const engine=fs.readFileSync('studio/scene.js','utf8').replace(/^import[^\n]*\n/gm,'').replace(/^export /gm,'');
const {starterScene,safeScene,exposed}=new Function(engine+'\nreturn {starterScene,safeScene,exposed};')();
const html=fs.readFileSync('estudio.html','utf8'),editor=fs.readFileSync('studio/editor.js','utf8'),gen=fs.readFileSync('studio/generator.js','utf8'),guided=fs.readFileSync('studio/guided-generator.js','utf8');
check(starterScene().atmosphere.preset==='day','default scene daylight');
check(safeScene(starterScene()).atmosphere.preset==='day','atmosphere survives roundtrip');
check(safeScene({...starterScene(),atmosphere:{preset:'night',strength:.4}}).atmosphere.strength===.4,'night preset saved');
check(safeScene({...starterScene(),atmosphere:{preset:'unknown',strength:8}}).atmosphere.preset==='day','unsupported preset sanitized');
check(safeScene({...starterScene(),atmosphere:{preset:'night',strength:8}}).atmosphere.strength===1,'opacity capped');
check(safeScene({...starterScene(),atmosphere:{preset:'night',strength:-5}}).atmosphere.strength===0,'opacity lower capped');
check(safeScene({...starterScene(),atmosphere:{preset:'night',strength:'NaN'}}).atmosphere.strength===1,'invalid opacity repaired');
check(safeScene({...starterScene(),atmosphere:undefined}).atmosphere.preset==='day','older maps without atmosphere keep daylight');
check(Object.keys(AMBIENT_PRESETS).length===4,'four distinct atmosphere presets');
check(normalizeAtmosphere({preset:'sunset',strength:.51}).strength===.51,'standalone atmosphere normalization');
check(normalizeAtmosphere({preset:'evil',strength:100}).preset==='day','standalone rejects invalid preset');
const scene=starterScene();
scene.fog.fill(0);
scene.props=[{x:5,y:5,type:'torch'},{x:12,y:8,type:'hearth'}];
scene.atmosphere={preset:'night',strength:1};
const records=[];
const ctx=new Proxy({
 save(){records.push(['save']);},restore(){records.push(['restore']);},
 fillRect(x,y,w,h){records.push(['fillRect',x,y,w,h]);},
 createRadialGradient(x,y){records.push(['light',x,y]);return{addColorStop(at,color){records.push(['stop',at,color]);}};}
},{
 get(target,key){return Reflect.get(target,key);},
 set(target,key,value){records.push(['set',key,value]);target[key]=value;return true;}
});
drawAtmosphere(ctx,scene,{cell:48,player:false,visible:exposed});
check(records.filter(x=>x[0]==='light').length===2,'both torches and hearth emit lights for master');
check(records[0][0]==='save'&&records[records.length-1][0]==='restore','canvas state restored');
check(records.some(x=>x[0]==='set'&&x[1]==='globalCompositeOperation'&&x[2]==='screen'),'light glows composited');
records.length=0;
scene.fog[8*scene.cols+12]=1;
drawAtmosphere(ctx,scene,{cell:48,player:true,visible:exposed});
check(records.filter(x=>x[0]==='light').length===1,'player never receives light from concealed hearth');
records.length=0;
drawAtmosphere(ctx,scene,{cell:48,player:false,visible:exposed});
check(records.filter(x=>x[0]==='light').length===2,'master still gets concealed light source');
check(html.includes('id="atmosphere-preset"')&&html.includes('id="atmosphere-strength"'),'contextual atmosphere controls exist');
check(editor.includes("scene.atmosphere={...(scene.atmosphere||{}),preset:event.target.value}"),'preset UI changes scene');
check(editor.includes("scene.atmosphere={...(scene.atmosphere||{}),strength:Number(event.target.value)/100}"),'strength control saves');
check(engine.indexOf("drawAtmosphere(ctx,scene,{cell:CELL,player,visible:exposed})")<engine.indexOf("renderFog(ctx,scene,{player,cell:CELL})"),'lighting drawn under privacy fog');
check(editor.includes("from './scene.js?v=4'")&&gen.includes("from './scene.js?v=4'"),'scene imports share version');
check(editor.includes("from './generator.js?v=5'")&&guided.includes("from './generator.js?v=5'"),'generator imports share version');
for(const path of ['studio/scene.js','studio/atmosphere.js','studio/generator.js','studio/editor.js']){
 cp.execFileSync('node',['--check',path]);tests++;
}
console.log(tests+' atmospheric scene, hidden light privacy and compatibility checks passed');
