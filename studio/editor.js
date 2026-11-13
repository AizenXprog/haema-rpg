import {access,accessGate,authorizedFetch,node,button} from '../auth.js';
import {CELL,TERRAINS,PROPS,starterScene,safeScene,tileIndex,inBounds,drawScene} from './scene.js?v=7';
import {saveProject,loadProject,saveNamedProject,loadNamedProject,listNamedProjects,deleteNamedProject,createMapId,exportJSON} from './storage.js?v=3';
import {generateScene,makeRoom,furnishRoom} from './generator.js?v=8';
import {invalidateTerrain} from './terrain-renderer.js?v=3';
import {invalidateFog} from './fog-renderer.js?v=2';
import {addStrokePoint,drawPath,simplifyPoints,makePath,nearestPath,movePath} from './path-geometry.js?v=2';
import {nearestControlPoint,moveControlPoint,insertControlPoint,removeControlPoint,drawControlHandles} from './smart-paths.js?v=1';
import {appendSurfacePoint,sanitizeSurfaceStroke,drawSurfaceStroke,invalidateSurfacePaint} from './surface-paint.js?v=1';
import {generateFromDescription,interpretDescription} from './guided-generator.js?v=3';
import {validateMapSize,createEmptyMap,resizeMapScene} from './map-size.js?v=1';
import {createFrameScheduler} from './frame-scheduler.js?v=1';
import {createRenderScheduler} from './render-scheduler.js?v=1';

const $=id=>document.getElementById(id);
const gate=$('studio-gate'),workspace=$('studio-workspace'),canvas=$('studio-canvas'),ctx=canvas.getContext('2d');
const view={x:0,y:0,zoom:1,ready:false};
let scene=starterScene(),backgroundImage=null,tool='pan',terrain='stone',prop='tree',brush=2,terrainBrushMode='organic',surfaceSoftness=.65,surfaceOpacity=1,pathWidth=1.25,roadMaterial='earth',showGrid=true,paintedTiles=new Set(),lastStamp=null;
let drawing=false,gesture=null,hover=null,spaceHeld=false,selected=null,selectedProp=null,selectedPath=null,pathPointEditing=false,measurement=null,saveTimer=0;
let ownerId=null,channel=null,projector=null,blackout=false,history=[],future=[],initialized=false,frameSequence=0;
let activeMapId=null,mapSwitching=false,saveChain=Promise.resolve();
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
// Coalesce high-frequency pointer events to one scene paint per display frame.
const canvasRender=createRenderScheduler(paintFrame);
function render(){canvasRender.request();}
function paintFrame(){
 const dpr=canvas.width/Math.max(1,canvas.clientWidth);
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
 ctx.fillStyle='#0a1012';ctx.fillRect(0,0,canvas.clientWidth,canvas.clientHeight);
 ctx.translate(view.x,view.y);ctx.scale(view.zoom,view.zoom);
 const viewport={
  x0:-view.x/view.zoom,y0:-view.y/view.zoom,
  x1:(canvas.clientWidth-view.x)/view.zoom,
  y1:(canvas.clientHeight-view.y)/view.zoom
 };
 drawScene(ctx,scene,{grid:showGrid,image:backgroundImage,viewport});
 if(gesture?.mode==='surface'&&gesture.points.length)
  drawSurfaceStroke(ctx,{material:gesture.material,radius:gesture.radius,softness:gesture.softness,
   opacity:gesture.opacity,points:gesture.points},CELL,{preview:true});
 if(tool==='select'&&selectedPath&&scene.paths?.includes(selectedPath)){
  drawPath(ctx,selectedPath,CELL,{preview:true});
  if(pathPointEditing)drawControlHandles(ctx,selectedPath,CELL,view.zoom);
 }
 if(gesture?.mode==='path'&&gesture.points.length>1)
  drawPath(ctx,{kind:gesture.kind,width:gesture.width,material:gesture.material,points:gesture.points},CELL,{preview:true});
 if(tool==='measure'){
  const line=gesture?.mode==='measure'?{x1:gesture.startX,y1:gesture.startY,x2:hover?.x??gesture.startX,y2:hover?.y??gesture.startY}:measurement;
  if(line){
   const x1=line.x1*CELL,y1=line.y1*CELL,x2=line.x2*CELL,y2=line.y2*CELL;
   const length=Math.hypot(line.x2-line.x1,line.y2-line.y1);
   ctx.save();ctx.strokeStyle='#efcf8b';ctx.lineWidth=2.5/Math.max(.2,view.zoom);ctx.setLineDash([8,5]);
   ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.setLineDash([]);
   ctx.fillStyle='#14181be6';ctx.font='600 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
   const label=length.toFixed(1)+' células',cx=(x1+x2)/2,cy=(y1+y2)/2;
   ctx.fillRect(cx-43,cy-22,86,18);ctx.fillStyle='#f2d9ac';ctx.fillText(label,cx,cy-13);
   ctx.restore();
  }
 }
 if(selectedProp&&scene.props.includes(selectedProp)&&tool==='select'){
  ctx.save();ctx.lineWidth=2.5/Math.max(.2,view.zoom);ctx.strokeStyle='#f0d3a0';ctx.setLineDash([7,4]);
  ctx.beginPath();ctx.arc(selectedProp.x*CELL,selectedProp.y*CELL,27,0,Math.PI*2);ctx.stroke();ctx.restore();
 }
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
function closestProp(p){
 let found=null,distance=.72;
 // Reverse order follows draw order, so the foremost object is selected first.
 for(let i=scene.props.length-1;i>=0;i--){
  const candidate=scene.props[i];
  const d=Math.hypot(candidate.x-p.x,candidate.y-p.y);
  if(d<distance){found=candidate;distance=d;}
 }
 return found;
}
function refreshSelection(){
 if(selectedProp&&!scene.props.includes(selectedProp))selectedProp=null;
 if(selectedPath&&!scene.paths?.includes(selectedPath))selectedPath=null;
 $('selected-prop-controls').hidden=!!selectedPath;
 $('selected-path-controls').hidden=!selectedPath;
 $('selected-path-duplicate').disabled=!selectedPath;
 $('selected-path-delete').disabled=!selectedPath;
 $('selected-path-edit-points').disabled=!selectedPath;
 $('selected-path-smooth').disabled=!selectedPath;
 $('selected-path-edit-points').setAttribute('aria-pressed',String(!!selectedPath&&pathPointEditing));
 $('selected-path-help').textContent=pathPointEditing&&selectedPath?'Arraste os pontos. Duplo clique na curva adiciona um ponto. Alt+clique remove.':'Arraste o traçado para movê-lo. Ative Editar pontos para remodelar o caminho.';
 $('selected-path-bridge-row').hidden=!selectedPath||selectedPath.kind!=='road';
 if(selectedPath){
  $('selected-path-auto-bridge').checked=selectedPath.bridge!==false;
  $('selected-path-label').textContent=selectedPath.kind==='river'?'Rio selecionado':'Estrada selecionada';
  $('selected-path-width').value=selectedPath.width;
  $('selected-path-width-value').textContent=selectedPath.width;
 }
 if(selected&&!scene.tokens.includes(selected))selected=null;
 const valid=!!selectedProp;
 for(const id of ['selected-rotate-left','selected-rotate-right','selected-duplicate','selected-delete'])$(id).disabled=!valid;
 const label=valid?(document.querySelector('[data-prop="'+selectedProp.type+'"]')?.textContent?.trim()||selectedProp.type):
  selected?'Token '+(selected.label||''): 'Nenhum objeto selecionado';
 $('selected-object-label').textContent=label;
 $('selected-object-hint').textContent=valid?'Arraste para mover. Use os controles para girar, duplicar ou excluir.':
  selected?'Para editar este token, abra a aba Mesa.':'Selecione um móvel ou elemento do mapa para editar.';
 $('token-visibility').disabled=!selected;
 $('token-visibility').checked=selected?!!selected.hidden:false;
}

function activeMapKey(){return 'haema:studio:active:'+ownerId;}
function rememberActive(){
 if(!ownerId||!activeMapId)return;
 try{localStorage.setItem(activeMapKey(),activeMapId);}catch{}
}
async function persistCurrent(){
 if(!ownerId)return;
 const captured=JSON.parse(JSON.stringify(scene)),owner=ownerId,mapId=activeMapId;
 const task=saveChain.then(async()=>{
  if(mapId)await saveNamedProject(captured,owner,mapId);
  // Retain the original owner-scoped snapshot for older versions and recovery.
  if(mapId===activeMapId)await saveProject(captured,owner);
 });
 saveChain=task.catch(()=>{});await task;
}
async function refreshMapLibrary(){
 const host=$('local-map-browser');if(!host||!ownerId)return;
 const maps=await listNamedProjects(ownerId);
 const nodes=[];
 for(const item of maps){
  const button=document.createElement('button');button.type='button';
  button.className='studio-map-entry';button.dataset.mapId=item.mapId;
  button.setAttribute('role','listitem');button.setAttribute('aria-current',String(item.mapId===activeMapId));
  const title=document.createElement('strong');title.textContent=item.name;
  const details=document.createElement('small');
  const date=item.savedAt?new Date(item.savedAt).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):'Sem data';
  details.textContent=item.cols+' × '+item.rows+' células · '+date;
  button.append(title,details);
  if(item.mapId===activeMapId){const marker=document.createElement('em');marker.textContent='ABERTO';button.append(marker);}
  button.addEventListener('click',()=>{void openMapDocument(item.mapId);});
  nodes.push(button);
 }
 if(!nodes.length){const empty=document.createElement('p');empty.className='studio-panel-hint';empty.textContent='Nenhum mapa salvo neste navegador.';nodes.push(empty);}
 host.replaceChildren(...nodes);
}
async function openMapDocument(id){
 if(mapSwitching||id===activeMapId)return;
 mapSwitching=true;clearTimeout(saveTimer);
 try{
  await persistCurrent();
  const stored=await loadNamedProject(ownerId,id);
  if(!stored)throw Error('Mapa não encontrado neste navegador.');
  scene=safeScene(stored);activeMapId=id;rememberActive();syncMapSizeControls();
  history=[];future=[];clearSelection();loadBackground();fit();changed(false);
  await refreshMapLibrary();
  $('local-map-message').textContent='Mapa aberto: '+scene.name;
  status('Mapa aberto: '+scene.name);
 }catch(error){status(error.message||'Erro ao abrir mapa.');}
 finally{mapSwitching=false;}
}
function selectedMapSize(){return validateMapSize($('map-width').value,$('map-height').value);}
function syncMapSizeControls(){
 $('map-width').value=scene.cols;$('map-height').value=scene.rows;
 const value=scene.cols+'x'+scene.rows;
 $('map-size-preset').value=Array.from($('map-size-preset').options).some(o=>o.value===value)?value:'custom';
}
function blankMap(name,cols,rows){return createEmptyMap(starterScene(),cols,rows,name);}
function resizeCurrentMap(){
 if(mapSwitching||!ownerId)return;
 try{
  const {cols,rows}=selectedMapSize();
  if(cols===scene.cols&&rows===scene.rows)return status('O mapa já possui essas dimensões.');
  const result=resizeMapScene(scene,cols,rows);
  if(result.cropped){
   const losses=Object.entries(result.removed).filter(([,n])=>n>0).map(([k,n])=>k+': '+n).join(', ');
   if(!confirm('Reduzir o mapa pode descartar conteúdo fora das bordas ('+(losses||'áreas excedentes')+'). Exporte JSON antes. Continuar?'))return;
  }
  snapshot();scene=safeScene(result.scene);clearSelection();loadBackground();fit();changed();
  syncMapSizeControls();
  status('Mapa agora tem '+cols+' × '+rows+' células. '+(result.cropped?'Confira o recorte.':'Novas áreas ficam ocultas para jogadores.'));
 }catch(error){status(error.message||'Dimensões inválidas.');}
}
async function createLocalMap({duplicate=false}={}){
 if(mapSwitching)return;mapSwitching=true;clearTimeout(saveTimer);
 try{
  const answer=prompt(duplicate?'Nome da cópia:':'Nome do novo mapa:',duplicate?scene.name+' — cópia':'Novo mapa');
  if(answer===null){saveLater();return;}
  const name=answer.trim().slice(0,80)||'Mapa sem título';
  await persistCurrent();
  const size=duplicate?null:selectedMapSize();
  const next=duplicate?safeScene({...scene,name}):blankMap(name,size.cols,size.rows);
  const nextId=createMapId();
  await saveNamedProject(next,ownerId,nextId);
  scene=next;activeMapId=nextId;rememberActive();syncMapSizeControls();
  history=[];future=[];clearSelection();loadBackground();fit();changed(false);
  await refreshMapLibrary();
  showInspectorTab('project');
  status(duplicate?'Cópia criada: '+name:'Novo mapa criado: '+name);
 }catch(error){status('Não foi possível criar o mapa: '+error.message);}
 finally{mapSwitching=false;}
}
async function deleteCurrentMap(){
 if(mapSwitching||!activeMapId)return;
 mapSwitching=true;clearTimeout(saveTimer);
 try{
  const maps=await listNamedProjects(ownerId);
  if(maps.length<=1){saveLater();status('Mantenha pelo menos um mapa salvo.');return;}
  if(!confirm('Excluir somente o mapa "'+scene.name+'" deste navegador? Exporte JSON antes, se quiser um backup.')){saveLater();return;}
  const oldId=activeMapId;
  const next=maps.find(m=>m.mapId!==oldId);
  const restored=await loadNamedProject(ownerId,next.mapId);
  if(!restored)throw Error('Outro mapa salvo não foi encontrado.');
  // Prevent a queued older write from resurrecting a deleted map.
  await saveChain;
  await deleteNamedProject(ownerId,oldId);
  activeMapId=next.mapId;scene=safeScene(restored);rememberActive();syncMapSizeControls();
  history=[];future=[];clearSelection();loadBackground();fit();changed(false);
  await persistCurrent();
  await refreshMapLibrary();
  status('Mapa excluído somente deste navegador.');
 }catch(error){status('Não foi possível excluir: '+error.message);}
 finally{mapSwitching=false;}
}
function saveLater(){
 clearTimeout(saveTimer);
 saveTimer=setTimeout(async()=>{
  try{await persistCurrent();status('Mapa salvo neste navegador.');}
  catch{status('Salvamento local indisponível. Exporte o projeto em JSON.');}
 },400);
}
// History stores the large background image by reference, not on every brush stroke.
const freezeScene=()=>({shape:JSON.stringify({...scene,background:null}),background:scene.background});
const thawScene=entry=>safeScene({...JSON.parse(entry.shape),background:entry.background});
function clearSelection(){selected=null;selectedProp=null;selectedPath=null;pathPointEditing=false;refreshSelection();}
function snapshot(){
 history.push(freezeScene());if(history.length>40)history.shift();future.length=0;
}
function undo(){
 if(!history.length)return;future.push(freezeScene());scene=thawScene(history.pop());syncMapSizeControls();clearSelection();loadBackground();changed();
}
function redo(){
 if(!future.length)return;history.push(freezeScene());scene=thawScene(future.pop());syncMapSizeControls();clearSelection();loadBackground();changed();
}
function changed(autosave=true){
 showGrid=scene.gridVisible!==false;$('grid-toggle').checked=showGrid;$('grid-state').textContent=showGrid?'Visível':'Oculta';
 $('scene-name').value=scene.name;
 $('atmosphere-preset').value=scene.atmosphere?.preset||'day';
 $('atmosphere-strength').value=Math.round((scene.atmosphere?.strength??1)*100);
 $('atmosphere-strength-value').textContent=$('atmosphere-strength').value+'%';
 $('studio-token-count').textContent=scene.tokens.length;
 refreshSelection();
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
  const x0=cx-brush,y0=cy-brush,x1=cx+brush+1,y1=cy+brush+1;
  if(['terrain','raise','lower','erase'].includes(tool))invalidateTerrain(scene,x0,y0,x1,y1,CELL);
  else if(['reveal','conceal'].includes(tool))invalidateFog(scene,x0,y0,x1,y1,CELL);
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
function paintLine(from,to,redraw=true){
 if(!from){paint(to,redraw);return;}
 // Sub-cell spacing allows fast cursor motion to leave no gaps.
 const distance=Math.hypot(to.x-from.x,to.y-from.y);
 const steps=Math.max(1,Math.ceil(distance/.15));
 for(let k=1;k<=steps;k++){
  const t=k/steps;
  paint({x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t},false);
 }
 if(redraw)changed(false);
}
// Only relevant controls remain visible. The map remains the primary workspace.
const toolInfo={
 pan:['Navegação','Mover a câmera pelo mapa.'],
 select:['Seleção','Selecione e arraste tokens.'],
 terrain:['Materiais','Pinte livremente sem quadrados ou use a pintura por células lógicas.'],
 road:['Estrada','Desenhe trilhas e caminhos contínuos.'],
 river:['Rio','Desenhe rios sinuosos com bordas naturais.'],
 raise:['Elevação','Crie camadas de relevo.'],
 lower:['Rebaixar','Reduza os níveis de terreno.'],
 prop:['Objetos','Escolha elementos para o cenário.'],
 wall:['Paredes','Trace paredes livres.'],
 room:['Cômodos','Desenhe ambientes internos.'],
 scatter:['Vegetação','Distribua árvores ao arrastar.'],
 generate:['Geração','Crie uma base procedural editável.'],
 token:['Tokens','Posicione personagens e criaturas.'],
 measure:['Régua','Arraste entre dois pontos para medir em células.'],
 reveal:['Revelar','Abra áreas aos jogadores.'],
 conceal:['Ocultar','Cubra áreas com neblina.'],
 erase:['Borracha','Remova elementos selecionados.']
};
let activeInspector='build';
function showInspectorTab(name){
 if(!['build','mesa','project'].includes(name))return;
 activeInspector=name;
 for(const tab of document.querySelectorAll('[data-inspector-tab]')){
  const on=tab.dataset.inspectorTab===name;
  tab.setAttribute('aria-selected',String(on));tab.tabIndex=on?0:-1;
 }
 for(const nameOfPanel of ['build','mesa','project']){
  const panel=$('inspector-'+nameOfPanel);
  panel.hidden=nameOfPanel!==name;
 }
}
function showToolOptions(next){
 const context=({select:'select',road:'path',river:'path',terrain:'terrain',raise:'elevation',lower:'elevation',prop:'prop',wall:'wall',room:'room',scatter:'scatter',generate:'generation',measure:'measure',erase:'erase'})[next]||'default';
 document.querySelectorAll('[data-tool-panel]').forEach(panel=>{panel.hidden=panel.dataset.toolPanel!==context;});
 $('studio-inspector-title').textContent=toolInfo[next]?.[0]||'Construção';
 $('studio-inspector-subtitle').textContent=context==='default'?'ESCOLHA UMA FERRAMENTA':'PROPRIEDADES DA FERRAMENTA';
 $('road-material-container').hidden=next==='river';
}
function setTool(next){
 if(!toolInfo[next])return;
 tool=next;
 if(tool!=='measure')measurement=null;
 for(const b of document.querySelectorAll('[data-tool]'))b.setAttribute('aria-pressed',String(b.dataset.tool===tool));
 canvas.style.cursor=['pan','generate'].includes(tool)?'grab':tool==='select'?'default':'crosshair';
 $('studio-tool').textContent=toolInfo[tool][0];
 $('studio-active-help').textContent=toolInfo[tool][1];
 showToolOptions(tool);
 if(['token','reveal','conceal','measure'].includes(tool))showInspectorTab('mesa');
 else if(!['pan','select'].includes(tool))showInspectorTab('build');
 render();
}
canvas.addEventListener('pointerdown',event=>{
 if(event.button!==0&&event.button!==1)return;
 const p=point(event);hover=p;
 if(tool==='pan'||tool==='generate'||spaceHeld||event.button===1){
  gesture={mode:'pan',px:p.px,py:p.py,x:view.x,y:view.y};
 }else if(tool==='measure'){
  measurement=null;gesture={mode:'measure',startX:p.x,startY:p.y};
 }else if(tool==='select'){
  const nodeIndex=pathPointEditing&&selectedPath?
   nearestControlPoint(selectedPath,p,Math.min(.68,Math.max(.19,10/(CELL*view.zoom)))):-1;
  if(nodeIndex>=0){
   if(event.altKey){
    if(selectedPath.points.length>2){snapshot();removeControlPoint(selectedPath,nodeIndex);changed();status('Ponto removido.');}
    return;
   }
   snapshot();gesture={mode:'path-point',path:selectedPath,index:nodeIndex};
  }else{
   selected=closestToken(p);
   selectedProp=selected?null:closestProp(p);
   selectedPath=(selected||selectedProp)?null:nearestPath(scene.paths||[],p);
   if(selected){snapshot();gesture={mode:'drag',token:selected};}
   else if(selectedProp){snapshot();gesture={mode:'prop-drag',prop:selectedProp};showInspectorTab('build');}
   else if(selectedPath){
    snapshot();gesture={mode:'path-drag',path:selectedPath,startX:p.x,startY:p.y,original:selectedPath.points.map(pt=>({...pt}))};
    showInspectorTab('build');
   }else gesture={mode:'noop'};
  }
  refreshSelection();
 }else if(tool==='terrain'&&terrainBrushMode==='organic'){
  if(!within(p))return;
  if((scene.surfaceStrokes||[]).length>=180)return status('Limite de pintura orgânica atingido. Exporte o mapa antes de limpar traços.');
  snapshot();
  gesture={mode:'surface',material:terrain,radius:brush,softness:surfaceSoftness,
   opacity:surfaceOpacity,points:[]};
  appendSurfacePoint(gesture.points,{x:p.x,y:p.y},{spacing:.18});
 }else if(tool==='road'||tool==='river'){
  if(!within(p))return;
  gesture={mode:'path',kind:tool,width:pathWidth,material:roadMaterial,points:[]};
  addStrokePoint(gesture.points,{x:p.x,y:p.y});
 }else if(tool==='wall'){
  snapshot();gesture={mode:'wall',startX:round(p.x),startY:round(p.y)};
 }else if(tool==='room'){
  snapshot();gesture={mode:'room',startX:p.x,startY:p.y};
 }else{
  if(!within(p))return;
  snapshot();paintedTiles.clear();lastStamp=null;
  // Tokens and single props are stamps; terrain/fog/eraser/vegetation are continuous strokes.
  if(tool==='token'||tool==='prop'){gesture={mode:'stamp'};paint(p);}
  else{gesture={mode:'paint',previous:p};paint(p);}
 }
 drawing=true;canvas.setPointerCapture(event.pointerId);render();
});
canvas.addEventListener('pointermove',event=>{
 const p=point(event);hover=p;
 if(drawing&&gesture?.mode==='pan'){view.x=gesture.x+p.px-gesture.px;view.y=gesture.y+p.py-gesture.py;}
 else if(drawing&&gesture?.mode==='drag'&&within(p)){gesture.token.x=clamp(p.x,.5,scene.cols-.5);gesture.token.y=clamp(p.y,.5,scene.rows-.5);changed(false);}
 else if(drawing&&gesture?.mode==='prop-drag'&&within(p)){gesture.prop.x=clamp(p.x,0,scene.cols);gesture.prop.y=clamp(p.y,0,scene.rows);changed(false);}
 else if(drawing&&gesture?.mode==='path-drag'){
  movePath(gesture.path,gesture.original,p.x-gesture.startX,p.y-gesture.startY,scene.cols,scene.rows);
  changed(false);
 }else if(drawing&&gesture?.mode==='path-point'){
  moveControlPoint(gesture.path,gesture.index,p,scene.cols,scene.rows);changed(false);
 }else if(drawing&&gesture?.mode==='path'){
  addStrokePoint(gesture.points,{x:clamp(p.x,0,scene.cols),y:clamp(p.y,0,scene.rows)});
 }else if(drawing&&gesture?.mode==='surface'){
  const samples=typeof event.getCoalescedEvents==='function'?event.getCoalescedEvents():[event];
  for(const sample of samples){
   const pointSample=point(sample);
   appendSurfacePoint(gesture.points,{x:clamp(pointSample.x,0,scene.cols),y:clamp(pointSample.y,0,scene.rows)},{spacing:.19,max:450});
  }
  appendSurfacePoint(gesture.points,{x:clamp(p.x,0,scene.cols),y:clamp(p.y,0,scene.rows)},{spacing:.19,max:450});
  render();return;
 }
 else if(drawing&&gesture?.mode==='paint'){
  const samples=typeof event.getCoalescedEvents==='function'?event.getCoalescedEvents():[event];
  for(const sample of samples){
   const q=point(sample);
   paintLine(gesture.previous,q,false);
   gesture.previous=q;
  }
  // Always include the current dispatched pointer sample.
  if(samples[samples.length-1]!==event){paintLine(gesture.previous,p,false);gesture.previous=p;}
  changed(false);
  return;
 }
 render();
});
function release(event){
 if(!drawing)return;
 const p=point(event);
 if(gesture?.mode==='surface'){
  const end={x:clamp(p.x,0,scene.cols),y:clamp(p.y,0,scene.rows)};
  appendSurfacePoint(gesture.points,end,{spacing:.03,max:450});
  const stroke=sanitizeSurfaceStroke({...gesture},scene.cols,scene.rows);
  if(stroke){
   scene.surfaceStrokes=scene.surfaceStrokes||[];
   scene.surfaceStrokes.push(stroke);invalidateSurfacePaint(scene);changed();
   status('Pincelada orgânica criada. A pintura foi salva como geometria editável.');
  }
 }
 if(gesture?.mode==='paint')paintLine(gesture.previous,p,false);
 if(gesture?.mode==='path'){
  addStrokePoint(gesture.points,{x:clamp(p.x,0,scene.cols),y:clamp(p.y,0,scene.rows)},{spacing:.03});
  const points=simplifyPoints(gesture.points,.075);
  if(points.length>=2&&Math.hypot(points[0].x-points[points.length-1].x,points[0].y-points[points.length-1].y)>.25){
   if((scene.paths||[]).length>=90)status('Limite de 90 caminhos e rios nesta versão.');
   else{
    try{
     const path=makePath(gesture.kind,points,{width:gesture.width,material:gesture.material,cols:scene.cols,rows:scene.rows});
     snapshot();scene.paths=scene.paths||[];scene.paths.push(path);changed();
     status((gesture.kind==='river'?'Rio':'Estrada')+' criado. Use Selecionar para editar o traçado.');
    }catch(error){status(error.message);}
   }
  }
 }
 if(gesture?.mode==='measure'){
  measurement={x1:gesture.startX,y1:gesture.startY,x2:p.x,y2:p.y};
  status('Distância: '+Math.hypot(p.x-gesture.startX,p.y-gesture.startY).toFixed(1)+' células.');
 }
 if(gesture?.mode==='wall'){
  const a=gesture,b={x:round(clamp(p.x,0,scene.cols)),y:round(clamp(p.y,0,scene.rows))};
  if(Math.hypot(a.startX-b.x,a.startY-b.y)>.15&&scene.walls.length<400)
   scene.walls.push({x1:a.startX,y1:a.startY,x2:b.x,y2:b.y});
 }
 if(gesture?.mode==='room'&&within(p)){
  const xa=Math.floor(Math.min(gesture.startX,p.x)),ya=Math.floor(Math.min(gesture.startY,p.y));
  const xb=Math.ceil(Math.max(gesture.startX,p.x)),yb=Math.ceil(Math.max(gesture.startY,p.y));
  if(xb-xa>=3&&yb-ya>=3){
   try{
    const doorChoice=$('room-door-side').value;
    const room=makeRoom(scene,{x:xa,y:ya,w:xb-xa,h:yb-ya,
     floor:terrain==='wood'||terrain==='marble'||terrain==='brick'?terrain:'wood',
     door:doorChoice==='none'?false:doorChoice});
    const placed=furnishRoom(scene,room,$('room-preset').value,scene.name);
    invalidateTerrain(scene,xa,ya,xb+1,yb+1,CELL);
    changed();status('Cômodo conectado: '+(room.door||'sem porta')+'. '+placed+' móveis posicionados.');
   }catch(error){status(error.message||'Não foi possível construir o cômodo.');}
  }else status('Arraste um cômodo com pelo menos três células de largura e altura.');
 }
 if(gesture?.mode==='paint')changed();
 if(['drag','prop-drag','path-drag','path-point','wall'].includes(gesture?.mode))changed();
 drawing=false;gesture=null;render();
 try{canvas.releasePointerCapture(event.pointerId);}catch{}
}
canvas.addEventListener('dblclick',event=>{
 if(tool!=='select'||!pathPointEditing||!selectedPath||event.button!==0)return;
 const p=point(event);
 const candidate={...selectedPath,points:selectedPath.points.map(pt=>({...pt}))};
 const index=insertControlPoint(candidate,p,scene.cols,scene.rows,
  {tolerance:Math.min(.8,Math.max(.25,12/(CELL*view.zoom)))});
 if(index>=0){snapshot();selectedPath.points=candidate.points;changed();status('Ponto inserido no traçado.');}
});
canvas.addEventListener('pointerup',release);
canvas.addEventListener('pointercancel',event=>{
 if(!drawing)return;
 drawing=false;gesture=null;changed();status('Pincel interrompido; alterações anteriores preservadas.');
 try{canvas.releasePointerCapture(event.pointerId);}catch{}
});
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
function visibleImage({maxSide=0}={}){
 const width=worldWidth(),height=worldHeight();
 const scale=maxSide>0?Math.min(1,maxSide/Math.max(width,height)):1;
 const output=document.createElement('canvas');
 output.width=Math.max(1,Math.round(width*scale));output.height=Math.max(1,Math.round(height*scale));
 const drawingContext=output.getContext('2d');
 if(scale!==1)drawingContext.scale(scale,scale);
 // Only player-visible raster is exported; never the master scene JSON or hidden tokens.
 drawScene(drawingContext,scene,{player:true,grid:showGrid,image:backgroundImage});
 return output;
}
const projectionFrames=createFrameScheduler(async stillAllowed=>{
 const target=channel;if(!target||blackout)return;
 try{
  const image=visibleImage({maxSide:2560});
  const blob=await new Promise(resolve=>image.toBlob(resolve,'image/webp',.83));
  if(blob&&blob.size<=16000000&&stillAllowed()&&channel===target&&!blackout){
   target.postMessage({type:'frame',imageBlob:blob,sequence:++frameSequence,
    width:image.width,height:image.height});
  }
 }catch{status('Não foi possível atualizar a projeção.');}
},{intervalMs:85});
function queueBroadcast(immediate=false){
 if(!channel)return;
 if(blackout){
  projectionFrames.reset();
  channel.postMessage({type:'blackout',sequence:++frameSequence});
 }else projectionFrames.request(immediate);
}
function startProjection(){
 if(!('BroadcastChannel' in window)){status('Seu navegador não oferece sincronização entre janelas.');return;}
 if(!channel){
  const token=Array.from(crypto.getRandomValues(new Uint8Array(20)),b=>b.toString(16).padStart(2,'0')).join('');
  channel=new BroadcastChannel('haema-studio-'+token);
  channel.onmessage=event=>{if(event.data?.type==='ready')queueBroadcast(true);};
  const url=new URL('../projecao.html',import.meta.url);url.hash=token;
  projector=window.open(url.href,'haema-projecao','width=1100,height=700');
 }else if(projector&&!projector.closed)projector.focus();
 else{projectionFrames.reset();channel.close();channel=null;projector=null;return startProjection();}
 if(!projector){status('O navegador bloqueou a segunda janela. Permita pop-ups para este site.');channel?.close();channel=null;return;}
 status('Janela de jogadores aberta. Mova-a para o segundo monitor e use tela cheia.');
 queueBroadcast();
}
function download(blob,name){
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function setup(){
 if(initialized)return;initialized=true;
 document.querySelectorAll('[data-inspector-tab]').forEach(el=>el.addEventListener('click',()=>showInspectorTab(el.dataset.inspectorTab)));
 const tabs=[...document.querySelectorAll('[data-inspector-tab]')];
 for(const tab of tabs)tab.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();
  const index=tabs.indexOf(tab);
  const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
  showInspectorTab(tabs[next].dataset.inspectorTab);tabs[next].focus();
 });
 document.querySelectorAll('[data-tool]').forEach(el=>{el.title=toolInfo[el.dataset.tool]?.[1]||'';el.addEventListener('click',()=>setTool(el.dataset.tool));});
 document.querySelectorAll('[data-terrain]').forEach(el=>el.addEventListener('click',()=>{terrain=el.dataset.terrain;setTool('terrain');document.querySelectorAll('[data-terrain]').forEach(x=>x.setAttribute('aria-pressed',String(x===el)));}));
 document.querySelectorAll('[data-prop]').forEach(el=>el.addEventListener('click',()=>{prop=el.dataset.prop;setTool('prop');document.querySelectorAll('[data-prop]').forEach(x=>x.setAttribute('aria-pressed',String(x===el)));}));
 document.querySelectorAll('[data-scene-template]').forEach(el=>el.addEventListener('click',()=>{const type=el.dataset.sceneTemplate;if(!confirm('Substituir o cenário atual por um novo mapa gerado? A ação poderá ser desfeita.'))return;snapshot();scene=generateScene(type,$('seed-input').value||String(Date.now()),{cols:scene.cols,rows:scene.rows});scene.gridVisible=showGrid;syncMapSizeControls();clearSelection();loadBackground();changed();fit();status('Cenário gerado: '+scene.name); }));
 const brushInputs=['brush-size','brush-height-mirror','eraser-brush'];
 for(const id of brushInputs)$(id).addEventListener('input',event=>{
  brush=Number(event.target.value);
  for(const input of brushInputs)$(input).value=brush;
  $('brush-value').textContent=brush;
  $('height-brush-value').textContent=brush;
  $('eraser-brush-value').textContent=brush;
  render();
 });
 const normalizeLabel=text=>text.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
 $('prop-search').addEventListener('input',event=>{
  const query=normalizeLabel(event.target.value.trim());let total=0;
  for(const group of document.querySelectorAll('[data-prop-group]')){
   let shown=0;
   for(const option of group.querySelectorAll('[data-prop]')){
    const match=normalizeLabel(option.textContent).includes(query);
    option.hidden=!match;if(match)shown++;
   }
   group.hidden=shown===0;
   if(query&&shown)group.open=true;
   total+=shown;
  }
  $('prop-search-empty').hidden=total!==0;
 });

 $('path-width').addEventListener('input',event=>{
  pathWidth=Number(event.target.value);
  $('path-width-value').textContent=pathWidth;
 });
 $('road-material').addEventListener('change',event=>{roadMaterial=event.target.value;});
 $('selected-path-width').addEventListener('change',event=>{
  if(!selectedPath||!scene.paths?.includes(selectedPath))return;
  snapshot();selectedPath.width=clamp(Number(event.target.value),.5,4);changed();
 });
 $('selected-path-duplicate').addEventListener('click',()=>{
  if(!selectedPath||!scene.paths?.includes(selectedPath))return;
  if(scene.paths.length>=90)return status('Limite de 90 caminhos e rios nesta versão.');
  snapshot();
  const original=selectedPath.points.map(p=>({...p}));
  const copy={...selectedPath,id:'copy-'+(crypto.randomUUID?.()||Date.now()),points:original.map(p=>({...p}))};
  movePath(copy,original,.65,.65,scene.cols,scene.rows);
  scene.paths.push(copy);selectedPath=copy;changed();
 });
 $('selected-path-edit-points').addEventListener('click',()=>{
  if(!selectedPath)return;
  pathPointEditing=!pathPointEditing;refreshSelection();render();
 });
 $('selected-path-smooth').addEventListener('click',()=>{
  if(!selectedPath||selectedPath.points.length<3)return;
  const points=simplifyPoints(selectedPath.points,.21);
  if(points.length===selectedPath.points.length)return status('Traçado já está suave.');
  snapshot();selectedPath.points=points;changed();status('Curva simplificada sem perder as extremidades.');
 });
 $('selected-path-auto-bridge').addEventListener('change',event=>{
  if(!selectedPath||selectedPath.kind!=='road')return;
  snapshot();selectedPath.bridge=event.target.checked;changed();
 });
 $('selected-path-delete').addEventListener('click',()=>{
  if(!selectedPath||!scene.paths?.includes(selectedPath))return;
  snapshot();scene.paths=scene.paths.filter(p=>p!==selectedPath);
  selectedPath=null;changed();
 });
 $('guided-description').addEventListener('input',event=>{
  const message=$('guided-feedback'),value=event.target.value.trim();
  if(!value){message.textContent='Interpretação local por palavras-chave, sem IA e sem envio de dados.';return;}
  try{
   const plan=interpretDescription(value);
   const names={tavern:'Estalagem',dungeon:'Ruínas e salas',lake:'Lago e margens',forest:'Bosque'};
   const additions=[plan.road?'estrada':null,plan.river?'rio':null,plan.vegetation==='dense'?'vegetação densa':null,
    plan.vegetation==='none'?'sem árvores':null].filter(Boolean);
   message.textContent='Entendido: '+names[plan.base]+(additions.length?' + '+additions.join(', '):'')+'. Resultado totalmente editável.';
  }catch(error){message.textContent=error.message;}
 });
 $('guided-generate').addEventListener('click',()=>{
  const value=$('guided-description').value.trim();
  let result;
  try{result=generateFromDescription(value,$('seed-input').value.trim(),{cols:scene.cols,rows:scene.rows});}
  catch(error){$('guided-feedback').textContent=error.message;return;}
  if(!confirm('Substituir o cenário atual por esta cena guiada? Você pode desfazer ou importar seu backup.'))return;
  snapshot();
  scene=result.scene;scene.gridVisible=showGrid;syncMapSizeControls();
  clearSelection();loadBackground();fit();changed();
  status('Cena guiada criada localmente. Edite o terreno, os rios e os objetos.');
  $('guided-feedback').textContent='Cena gerada com regras locais, sem envio de dados nem IA. Tudo pode ser editado.';
 });
 $('new-room').addEventListener('click',()=>{setTool('room');status('Arraste no mapa para desenhar um cômodo; o editor cria paredes e um acesso.');});
 for(const [id,degrees] of [['selected-rotate-left',-15],['selected-rotate-right',15]]){
  $(id).addEventListener('click',()=>{
   if(!selectedProp||!scene.props.includes(selectedProp))return;
   snapshot();selectedProp.rotation=((Number(selectedProp.rotation)||0)+degrees+360)%360;changed();
  });
 }
 $('selected-duplicate').addEventListener('click',()=>{
  if(!selectedProp||!scene.props.includes(selectedProp))return;
  if(scene.props.length>=500)return status('Limite de 500 objetos nesta versão.');
  snapshot();
  const clone={...selectedProp,x:clamp(selectedProp.x+.65,0,scene.cols),y:clamp(selectedProp.y+.65,0,scene.rows)};
  scene.props.push(clone);selectedProp=clone;changed();
 });
 $('selected-delete').addEventListener('click',()=>{
  if(!selectedProp||!scene.props.includes(selectedProp))return;
  snapshot();scene.props=scene.props.filter(item=>item!==selectedProp);
  selectedProp=null;changed();
 });

 $('scene-name').addEventListener('change',event=>{snapshot();scene.name=String(event.target.value).slice(0,80)||'Sem título';changed();});
 $('grid-toggle').addEventListener('change',event=>{showGrid=event.target.checked;scene.gridVisible=showGrid;changed();});
 $('atmosphere-preset').addEventListener('change',event=>{
  snapshot();scene.atmosphere={...(scene.atmosphere||{}),preset:event.target.value};changed();
 });
 $('atmosphere-strength').addEventListener('input',event=>{
  $('atmosphere-strength-value').textContent=event.target.value+'%';
 });
 $('atmosphere-strength').addEventListener('change',event=>{
  snapshot();scene.atmosphere={...(scene.atmosphere||{}),strength:Number(event.target.value)/100};changed();
 });
 $('terrain-brush-mode').addEventListener('change',event=>{
  terrainBrushMode=event.target.value==='cells'?'cells':'organic';
  $('terrain-brush-explanation').textContent=terrainBrushMode==='organic'?
   'Camada visual livre, independente da grade. As células lógicas permanecem preservadas.':
   'Modo de compatibilidade: a pintura altera as células do terreno.';
 });
 $('terrain-softness').addEventListener('input',event=>{
  surfaceSoftness=Number(event.target.value)/100;
  $('terrain-softness-value').textContent=event.target.value+'%';
 });
 $('terrain-opacity').addEventListener('input',event=>{
  surfaceOpacity=Number(event.target.value)/100;
  $('terrain-opacity-value').textContent=event.target.value+'%';
 });
 $('surface-undo-stroke').addEventListener('click',()=>{
  if(!scene.surfaceStrokes?.length)return status('Não existem pinceladas orgânicas para remover.');
  snapshot();scene.surfaceStrokes.pop();invalidateSurfacePaint(scene);changed();
 });
 $('surface-clear-strokes').addEventListener('click',()=>{
  if(!scene.surfaceStrokes?.length)return;
  if(!confirm('Remover somente a pintura orgânica deste mapa? Você pode desfazer esta ação.'))return;
  snapshot();scene.surfaceStrokes=[];invalidateSurfacePaint(scene);changed();
 });
 $('token-visibility').addEventListener('change',event=>{if(!selected)return;snapshot();selected.hidden=event.target.checked;changed();});
 $('reveal-all').addEventListener('click',()=>{snapshot();scene.fog.fill(0);invalidateFog(scene);changed();});
 $('hide-all').addEventListener('click',()=>{snapshot();scene.fog.fill(1);invalidateFog(scene);changed();});
 $('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);
 $('fit-map').addEventListener('click',fit);
 $('open-map-library').addEventListener('click',()=>{showInspectorTab('project');void refreshMapLibrary();});
 $('map-size-preset').addEventListener('change',event=>{
  if(event.target.value==='custom')return;
  const [cols,rows]=event.target.value.split('x').map(Number);
  $('map-width').value=cols;$('map-height').value=rows;
 });
 for(const id of ['map-width','map-height'])$(id).addEventListener('input',()=>{
  const value=$('map-width').value+'x'+$('map-height').value;
  $('map-size-preset').value=Array.from($('map-size-preset').options).some(o=>o.value===value)?value:'custom';
 });
 $('resize-local-map').addEventListener('click',resizeCurrentMap);
 $('new-local-map').addEventListener('click',()=>{void createLocalMap();});
 $('duplicate-local-map').addEventListener('click',()=>{void createLocalMap({duplicate:true});});
 $('delete-local-map').addEventListener('click',()=>{void deleteCurrentMap();});
 $('save-local').addEventListener('click',async()=>{
  clearTimeout(saveTimer);
  try{await persistCurrent();await refreshMapLibrary();status('Mapa salvo neste navegador.');}
  catch{status('Não foi possível salvar. Exporte em JSON.');}
 });
 $('export-json').addEventListener('click',()=>exportJSON(scene));
 $('import-json').addEventListener('click',()=>$('import-json-input').click());
 $('import-json-input').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file||mapSwitching)return;
  mapSwitching=true;
  try{
   if(file.size>13e6)throw Error('Arquivo muito grande.');
   const restored=safeScene(JSON.parse(await file.text()));
   clearTimeout(saveTimer);await persistCurrent();
   const id=createMapId();await saveNamedProject(restored,ownerId,id);
   scene=restored;activeMapId=id;rememberActive();syncMapSizeControls();
   history=[];future=[];clearSelection();loadBackground();fit();changed(false);
   await refreshMapLibrary();showInspectorTab('project');
   status('Mapa importado e adicionado aos mapas salvos.');event.target.value='';
  }catch(error){status(error.message||'Projeto inválido.');}
  finally{mapSwitching=false;event.target.value='';}
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
   if(channel){projectionFrames.reset();channel.postMessage({type:'blackout'});channel.close();channel=null;}
   workspace.hidden=true;gate.hidden=false;
   gate.replaceChildren(node('h2','','Acesso ao Estúdio encerrado'),node('p','','Sua autorização não está mais disponível. Consulte a administração.'),button('Voltar ao Portal',()=>{location.href='portal.html';}));
  }
 };
 setInterval(enforceAccess,60000);
 document.addEventListener('haema:auth',enforceAccess);
 window.addEventListener('pagehide',()=>{canvasRender.dispose();projectionFrames.dispose();if(channel){channel.postMessage({type:'blackout'});channel.close();}clearTimeout(saveTimer);});
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
  try{
   const maps=await listNamedProjects(ownerId);
   if(maps.length){
    let preferred=null;try{preferred=localStorage.getItem(activeMapKey());}catch{}
    const chosen=maps.find(m=>m.mapId===preferred)||maps[0];
    const data=await loadNamedProject(ownerId,chosen.mapId);
    if(data){scene=safeScene(data);activeMapId=chosen.mapId;}
   }else{
    const legacy=await loadProject(ownerId);
    if(legacy)scene=safeScene(legacy);
    activeMapId=createMapId();await saveNamedProject(scene,ownerId,activeMapId);
   }
   rememberActive();
  }catch{
   try{const legacy=await loadProject(ownerId);if(legacy)scene=safeScene(legacy);}catch{}
   status('Biblioteca de mapas indisponível; exporte JSON para manter uma cópia.');
  }
  setup();syncMapSizeControls();loadBackground();resize();fit();changed(false);
  if(activeMapId)void refreshMapLibrary();
 }catch(error){gate.replaceChildren(node('h2','','Estúdio indisponível'),node('p','',error.message),button('Tentar novamente',boot));}
 finally{booting=false;}
}
document.addEventListener('haema:auth',boot);
boot();
