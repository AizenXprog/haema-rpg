// Gerador GUIADO e LOCAL do HÆMA: regras interpretam palavras-chave, não usa IA nem envia texto.
import {generateScene} from './generator.js?v=4';
import {makePath} from './path-geometry.js?v=2';
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const has=(s,...words)=>words.some(word=>s.includes(word));
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const seedHash=text=>{let n=2166136261;for(const c of text)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0;};
const randFor=seed=>{let n=seedHash(seed);return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};};
export function interpretDescription(text){
 const raw=String(text||'').trim();
 if(raw.length<6)throw Error('Descreva um ambiente com pelo menos seis caracteres.');
 if(raw.length>320)throw Error('Use uma descrição de até 320 caracteres.');
 const n=normalize(raw);
 const tavern=has(n,'taverna','estalagem','pousada','salao','refeitorio');
 const dungeon=has(n,'masmorra','ruina','calabouco','templo','cripta','castelo','biblioteca','castelo','caverna');
 const lake=has(n,'lago','lagoa','praia','margem');
 const forest=has(n,'bosque','floresta','arvore','mata','clareira','jardim','campo');
 const river=has(n,'rio','riacho','corrego','ribeirao');
 const road=has(n,'estrada','caminho','trilha','rota','ponte');
 if(!tavern&&!dungeon&&!lake&&!forest&&!river&&!road)throw Error('Use referências como floresta, lago, rio, estrada, taverna ou ruínas.');
 const base=tavern?'tavern':dungeon?'dungeon':lake?'lake':'forest';
 const removeTrees=has(n,'sem arvore','sem vegetacao','sem mata');
 const dense=has(n,'densa','denso','muitas arvores','mata fechada','floresta fechada');
 const sparse=has(n,'poucas arvores','esparsa','aberta','desmatada');
 return {
  base,river,road,vegetation:removeTrees?'none':dense?'dense':sparse?'sparse':'normal',
  requestedLibrary:has(n,'biblioteca','livraria','sala de leitura'),
  description:raw.slice(0,160)
 };
}
function curve(cols,rows,seed,kind,axis='vertical'){
 const r=randFor(seed+'|'+kind+'|'+axis);
 const shift=r()*2-1,waves=r()*6;
 const pts=[];
 for(let i=0;i<=24;i++){
  const t=i/24;
  if(axis==='vertical'){
   const x=clamp(cols*(kind==='river'?.24:.62)+Math.sin(t*7.4+waves)*(kind==='river'?2.3:1.65)+
    Math.sin(t*15.4+shift)*.54, .65,cols-.65);
   pts.push({x,y:.45+t*(rows-.9)});
  }else{
   const y=clamp(rows*.5+Math.sin(t*7+waves)*1.7+Math.sin(t*18+shift)*.35,.65,rows-.65);
   pts.push({x:.45+t*(cols-.9),y});
  }
 }
 return pts;
}
export function generateFromDescription(description,seed=''){
 const spec=interpretDescription(description);
 const actualSeed=String(seed||spec.description).slice(0,80);
 const scene=generateScene(spec.base,actualSeed);
 scene.paths=scene.paths||[];
 if(spec.road&&scene.paths.length<90)scene.paths.push(makePath('road',curve(scene.cols,scene.rows,actualSeed,'road','horizontal'),{width:1.15,material:'earth',cols:scene.cols,rows:scene.rows}));
 if(spec.river&&scene.paths.length<90)scene.paths.push(makePath('river',curve(scene.cols,scene.rows,actualSeed,'river'),{width:1.45,cols:scene.cols,rows:scene.rows}));
 if(spec.vegetation==='none'||spec.vegetation==='sparse'){
  scene.props=scene.props.filter(p=>!['tree','bush'].includes(p.type)||
   (spec.vegetation==='sparse'&&seedHash(Math.round(p.x*17)+':'+Math.round(p.y*19)+actualSeed)%5===0));
 }
 if(spec.vegetation==='dense'&&['forest','lake'].includes(spec.base)){
  const r=randFor(actualSeed+'trees');
  for(let i=0;i<95&&scene.props.length<500;i++){
   const x=1+r()*(scene.cols-2),y=1+r()*(scene.rows-2);
   const tile=scene.tiles[Math.floor(y)*scene.cols+Math.floor(x)];
   if(tile!=='grass')continue;
   // Keep main paths clear for characters; individual trees stay movable.
   if(scene.paths.some(path=>path.points.some(pt=>Math.hypot(pt.x-x,pt.y-y)<path.width/2+.5)))continue;
   if(scene.props.some(p=>Math.hypot(p.x-x,p.y-y)<.72))continue;
   scene.props.push({x:Math.round(x*100)/100,y:Math.round(y*100)/100,type:r()<.82?'tree':'bush'});
  }
 }
 if(spec.requestedLibrary&&spec.base==='dungeon'){
  scene.props=scene.props.filter(p=>!['bed','rug','chest'].includes(p.type));
  for(let j=0;j<3;j++)scene.props.push({x:21+j*1.65,y:3.6,type:'shelf',rotation:90});
 }
 scene.name='Cena guiada · '+spec.description.slice(0,58);
 return {scene,plan:spec};
}
