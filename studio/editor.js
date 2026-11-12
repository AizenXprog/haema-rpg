import {access,accessGate,authorizedFetch,node,button} from '../auth.js';
import {CELL,TERRAINS,PROPS,starterScene,safeScene,tileIndex,inBounds,drawScene} from './scene.js';
import {saveProject,loadProject,exportJSON} from './storage.js';
import {generateScene,makeRoom} from './generator.js';

const $=id=>document.getElementById(id);
const gate=$('studio-gate'),workspace=$('studio-workspace'),canvas=$('studio-canvas'),ctx=canvas.getContext('2d');
const view={x:0,y:0,zoom:1,ready:false};
let scene=starterScene(),backgroundImage=null,tool='pan',terrain='stone',prop='tree',brush=2,showGrid=true,paintedTiles=new Set(),lastStamp=null;
let drawing=false,gesture=null,hover=null,spaceHeld=false,selected=null,saveTimer=0,broadcastTimer=0;
let ownerId=null,channel=null,projector=null,blackout=false,history=[],future=[],initialized=false;
const status=(message)=>{$('studio-status').textContent=message;};
const round=(n)=>Math.round(n*2)/2;
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const worldWidth=()=>scene.cols*CELL,worldHeight=()=>scene.rows*CELL;
function fit(){
 const rect=canvas.getBoundingClientRect();view.zoom=Math.min(1.35,Math.max(.15,Math.min((rect.width-72)/worldWidth(),(rect.height-72)/worldHeight())));
 view.x=(rect.width-worldWidth()*view.zoom)/2;view.y=(rect.height-worldHeight()*view.zoom)/2;view.ready=true;render();
}
function resize(){
 const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));
 if(!view.ready)fit();else render();
}
function render(){
 const dpr=canvas.width/Math.max(1,canvas.clientWidth);
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
 ctx.fillStyle='#0a1012';ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight);
 ctx.translate(view.x,view.y);ctx.scale(view.zoom,view.zoom);
 drawScene(ctx,scene,{grid:showGrid,image:backgroundImage});
 if(hover&&['terrain','reveal','conceal','erase','raise','lower','scatter'].includes(tool)){
  ctx.strokeStyle=tool==='reveal'?'#d6b986':'#f2d1a4';ctx.lineWidth=1.6/view.zoom;ctx.setLineDash([6/view.zoom,4/view.zoom]);
  ctx.beginPath();ctx.arc(hover.x*CELL,hover.y*CELL,brush*CELL,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
 }
 if(gesture?.mode==='room'&&hover){
  const a=gesture,x=Math.floor(Math.min(a.startX,hover.x))*CELL,y=Math.floor(Math.min(a.startY,hover.y))*CELL;
  const w=Math.max(3,Math.ceil(Math.abs(hover.x-a.startX)))*CELL,h=Math.max(3,Math.ceil(Math.abs(hover.y-a.startY)))*CELL;
  ctx.fillStyle='#d9bc8766';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#f3d7a2';ctx.lineWidth=4;ctx.strokeRect(x,y,w,h);
 }
 if(gesture?.mode==='wall'&&hover){
  ctx.strokeStyle='#e9d09e';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(gesture.startX*CELL,gesture.startY*CELL);
  ctx.lineTo(round(hover.x)*CELL,round(hover.y)*CELL);ctx.stroke();
 }
 $('studio-zoom').textContent=Math.round(view.zoom*100)+'%';
}
function point(event){
 const r=canvas.getBoundingClientRect();
 return {px:event.clientX-r.left,py:event.clientY-r.top,
  x:(event.clientX-r.left-view.x)/view.zoom/CELL,
  y:(event.clientY-r.top-view.y)/view.zoom/CELL};
}
function within(p){return inBounds(scene,p.x,p.y);}
function closestToken(p){
 let found=null,distance=0.54;
 for(const t of scene.tokens){const d=Math.hypot(t.x-p.x,t.y-p.y);if(d<distance){found=t;distance=d;}}
 return found;
}
function saveLater(){
 clearTimeout(saveTimer);
 saveTimer=setTimeout(async()=>{
  try{await saveProject(scene,ownerId);status('Projeto salvo neste navegador.');}
  catch{status('Salvamento local indisponível. Exporte o projeto em JSON.');}
 },350);
}
// History stores the large background image by reference, not on every brush stroke.
const freezeScene=()=>({shape:JSON.stringify({...scene,background:null}),background:scene.background});
const thawScene=entry=>safeScene({...JSON.parse(entry.shape),background:entry.background});
function clearSelection(){selected=null;$('token-visibility').checked=false;$('token-visibility').disabled=true;}
function snapshot(){
 history.push(freezeScene());if(history.length>40)history.shift();future.length=0;
}
function undo(){
 if(!history.length)return;future.push(freezeScene());scene=thawScene(history.pop());clearSelection();loadBackground();changed();
}
function redo(){
 if(!future.length)return;history.push(freezeScene());scene=thawScene(future.pop());clearSelection();loadBackground();changed();
}
function changed(autosave=true){
 $('scene-name').value=scene.name;
 $('studio-token-count').textContent=scene.tokens.length;
 render();
 if(autosave)saveLater();
 queueBroadcast();
}
function paint(p,shouldUpdate=true){
 if(!within(p))return;
 const cx=Math.floor(p.x),cy=Math.floor(p.y);
 if(['terrain','reveal','conceal','erase','raise','lower'].includes(tool)){
  for(let y=Math.max(0,cy-brush+1);y<Math.min(scene.rows,cy+brush);y++)
   for(let x=Math.max(0,cx-brush+1);x<Math.min(scene.cols,cx+brush);x++){
    const distance=Math.hypot(x+.5-p.x,y+.5-p.y);
    if(distance>brush)continue;
    const i=tileIndex(scene,x,y);
    if(tool==='terrain')scene.tiles[i]=terrain;
    else if(tool==='reveal')scene.fog[i]=0;
    else if(tool==='conceal')scene.fog[i]=1;
    else if(tool==='raise'||tool==='lower'){
     if(paintedTiles.has(i))continue;
     paintedTiles.add(i);scene.heights[i]=clamp((scene.heights[i]||0)+(tool==='raise'?1:-1),0,4);
    }else{
     scene.tiles[i]='grass';scene.heights[i]=0;
    }
   }
  if(tool==='erase'){
   scene.props=scene.props.filter(o=>Math.hypot(o.x-p.x,o.y-p.y)>brush);
   scene.tokens=scene.tokens.filter(t=>Math.hypot(t.x-p.x,t.y-p.y)>brush);
  }
 }else if(tool==='token'){
  if(scene.tokens.length>=120)return status('Limite de 120 tokens nesta versão.');
  const label=$('token-name').value.trim().slice(0,16)||'PJ';
  scene.tokens.push({id:crypto.randomUUID(),x:cx+.5,y:cy+.5,label,color:'#d8b582',hidden:$('token-hidden').checked});
  setTool('select');
 }else if(tool==='prop'||tool==='scatter'){
  if(scene.props.length>=500)return status('Limite de 500 objetos nesta versão.');
  const spacing=tool==='scatter'?.9:.72;
  if(lastStamp&&Math.hypot(lastStamp.x-p.x,lastStamp.y-p.y)<spacing)return;
  lastStamp={x:p.x,y:p.y};
  const isScatter=tool==='scatter';
  const jitter=()=>isScatter?(Math.random()-.5)*.9:0;
  scene.props.push({x:cx+.5+jitter(),y:cy+.5+jitter(),type:isScatter?'tree':prop,rotation:isScatter?Math.round(Math.random()*360):0});
 }
 if(shouldUpdate)changed(false);
}
function paintLine(from,to){
 if(!from){paint(to);return;}
 const distance=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.min(80,Math.max(1,Math.ceil(distance/.33)));
 for(let k=1;k<=steps;k++){
  const t=k/steps;
  paint({x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t},false);
 }
 changed(false);
}
function setTool(next){
 tool=next;for(const b of document.querySelectorAll('[data-tool]'))b.setAttribute('aria-pressed',String(b.dataset.tool===tool));
 canvas.style.cursor=tool==='pan'?'grab':tool==='select'?'default':'crosshair';
 $('studio-tool').textContent=tool.toUpperCase();render();
}
canvas.addEventListener('pointerdown',event=>{
 if(event.button!==0&&event.button!==1)return;
 const p=point(event);hover=p;
 if(tool==='pan'||spaceHeld||event.button===1){
  gesture={mode:'pan',px:p.px,py:p.py,x:view.x,y:view.y};
 }else if(tool==='select'){
  selected=closestToken(p);
  if(selected){snapshot();gesture={mode:'drag',token:selected};}
  else gesture={mode:'noop'};
  $('token-visibility').disabled=!selected;
  if(selected)$('token-visibility').checked=!!selected.hidden;
 }else if(tool==='wall'){
  snapshot();gesture={mode:'wall',startX:round(p.x),startY:round(p.y)};
 }else if(tool==='room'){
  snapshot();gesture={mode:'room',startX:p.x,startY:p.y};
 }else{
  if(!within(p))return;
  snapshot();paintedTiles.clear();lastStamp=null;gesture={mode:'paint',previous:p};paint(p);
 }
 drawing=true;canvas.setPointerCapture(event.pointerId);render();
});
canvas.addEventListener('pointermove',event=>{
 const p=point(event);hover=p;
 if(drawing&&gesture?.mode==='pan'){view.x=gesture.x+p.px-gesture.px;view.y=gesture.y+p.py-gesture.py;}
 else if(drawing&&gesture?.mode==='drag'&&within(p)){gesture.token.x=clamp(p.x,.5,scene.cols-.5);gesture.token.y=clamp(p.y,.5,scene.rows-.5);changed(false);}
 else if(drawing&&gesture?.mode==='paint'){paintLine(gesture.previous,p);gesture.previous=p;}
 render();
});
function release(event){
 if(!drawing)return;
 const p=point(event);
 if(gesture?.mode==='wall'){
  const a=gesture,b={x:round(clamp(p.x,0,scene.cols)),y:round(clamp(p.y,0,scene.rows))};
  if(Math.hypot(a.startX-b.x,a.startY-b.y)>.15&&scene.walls.length<400)
   scene.walls.push({x1:a.startX,y1:a.startY,x2:b.x,y2:b.y});
 }
 if(gesture?.mode==='room'&&within(p)){
  const xa=Math.floor(Math.min(gesture.startX,p.x)),ya=Math.floor(Math.min(gesture.startY,p.y));
  const xb=Math.ceil(Math.max(gesture.startX,p.x)),yb=Math.ceil(Math.max(gesture.startY,p.y));
  if(xb-xa>=3&&yb-ya>=3){
   makeRoom(scene,{x:xa,y:ya,w:xb-xa,h:yb-ya,floor:terrain==='wood'||terrain==='marble'||terrain==='brick'?terrain:'wood'});
   changed();
  }else status('Arraste um cômodo com pelo menos três células de largura e altura.');
 }
 if(gesture?.mode==='paint')changed();
 if(gesture?.mode==='drag'||gesture?.mode==='wall')changed();
 drawing=false;gesture=null;render();
 try{canvas.releasePointerCapture(event.pointerId);}catch{}
}
canvas.addEventListener('pointerup',release);
canvas.addEventListener('pointercancel',release);
canvas.addEventListener('pointerleave',()=>{if(!drawing){hover=null;render();}});
canvas.addEventListener('wheel',event=>{
 event.preventDefault();const p=point(event),before=view.zoom;
 view.zoom=clamp(view.zoom*(event.deltaY>0?.87:1.15),.15,3.5);
 view.x=p.px-p.x*CELL*view.zoom;view.y=p.py-p.y*CELL*view.zoom;
 if(before!==view.zoom)render();
},{passive:false});
function loadBackground(){
 backgroundImage=null;
 if(!scene.background){changed(false);return;}
 const image=new Image();image.onload=()=>{if(scene.background===image.src){backgroundImage=image;changed(false);}};
 image.onerror=()=>status('Não foi possível carregar a imagem de fundo.');
 image.src=scene.background;
}
function visibleImage(){
 const output=document.createElement('canvas');output.width=worldWidth();output.height=worldHeight();
 const drawingContext=output.getContext('2d');drawScene(drawingContext,scene,{player:true,grid:showGrid,image:backgroundImage});
 return output;
}
function queueBroadcast(){
 if(!channel)return;
 clearTimeout(broadcastTimer);broadcastTimer=setTimeout(()=>{
  if(blackout){channel.postMessage({type:'blackout'});return;}
  try{
   // Projection receives ONLY flattened pixels with fog baked in: no unrevealed data or GM-only tokens.
   const image=visibleImage().toDataURL('image/webp',.88);
   channel.postMessage({type:'frame',image,width:worldWidth(),height:worldHeight()});
  }catch{status('Não foi possível atualizar a projeção.');}
 },100);
}
function startProjection(){
 if(!('BroadcastChannel' in window)){status('Seu navegador não oferece sincronização entre janelas.');return;}
 if(!channel){
  const token=Array.from(crypto.getRandomValues(new Uint8Array(20)),b=>b.toString(16).padStart(2,'0')).join('');
  channel=new BroadcastChannel('haema-studio-'+token);
  channel.onmessage=event=>{if(event.data?.type==='ready')queueBroadcast();};
  const url=new URL('../projecao.html',import.meta.url);url.hash=token;
  projector=window.open(url.href,'haema-projecao','width=1100,height=700');
 }else if(projector&&!projector.closed)projector.focus();
 else{channel.close();channel=null;projector=null;return startProjection();}
 if(!projector){status('O navegador bloqueou a segunda janela. Permita pop-ups para este site.');channel?.close();channel=null;return;}
 status('Janela de jogadores aberta. Mova-a para o segundo monitor e use tela cheia.');
 queueBroadcast();
}
function download(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function setup(){
 if(initialized)return;initialized=true;
 document.querySelectorAll('[data-tool]').forEach(el=>el.addEventListener('click',()=>setTool(el.dataset.tool)));
 document.querySelectorAll('[data-terrain]').forEach(el=>el.addEventListener('click',()=>{terrain=el.dataset.terrain;setTool('terrain');document.querySelectorAll('[data-terrain]').forEach(x=>x.setAttribute('aria-pressed',String(x===el)));}));
 document.querySelectorAll('[data-prop]').forEach(el=>el.addEventListener('click',()=>{prop=el.dataset.prop;setTool('prop');document.querySelectorAll('[data-prop]').forEach(x=>x.setAttribute('aria-pressed',String(x===el)));}));
 document.querySelectorAll('[data-scene-template]').forEach(el=>el.addEventListener('click',()=>{const type=el.dataset.sceneTemplate;if(!confirm('Substituir o cenário atual por um novo mapa gerado? A ação poderá ser desfeita.'))return;snapshot();scene=generateScene(type,$('seed-input').value||String(Date.now()));clearSelection();loadBackground();changed();fit();status('Cenário gerado: '+scene.name); }));
 $('brush-size').addEventListener('input',event=>{brush=Number(event.target.value);$('brush-value').textContent=brush;render();});
 $('new-room').addEventListener('click',()=>{setTool('room');status('Arraste no mapa para desenhar um cômodo; o editor cria paredes e um acesso.');});
 $('scene-name').addEventListener('change',event=>{snapshot();scene.name=String(event.target.value).slice(0,80)||'Sem título';changed();});
 $('grid-toggle').addEventListener('change',event=>{showGrid=event.target.checked;changed(false);});
 $('token-visibility').addEventListener('change',event=>{if(!selected)return;snapshot();selected.hidden=event.target.checked;changed();});
 $('reveal-all').addEventListener('click',()=>{snapshot();scene.fog.fill(0);changed();});
 $('hide-all').addEventListener('click',()=>{snapshot();scene.fog.fill(1);changed();});
 $('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);
 $('fit-map').addEventListener('click',fit);
 $('save-local').addEventListener('click',async()=>{try{await saveProject(scene,ownerId);status('Projeto salvo no navegador.');}catch{status('Não foi possível salvar. Exporte em JSON.');}});
 $('export-json').addEventListener('click',()=>exportJSON(scene));
 $('import-json').addEventListener('click',()=>$('import-json-input').click());
 $('import-json-input').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
   if(file.size>13e6)throw Error('Arquivo muito grande.');
   const restored=safeScene(JSON.parse(await file.text()));snapshot();scene=restored;clearSelection();loadBackground();fit();changed();
   status('Projeto importado.');event.target.value='';
  }catch(error){status(error.message||'Projeto inválido.');}
 });
 $('import-map').addEventListener('click',()=>$('import-map-input').click());
 $('import-map-input').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
   if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>6e6)throw Error('Use PNG, JPG ou WebP até 6 MB.');
   const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});
   snapshot();scene.background=data;loadBackground();changed();status('Imagem importada no mapa.');event.target.value='';
  }catch(error){status(error.message);}
 });
 $('remove-map').addEventListener('click',()=>{snapshot();scene.background=null;backgroundImage=null;changed();});
 $('export-png').addEventListener('click',()=>visibleImage().toBlob(blob=>{if(blob)download(blob,'haema-cena-visivel.png');},'image/png'));
 $('open-projection').addEventListener('click',startProjection);
 $('blackout').addEventListener('click',()=>{blackout=!blackout;$('blackout').setAttribute('aria-pressed',String(blackout));$('blackout').textContent=blackout?'Revelar projeção':'Apagar projeção';queueBroadcast();});
 window.addEventListener('keydown',event=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();event.shiftKey?redo():undo();}
  else if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();redo();}
  else if(event.code==='Space'){spaceHeld=true;event.preventDefault();}
 });
 window.addEventListener('keyup',event=>{if(event.code==='Space')spaceHeld=false;});
 const enforceAccess=async()=>{
  try{
   const info=await access();
   if(info.user?.id!==ownerId)throw Error('Conta alterada');
   const response=await authorizedFetch('/api/studio-access');const result=await response.json();
   if(result.allowed!==true)throw Error('Acesso revogado');
  }
  catch{
   if(channel){channel.postMessage({type:'blackout'});channel.close();channel=null;}
   workspace.hidden=true;gate.hidden=false;
   gate.replaceChildren(node('h2','','Acesso ao Estúdio encerrado'),node('p','','Sua autorização não está mais disponível. Consulte a administração.'),button('Voltar ao Portal',()=>{location.href='portal.html';}));
  }
 };
 setInterval(enforceAccess,60000);
 document.addEventListener('haema:auth',enforceAccess);
 window.addEventListener('pagehide',()=>{if(channel){channel.postMessage({type:'blackout'});channel.close();}clearTimeout(saveTimer);clearTimeout(broadcastTimer);});
 new ResizeObserver(resize).observe(canvas.parentElement);
 setTool('pan');
}
let booting=false;
async function boot(){
 if(booting||initialized)return;booting=true;
 try{
  const info=await access();
  if(!info.user||(!info.admin&&!info.areas.includes('studio'))){accessGate(gate,info,'Estúdio privado');return;}
  const response=await authorizedFetch('/api/studio-access');
  const permission=await response.json();
  if(permission.allowed!==true)throw Error('Seu acesso ao Estúdio não foi autorizado.');
  ownerId=info.user.id;
  gate.hidden=true;workspace.hidden=false;
  try{const stored=await loadProject(ownerId);if(stored)scene=safeScene(stored);}catch{status('Projeto inicial carregado. Exporte JSON se o salvamento não funcionar.');}
  setup();loadBackground();resize();fit();changed(false);
 }catch(error){gate.replaceChildren(node('h2','','Estúdio indisponível'),node('p','',error.message),button('Tentar novamente',boot));}
 finally{booting=false;}
}
document.addEventListener('haema:auth',boot);
boot();
