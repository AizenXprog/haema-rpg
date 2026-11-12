// HÆMA Estúdio — cena vetorial original. Independente do Manual e da Lore.
export const CELL=48;
export const TERRAINS={grass:'#354c3d',stone:'#6b6b62',earth:'#78604b',water:'#2c6470'};
export const PROPS=['tree','rock','torch','pillar'];
const n=(v,min,max)=>Math.min(max,Math.max(min,Number(v)||0));
export const tileIndex=(scene,x,y)=>Math.floor(y)*scene.cols+Math.floor(x);
export const inBounds=(scene,x,y)=>x>=0&&y>=0&&x<scene.cols&&y<scene.rows;
export const exposed=(scene,x,y)=>inBounds(scene,x,y)&&scene.fog[tileIndex(scene,x,y)]===0;
export function starterScene(){
 const cols=28,rows=18,tiles=[],fog=[];
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const middle=x>8&&x<19&&y>4&&y<14;
  tiles.push(middle?'stone':(Math.abs(x-14)<2||Math.abs(y-9)<2?'earth':'grass'));
  fog.push(Math.hypot(x-13,y-9)>5?1:0);
 }
 return {version:1,id:'local',name:'Ruínas do caminho',cols,rows,tiles,fog,
  walls:[{x1:8,y1:5,x2:19,y2:5},{x1:8,y1:5,x2:8,y2:14},{x1:19,y1:5,x2:19,y2:14}],
  props:[{x:4.5,y:5.5,type:'tree'},{x:23.5,y:4.5,type:'tree'},{x:5.5,y:13.5,type:'rock'},{x:10.5,y:6.5,type:'pillar'},{x:17.5,y:11.5,type:'torch'}],
  tokens:[{id:'t1',x:13.5,y:9.5,label:'A',color:'#cda379',hidden:false},{id:'t2',x:15.5,y:10.5,label:'B',color:'#809eae',hidden:false}],
  background:null};
}
const safeLabel=v=>String(v||'').slice(0,80).replace(/[<>]/g,'');
export function safeScene(value){
 if(!value||value.version!==1)throw Error('Projeto incompatível com o Estúdio 0.1.');
 const cols=n(value.cols,8,80)|0,rows=n(value.rows,8,80)|0;
 if(cols*rows>6400)throw Error('Mapa grande demais para esta versão.');
 if(!Array.isArray(value.tiles)||!Array.isArray(value.fog)||value.tiles.length!==cols*rows||value.fog.length!==cols*rows)throw Error('Dimensões inválidas.');
 const valid=(x,y)=>Number.isFinite(+x)&&Number.isFinite(+y)&&+x>=0&&+y>=0&&+x<=cols&&+y<=rows;
 const terrain=Object.keys(TERRAINS);
 const props=Array.isArray(value.props)?value.props.slice(0,500).filter(p=>p&&valid(p.x,p.y)&&PROPS.includes(p.type)).map(p=>({x:+p.x,y:+p.y,type:p.type})):[];
 const tokens=Array.isArray(value.tokens)?value.tokens.slice(0,120).filter(t=>t&&valid(t.x,t.y)).map(t=>({id:safeLabel(t.id)||crypto.randomUUID(),x:+t.x,y:+t.y,label:safeLabel(t.label),color:/^#[0-9a-f]{6}$/i.test(t.color)?t.color:'#d6ad7b',hidden:!!t.hidden})):[];
 const walls=Array.isArray(value.walls)?value.walls.slice(0,400).filter(w=>w&&valid(w.x1,w.y1)&&valid(w.x2,w.y2)).map(w=>({x1:+w.x1,y1:+w.y1,x2:+w.x2,y2:+w.y2})):[];
 const background=typeof value.background==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value.background)&&value.background.length<12e6?value.background:null;
 return {version:1,id:'local',name:safeLabel(value.name)||'Cena sem título',cols,rows,
  tiles:value.tiles.map(t=>terrain.includes(t)?t:'grass'),fog:value.fog.map(f=>f?1:0),
  props,tokens,walls,background};
}
const hash=(x,y)=>{let v=Math.imul(x+13,374761393)+Math.imul(y+17,668265263);v=Math.imul(v^(v>>>13),1274126177);return(v^(v>>>16))>>>0};
function drawProp(ctx,p){
 const x=p.x*CELL,y=p.y*CELL;
 ctx.save();ctx.translate(x,y);
 if(p.type==='tree'){
  ctx.fillStyle='#0b1714a8';ctx.beginPath();ctx.ellipse(5,11,22,12,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#49372a';ctx.fillRect(-4,-7,9,19);
  for(const [dx,dy,r,col] of [[-9,-11,15,'#314f3c'],[8,-9,16,'#426047'],[-1,-20,18,'#507451']]){
   ctx.fillStyle=col;ctx.beginPath();ctx.arc(dx,dy,r,0,Math.PI*2);ctx.fill();
  }
  ctx.strokeStyle='#9cb48633';ctx.beginPath();ctx.arc(-6,-16,16,3.6,5.5);ctx.stroke();
 }else if(p.type==='rock'||p.type==='pillar'){
  ctx.fillStyle='#1c2423aa';ctx.beginPath();ctx.ellipse(6,10,18,9,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=p.type==='rock'?'#92958c':'#aaa08a';
  ctx.beginPath();ctx.moveTo(-15,5);ctx.lineTo(-12,-10);ctx.lineTo(1,-17);ctx.lineTo(16,-7);ctx.lineTo(13,6);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#e3dac755';ctx.beginPath();ctx.moveTo(-12,-10);ctx.lineTo(1,-5);ctx.lineTo(16,-7);ctx.stroke();
 }else if(p.type==='torch'){
  const glow=ctx.createRadialGradient(0,0,1,0,0,54);glow.addColorStop(0,'#ffc87985');glow.addColorStop(1,'#ffa55000');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,54,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#42332a';ctx.fillRect(-4,-7,8,19);
  ctx.fillStyle='#f7bc5b';ctx.beginPath();ctx.ellipse(0,-8,6,10,.2,0,Math.PI*2);ctx.fill();
 }
 ctx.restore();
}
export function drawScene(ctx,scene,{player=false,grid=true,image=null}={}){
 const w=scene.cols*CELL,h=scene.rows*CELL;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#1a211e';ctx.fillRect(0,0,w,h);
 if(image?.complete&&image.naturalWidth)ctx.drawImage(image,0,0,w,h);
 else for(let y=0;y<scene.rows;y++)for(let x=0;x<scene.cols;x++){
  const type=scene.tiles[tileIndex(scene,x,y)],px=x*CELL,py=y*CELL,r=hash(x,y);
  ctx.fillStyle=TERRAINS[type]||TERRAINS.grass;ctx.fillRect(px,py,CELL,CELL);
  ctx.fillStyle=r%2?'#fff2':'#0002';
  ctx.fillRect(px+(r%25),py+((r>>>7)%32),2+(r%7),1);
  if(type==='water'){ctx.strokeStyle='#88b5ad44';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(px+8,py+15+(r%10));ctx.quadraticCurveTo(px+22,py+8+(r%10),px+40,py+18+(r%10));ctx.stroke();}
  if(type==='stone'){ctx.strokeStyle='#d9d2ba18';ctx.beginPath();ctx.moveTo(px,py+25);ctx.lineTo(px+CELL,py+25);ctx.moveTo(px+23,py);ctx.lineTo(px+23,py+25);ctx.moveTo(px+36,py+25);ctx.lineTo(px+36,py+CELL);ctx.stroke();}
 }
 for(const p of scene.props)if(!player||exposed(scene,p.x,p.y))drawProp(ctx,p);
 ctx.save();ctx.lineCap='square';ctx.lineWidth=8;ctx.strokeStyle='#262824';ctx.beginPath();
 for(const w of scene.walls)if(!player||exposed(scene,(w.x1+w.x2)/2,(w.y1+w.y2)/2)){ctx.moveTo(w.x1*CELL,w.y1*CELL);ctx.lineTo(w.x2*CELL,w.y2*CELL);}
 ctx.stroke();ctx.lineWidth=3;ctx.strokeStyle='#ac9b7c';ctx.stroke();ctx.restore();
 for(const t of scene.tokens){
  if((player&&t.hidden)||(player&&!exposed(scene,t.x,t.y)))continue;
  const x=t.x*CELL,y=t.y*CELL;ctx.fillStyle='#0008';ctx.beginPath();ctx.ellipse(x+3,y+7,15,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=t.color;ctx.beginPath();ctx.arc(x,y,16,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#f1e3bf';ctx.lineWidth=2;ctx.stroke();
  ctx.font='bold 14px Georgia';ctx.fillStyle='#1b1b1c';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText((t.label||'?').slice(0,2).toUpperCase(),x,y+1);
  if(!player&&t.hidden){ctx.strokeStyle='#df8d7e';ctx.setLineDash([3,3]);ctx.beginPath();ctx.arc(x,y,20,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
 }
 for(let y=0;y<scene.rows;y++)for(let x=0;x<scene.cols;x++)if(scene.fog[tileIndex(scene,x,y)]){
  ctx.fillStyle=player?'#0b0d11':'#080d16b3';ctx.fillRect(x*CELL,y*CELL,CELL,CELL);
 }
 if(grid){ctx.lineWidth=1;ctx.strokeStyle=player?'#b1a48a1a':'#d2c6a039';ctx.beginPath();
  for(let x=0;x<=scene.cols;x++){ctx.moveTo(x*CELL+.5,0);ctx.lineTo(x*CELL+.5,h);}
  for(let y=0;y<=scene.rows;y++){ctx.moveTo(0,y*CELL+.5);ctx.lineTo(w,y*CELL+.5);}ctx.stroke();
 }
}
