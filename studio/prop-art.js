// HÆMA Estúdio 0.4 — procedurally illustrated top-down props, independent of paid art packs.
// Stable per-object seeded variations: no animation jitter or repeated identical tree crowns.
const TAU=Math.PI*2;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function hash(x,y,type){
 let n=Math.imul(Math.round(x*67)+431,374761393)^Math.imul(Math.round(y*73)+1337,668265263);
 for(let i=0;i<type.length;i++)n=Math.imul(n^type.charCodeAt(i),16777619);
 return (n^(n>>>16))>>>0;
}
function rng(seed){let state=seed>>>0;return()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};}
function blob(ctx,x,y,rx,ry,color,rotate=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(rotate);
 ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.fillStyle=color;ctx.fill();ctx.restore();
}
function stroke(ctx,x1,y1,x2,y2,color,width=1){
 ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
}
function wood(ctx,x,y,w,h,color='#816047'){
 ctx.fillStyle='#1e211ac9';ctx.fillRect(x+3,y+4,w,h);
 ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
 ctx.strokeStyle='#301f1d';ctx.lineWidth=1.4;ctx.strokeRect(x+.5,y+.5,w-1,h-1);
 for(let i=0;i<4;i++){const yy=y+3+i*(h-6)/4;stroke(ctx,x+3,yy,x+w-3,yy,'#d9b17d38',.8);}
}
function foliage(ctx,rand,radius,bush=false){
 const palettes=[
  ['#1c302a','#254b36','#386344','#527956','#759265'],
  ['#21362f','#2d5443','#44735a','#60856e','#8ea58a'],
  ['#252b26','#3e5235','#657545','#8b9660','#b6a976'],
  ['#293e37','#355946','#56715a','#7b9974','#9fba8c']
 ];
 const palette=palettes[Math.floor(rand()*palettes.length)];
 ctx.save();
 const stretchX=.9+rand()*.23,stretchY=.92+rand()*.23;
 ctx.scale(stretchX,stretchY);
 blob(ctx,4,8,radius*1.03,radius*.85,'#060f0c8d',rand()*.2-.1);
 for(let layer=0;layer<3;layer++){
  const count=layer===0?13:layer===1?12:10;
  const orbit=radius*(layer===0?.64:layer===1?.4:.24);
  for(let i=0;i<count;i++){
   const a=(i/count)*TAU+rand()*.5+layer*.32;
   const d=orbit*(.63+rand()*.75);
   const x=Math.cos(a)*d+(rand()-.5)*4,y=Math.sin(a)*d+(rand()-.5)*4-(layer===2?5:0);
   const size=radius*(layer===0?.25:layer===1?.3:.22)*(0.75+rand()*.55);
   const col=palette[Math.min(4,layer+Math.floor(rand()*2))];
   blob(ctx,x+1.3,y+2,size*1.07,size*.77,palette[0],rand()*2);
   blob(ctx,x,y,size,size*(.7+rand()*.3),col,rand()*2);
  }
 }
 for(let i=0;i<(bush?10:18);i++){
  const a=rand()*TAU,r=rand()*radius*.72,x=Math.cos(a)*r,y=Math.sin(a)*r;
  blob(ctx,x,y,1+rand()*1.7,.6+rand()*1.2,rand()>.35?'#cad7a047':'#081d1f44');
 }
 ctx.restore();
}
function trunk(ctx,rand){
 ctx.strokeStyle='#241e1c';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,3);ctx.lineTo(0,-9);ctx.stroke();
 ctx.strokeStyle='#826049';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,2);ctx.lineTo(0,-9);ctx.stroke();
 for(let i=0;i<5;i++){
  const a=i*TAU/5+(rand()-.5)*.3,reach=7+rand()*8;
  stroke(ctx,0,-5,Math.cos(a)*reach,Math.sin(a)*reach-7,'#3d3229',2.5);
 }
}
function stone(ctx,rand){
 const n=8+Math.floor(rand()*4),radius=16+rand()*7;
 ctx.beginPath();
 for(let i=0;i<n;i++){const a=i*TAU/n,rr=radius*(.79+rand()*.32);const x=Math.cos(a)*rr,y=Math.sin(a)*rr*.86;
  if(i===0)ctx.moveTo(x+4,y+7);else ctx.lineTo(x+4,y+7);}
 ctx.closePath();ctx.fillStyle='#0b1415ab';ctx.fill();
 ctx.beginPath();
 for(let i=0;i<n;i++){const a=i*TAU/n,rr=radius*(.73+rand()*.28);if(i===0)ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr*.84);else ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr*.84);}
 ctx.closePath();ctx.fillStyle='#6a7370';ctx.fill();ctx.lineWidth=1.6;ctx.strokeStyle='#242d30';ctx.stroke();
 ctx.beginPath();ctx.moveTo(-radius*.7,-2);ctx.lineTo(-radius*.22,-radius*.59);ctx.lineTo(radius*.52,-radius*.2);ctx.lineTo(3,4);ctx.closePath();ctx.fillStyle='#a3a79a';ctx.fill();
 stroke(ctx,-radius*.2,-radius*.57,3,4,'#d7d8c34d',1);
 for(let i=0;i<6;i++){blob(ctx,(rand()-.5)*radius*1.4,(rand()-.5)*radius*.9,1.2+rand()*2,.6+rand(),'#3949436c');}
}
function table(ctx,rand){
 wood(ctx,-23,-16,46,32,'#79583c');
 ctx.strokeStyle='#bd9061';ctx.lineWidth=1;ctx.strokeRect(-20,-13,40,26);
 for(let x=-17;x<23;x+=9)stroke(ctx,x,-13,x,13,'#3d291da8',1);
 blob(ctx,7,2,7,6,'#3a3932');blob(ctx,7,2,5,4,'#b9b4a2');blob(ctx,7,2,2,2,'#7e533a');
 if(rand()>.4){blob(ctx,-10,-5,4,3,'#987543');blob(ctx,-10,-5,2,2,'#473421');}
}
function bed(ctx,rand){
 wood(ctx,-18,-24,36,48,'#6c4c3b');
 ctx.fillStyle='#c4b39a';ctx.fillRect(-15,-20,30,16);
 ctx.fillStyle=rand()>.5?'#6b656b':'#684b55';ctx.fillRect(-16,-3,32,23);
 ctx.fillStyle='#a58d83';ctx.fillRect(-14,-4,28,4);
 for(let i=-10;i<=10;i+=5)stroke(ctx,i,2,i,16,'#d1b9a51f',.8);
 ctx.strokeStyle='#231c21';ctx.lineWidth=2;ctx.strokeRect(-16,-3,32,23);
}
function shelf(ctx,rand){
 wood(ctx,-22,-11,44,22,'#684b36');
 for(let i=-19;i<20;i+=5){
  const colors=['#67765d','#a0815e','#7c4242','#b4a288','#4a666b'];
  ctx.fillStyle=colors[Math.floor(rand()*colors.length)];
  ctx.fillRect(i,-7,3+rand()*2,14);
 }
 ctx.strokeStyle='#c2a27b';ctx.lineWidth=2;ctx.strokeRect(-20,-9,40,18);
}
function chest(ctx,rand,crate=false){
 wood(ctx,-16,-12,32,24,crate?'#775a3b':'#61442f');
 ctx.strokeStyle='#b99a6d';ctx.lineWidth=3;
 stroke(ctx,-14,-9,14,9,'#a98b59',2);stroke(ctx,-14,9,14,-9,'#9f855a',2);
 if(!crate){
  ctx.strokeRect(-14,-10,28,20);ctx.fillStyle='#c9ab71';ctx.fillRect(-2,-5,4,11);
 }
}
function barrel(ctx,rand){
 blob(ctx,3,5,15,16,'#0e1b1c9a');
 blob(ctx,0,0,14,16,'#4e3629');
 for(let i=-9;i<=9;i+=4)stroke(ctx,i,-11,i,12,'#b88a5b78',1.5);
 ctx.strokeStyle='#bbb0a0';ctx.lineWidth=2.4;
 ctx.beginPath();ctx.ellipse(0,0,12,14,0,0,TAU);ctx.stroke();
 ctx.beginPath();ctx.ellipse(0,0,5,6,0,0,TAU);ctx.strokeStyle='#241e1d';ctx.stroke();
}
function chair(ctx){
 wood(ctx,-12,-10,24,22,'#75553b');
 ctx.fillStyle='#aa8563';ctx.fillRect(-9,-7,18,14);
 ctx.strokeStyle='#3b2820';ctx.lineWidth=5;stroke(ctx,-12,-10,12,-10,'#2b2420',4);
}
// Sprite memoization retains each illustrated object's stable seeded variation
// while avoiding dozens of Canvas paths per object on every pointermove.
const spriteCache=new Map(),SPRITE_SIZE=112,SPRITE_LIMIT=560;
function createSprite(p,seed){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas');
 canvas.width=SPRITE_SIZE;canvas.height=SPRITE_SIZE;
 const c=canvas.getContext('2d');
 if(!c)return null;
 c.translate(SPRITE_SIZE/2,SPRITE_SIZE/2);
 paintPropArt(c,p,rng(seed));
 return canvas;
}
function paintPropArt(ctx,p,random){
 if(p.type==='tree'){
  const rad=20+random()*10;
  trunk(ctx,random);
  foliage(ctx,random,rad);
 }else if(p.type==='bush')foliage(ctx,random,13+random()*6,true);
 else if(p.type==='rock'||p.type==='pillar')stone(ctx,random);
 else if(p.type==='table')table(ctx,random);
 else if(p.type==='bed')bed(ctx,random);
 else if(p.type==='chair')chair(ctx);
 else if(p.type==='shelf'||p.type==='cabinet')shelf(ctx,random);
 else if(p.type==='chest'||p.type==='crate')chest(ctx,random,p.type==='crate');
 else if(p.type==='barrel')barrel(ctx,random);

}
export function drawStyledProp(ctx,p,cell=48){
 if(!p||!['tree','bush','rock','pillar','bed','table','chair','shelf','cabinet','crate','chest','barrel'].includes(p.type))return false;
 const seed=hash(p.x,p.y,p.type),key=p.type+':'+seed;
 let sprite=null;
 if(ctx?.drawImage&&typeof document!=='undefined'){
  sprite=spriteCache.get(key);
  if(sprite){
   spriteCache.delete(key);spriteCache.set(key,sprite);
  }else{
   sprite=createSprite(p,seed);
   if(sprite){
    spriteCache.set(key,sprite);
    if(spriteCache.size>SPRITE_LIMIT)spriteCache.delete(spriteCache.keys().next().value);
   }
  }
 }
 ctx.save();ctx.translate(p.x*cell,p.y*cell);
 ctx.rotate((Number(p.rotation)||0)*Math.PI/180);
 if(sprite)ctx.drawImage(sprite,-SPRITE_SIZE/2,-SPRITE_SIZE/2);
 else paintPropArt(ctx,p,rng(seed));
 ctx.restore();return true;
}
