// HÆMA Estúdio — cena vetorial original. Independente do Manual e da Lore.
export const CELL=48;
export const TERRAINS={grass:'#354c3d',stone:'#6b6b62',earth:'#78604b',water:'#2c6470',sand:'#9b815a',wood:'#72503a',brick:'#775a4e',marble:'#969085'};
export const PROPS=['tree','rock','torch','pillar','bush','door','bed','table','chair','shelf','chest','rug','barrel','hearth','crate','cabinet','stairs'];
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
 return {version:1,id:'local',name:'Ruínas do caminho',cols,rows,tiles,fog,gridVisible:true,heights:Array(cols*rows).fill(0),
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
 const props=Array.isArray(value.props)?value.props.slice(0,500).filter(p=>p&&valid(p.x,p.y)&&PROPS.includes(p.type)).map(p=>({x:+p.x,y:+p.y,type:p.type,rotation:Number.isFinite(+p.rotation)?Math.max(-360,Math.min(360,+p.rotation)):0})):[];
 const tokens=Array.isArray(value.tokens)?value.tokens.slice(0,120).filter(t=>t&&valid(t.x,t.y)).map(t=>({id:safeLabel(t.id)||crypto.randomUUID(),x:+t.x,y:+t.y,label:safeLabel(t.label),color:/^#[0-9a-f]{6}$/i.test(t.color)?t.color:'#d6ad7b',hidden:!!t.hidden})):[];
 const walls=Array.isArray(value.walls)?value.walls.slice(0,400).filter(w=>w&&valid(w.x1,w.y1)&&valid(w.x2,w.y2)).map(w=>({x1:+w.x1,y1:+w.y1,x2:+w.x2,y2:+w.y2})):[];
 const background=typeof value.background==='string'&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value.background)&&value.background.length<12e6?value.background:null;
 return {version:1,id:'local',name:safeLabel(value.name)||'Cena sem título',cols,rows,gridVisible:value.gridVisible!==false,
  tiles:value.tiles.map(t=>terrain.includes(t)?t:'grass'),fog:value.fog.map(f=>f?1:0),heights:Array.isArray(value.heights)&&value.heights.length===cols*rows?value.heights.map(h=>Math.min(4,Math.max(0,Math.round(Number(h)||0)))):Array(cols*rows).fill(0),
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

 }else if(p.type==='bush'){
  ctx.fillStyle='#162c22a8';ctx.beginPath();ctx.ellipse(3,5,18,13,0,0,Math.PI*2);ctx.fill();
  for(const [dx,dy,r,c] of [[-10,1,10,'#365d3f'],[7,1,11,'#4d7650'],[-1,-7,12,'#658c59']]){
   ctx.fillStyle=c;ctx.beginPath();ctx.arc(dx,dy,r,0,Math.PI*2);ctx.fill();
  }
 }else if(['bed','table','chair','shelf','chest','rug','barrel','hearth','crate','cabinet','stairs','door'].includes(p.type)){
  ctx.rotate((Number(p.rotation)||0)*Math.PI/180);
  const rounded=(w,h,r=4)=>{ctx.beginPath();ctx.roundRect(-w/2,-h/2,w,h,r);};
  if(p.type==='rug'){
   ctx.fillStyle='#a45f45';rounded(47,35,6);ctx.fill();ctx.strokeStyle='#e6c48e';ctx.lineWidth=3;ctx.stroke();
   ctx.strokeStyle='#724034';ctx.lineWidth=1;ctx.strokeRect(-19,-12,38,24);ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.stroke();
  }else if(p.type==='door'){
   ctx.fillStyle='#24160fb0';ctx.fillRect(-22,-5,44,10);ctx.fillStyle='#ad7b50';rounded(37,8,1);ctx.fill();
   ctx.strokeStyle='#e2c397';ctx.lineWidth=2;ctx.strokeRect(-14,-3,28,6);
  }else if(p.type==='bed'){
   ctx.fillStyle='#170e0b9e';rounded(34,48,3);ctx.fill();
   ctx.fillStyle='#715039';rounded(30,45,3);ctx.fill();ctx.fillStyle='#c4a17f';ctx.fillRect(-12,-14,24,11);
   ctx.fillStyle='#794b4b';ctx.fillRect(-13,-1,26,18);ctx.strokeStyle='#d7b58b';ctx.strokeRect(-13,-1,26,18);
  }else if(p.type==='table'){
   ctx.fillStyle='#1b140e88';rounded(41,31,4);ctx.fill();ctx.fillStyle='#83593a';rounded(38,29,4);ctx.fill();
   ctx.strokeStyle='#d5b18466';ctx.lineWidth=2;ctx.stroke();ctx.strokeStyle='#4c3226';ctx.beginPath();ctx.moveTo(-8,-14);ctx.lineTo(-8,14);ctx.moveTo(8,-14);ctx.lineTo(8,14);ctx.stroke();
  }else if(p.type==='chair'){
   ctx.fillStyle='#835d40';rounded(20,19,3);ctx.fill();ctx.strokeStyle='#36271e';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-10,-11);ctx.lineTo(10,-11);ctx.stroke();
  }else if(p.type==='shelf'||p.type==='cabinet'){
   ctx.fillStyle='#382417';rounded(42,19,3);ctx.fill();ctx.fillStyle='#885b3b';rounded(40,16,2);ctx.fill();
   for(let i=-13;i<=13;i+=7){ctx.fillStyle=i%2?'#d6bd8d':'#704936';ctx.fillRect(i,-5,5,10);}
   ctx.strokeStyle='#d7b17a66';ctx.strokeRect(-20,-8,40,16);
  }else if(p.type==='chest'||p.type==='crate'){
   ctx.fillStyle='#60442d';rounded(28,22,3);ctx.fill();ctx.strokeStyle='#d8ba7d';ctx.lineWidth=2.5;ctx.stroke();
   ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(14,0);ctx.moveTo(0,-10);ctx.lineTo(0,10);ctx.stroke();
  }else if(p.type==='barrel'){
   ctx.fillStyle='#62482e';ctx.beginPath();ctx.ellipse(0,0,12,16,0,0,Math.PI*2);ctx.fill();
   ctx.strokeStyle='#d2ac76';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,9,13,0,0,Math.PI*2);ctx.stroke();
   ctx.strokeStyle='#2c241c';ctx.beginPath();ctx.moveTo(-8,-5);ctx.lineTo(8,-5);ctx.moveTo(-8,5);ctx.lineTo(8,5);ctx.stroke();
  }else if(p.type==='hearth'){
   ctx.fillStyle='#3b3530';rounded(37,31,5);ctx.fill();ctx.strokeStyle='#9d9482';ctx.lineWidth=3;ctx.stroke();
   const glow=ctx.createRadialGradient(0,0,1,0,0,55);glow.addColorStop(0,'#ffbf5d91');glow.addColorStop(1,'#ff8c2600');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,55,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#dc883b';ctx.beginPath();ctx.ellipse(0,1,9,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffd37b';ctx.beginPath();ctx.ellipse(2,1,4,8,0,0,Math.PI*2);ctx.fill();
  }else if(p.type==='stairs'){
   ctx.fillStyle='#8d7b69';rounded(42,44,3);ctx.fill();ctx.strokeStyle='#4c4036';ctx.lineWidth=3;
   for(let y=-16;y<=17;y+=8){ctx.beginPath();ctx.moveTo(-20,y);ctx.lineTo(20,y);ctx.stroke();}
  }
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
  if(type==='stone'||type==='brick'||type==='marble'){
   ctx.strokeStyle=type==='marble'?'#ede2c239':'#d9d2ba21';ctx.lineWidth=1.3;ctx.beginPath();
   ctx.moveTo(px,py+24);ctx.lineTo(px+CELL,py+24);ctx.moveTo(px+((r%18)+14),py);ctx.lineTo(px+((r%18)+14),py+24);
   ctx.moveTo(px+((r%20)+10),py+24);ctx.lineTo(px+((r%20)+10),py+CELL);ctx.stroke();
  }
  if(type==='wood'){
   ctx.strokeStyle='#d4a97a43';ctx.lineWidth=1.1;ctx.beginPath();
   for(let yy=0;yy<=CELL;yy+=12){ctx.moveTo(px,py+yy);ctx.lineTo(px+CELL,py+yy);}
   ctx.moveTo(px+22,py);ctx.lineTo(px+22,py+24);ctx.moveTo(px+35,py+24);ctx.lineTo(px+35,py+CELL);ctx.stroke();
  }
  if(type==='grass'){
   ctx.strokeStyle='#91af6440';ctx.lineWidth=1;
   for(let i=0;i<3;i++){const gx=px+6+((r>>i*5)%34),gy=py+7+((r>>i*7)%32);ctx.beginPath();ctx.moveTo(gx-3,gy+3);ctx.lineTo(gx,gy-3);ctx.lineTo(gx+2,gy+3);ctx.stroke();}
  }
  if(type==='sand'||type==='earth'){
   ctx.fillStyle='#f1d5ab23';for(let i=0;i<4;i++){const gx=px+((r>>i*4)%47),gy=py+((r>>i*6)%47);ctx.fillRect(gx,gy,2,1);}
  }
 }
 // Blend terrain boundaries: irregular soft edges instead of flat tile seams.
 if(!image?.complete||!image.naturalWidth)for(let y=0;y<scene.rows;y++)for(let x=0;x<scene.cols;x++){
  const i=tileIndex(scene,x,y),type=scene.tiles[i],px=x*CELL,py=y*CELL,r=hash(x,y);
  const faded=(horizontal,colA,colB)=>{
   const grad=ctx.createLinearGradient(horizontal?px+CELL-11:px,horizontal?py:py+CELL-11,horizontal?px+CELL+11:px,horizontal?py:py+CELL+11);
   grad.addColorStop(0,colA);grad.addColorStop(1,colB);return grad;
  };
  if(x+1<scene.cols&&type!==scene.tiles[i+1]){ctx.fillStyle=faded(true,TERRAINS[type],TERRAINS[scene.tiles[i+1]]);ctx.fillRect(px+CELL-11,py,22,CELL);
   ctx.fillStyle=TERRAINS[type];ctx.beginPath();ctx.ellipse(px+CELL-5,py+9+(r%24),6,12,0,0,Math.PI*2);ctx.fill();}
  if(y+1<scene.rows&&type!==scene.tiles[i+scene.cols]){ctx.fillStyle=faded(false,TERRAINS[type],TERRAINS[scene.tiles[i+scene.cols]]);ctx.fillRect(px,py+CELL-11,CELL,22);}
  if(type==='water'&&(x===0||scene.tiles[i-1]!=='water'||y===0||scene.tiles[i-scene.cols]!=='water')){
   ctx.strokeStyle='#b9dbcd61';ctx.lineWidth=2.2;ctx.beginPath();
   if(x===0||scene.tiles[i-1]!=='water'){ctx.moveTo(px+2,py);ctx.quadraticCurveTo(px+5+r%4,py+24,px+2,py+CELL);}
   if(y===0||scene.tiles[i-scene.cols]!=='water'){ctx.moveTo(px,py+2);ctx.quadraticCurveTo(px+CELL/2,py+5+r%4,px+CELL,py+2);}
   ctx.stroke();
  }
 }
 // Height painting creates stacked contours and a shaded cliff edge in the 2D scene.
 if(Array.isArray(scene.heights))for(let y=0;y<scene.rows;y++)for(let x=0;x<scene.cols;x++){
  const idx=tileIndex(scene,x,y),level=scene.heights[idx]||0;if(!level)continue;
  const px=x*CELL,py=y*CELL;
  ctx.fillStyle='rgba(213,196,155,'+(level*.035)+')';ctx.fillRect(px,py,CELL,CELL);
  for(const [dx,dy,edge] of [[-1,0,'left'],[0,-1,'top'],[1,0,'right'],[0,1,'bottom']]){
   const neighbor=x+dx<0||x+dx>=scene.cols||y+dy<0||y+dy>=scene.rows?0:scene.heights[tileIndex(scene,x+dx,y+dy)]||0;
   const diff=level-neighbor;if(diff<=0)continue;
   ctx.lineWidth=Math.min(13,3.5*diff);
   ctx.strokeStyle=dx===1||dy===1?'#181811b3':'#f0dfb172';
   ctx.beginPath();
   if(edge==='left'||edge==='right'){const ex=px+(dx===1?CELL-2:2);ctx.moveTo(ex,py);ctx.lineTo(ex,py+CELL);}
   else{const ey=py+(dy===1?CELL-2:2);ctx.moveTo(px,ey);ctx.lineTo(px+CELL,ey);}
   ctx.stroke();
  }
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
