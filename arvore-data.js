/* HÆMA · Topologia estável da Constelação das Escolhas.
 * Os 631 identificadores e as ligações permanecem compatíveis com progresso salvo.
 * Site e Sistema criado por Vitor Monte.
 */
(function(root,factory){const lib=factory(root);if(typeof module==='object'&&module.exports)module.exports=lib;if(root)root.HaemaSkillTree=lib;})(typeof window!=='undefined'?window:null,function(root){
 'use strict';
 const STAGES=6,GENERATIONS=4,VERSION='arvore-exp-20261124';
 const editorial=(root&&root.HaemaTreeCatalogVivo)||(typeof require==='function'?require('./arvore-catalogo-vivo.js'):null);
 const defs=[
  ['combate','Combate','⚔','#d86760',-90,'Finalizações e pressão',['Lâmina','Execução','Pressão','Ritmo','Duelo','Ruptura','Cerco','Caçada']],
  ['defesa','Defesa','⛨','#c9aa70',-38.57142857,'Aparo e proteção',['Guarda','Aparo','Interposição','Bastião','Postura','Resistência','Escudo','Sentinela']],
  ['precisao','Precisão','⌖','#9cbbcf',12.85714286,'Golpes estudados',['Mira','Trajetória','Distância','Ponto Fraco','Tempo','Foco','Caçador','Vigília']],
  ['mobilidade','Mobilidade','➶','#8daa91',64.28571429,'Posição e Latebra',['Sombra','Passagem','Esquiva','Trajeto','Emboscada','Rota','Escalada','Desvio']],
  ['sobrevivencia','Sobrevivência','✚','#c98584',115.71428571,'Ferimentos e socorro',['Resistência','Resgate','Recuperação','Campo','Persistência','Refúgio','Fôlego Humano','Vigilância']],
  ['conhecimento','Conhecimento','✧','#b9a2cd',167.14285714,'Investigação e estratégia',['Arquivo','Estratégia','Ofício','Pista','Preparação','Estudo','Método','Laboratório']],
  ['regencias','Regências','Æ','#d8bd80',218.57142857,'Tanger e Ressonância',['Eco','Sintonia','Âncora','Ensaio','Manifestação','Condução','Ressonância','Descoberta']]
 ];
 const sectors=defs.map(([id,name,symbol,color,angle,subtitle,themes])=>({id,name,symbol,color,angle,subtitle,themes}));
 const nodes=[],map=new Map();
 const origin={id:'origem',parent:null,sector:'origem',label:'Origem',name:'O Primeiro Passo',type:'origin',cost:0,rank:0,x:0,y:0,effect:'Escolha uma direção para começar.',trigger:'A campanha oferece sua primeira oportunidade.',limit:'Uma única trilha contínua por personagem.',example:'O mestre mostra os caminhos.',status:'ready',kind:'Origem'};
 nodes.push(origin);map.set(origin.id,origin);
 function key(sector,bits,step){return `s${sector}:${bits||'x'}:${step}`}
 function allBits(n){let arr=[''];for(let i=0;i<n;i++)arr=arr.flatMap(bits=>[bits+'0',bits+'1']);return arr}
 for(let s=0;s<sectors.length;s++){
  const sec=sectors[s];
  for(let gen=0;gen<GENERATIONS;gen++)for(const bits of allBits(gen))for(let step=1;step<=STAGES;step++){
   const rank=gen*STAGES+step,id=key(s,bits,step),parent=step>1?key(s,bits,step-1):gen===0?'origem':key(s,bits.slice(0,-1),STAGES);
   const baseRad=sec.angle*Math.PI/180,offs=[12.5,6.1,2.65];let angular=0;
   for(let j=0;j<bits.length;j++)angular+=(bits[j]==='0'?-1:1)*offs[j];
   const r=160+rank*79,rad=baseRad+angular*Math.PI/180;
   const phase=bits.length?bits.split('').map((d,i)=>d==='0'?['Método','Vigia','Profundidade'][i]:['Instinto','Risco','Ascensão'][i]).join(' / '):'Fundamentos';
   const chapter=sec.themes[(gen+parseInt(bits||'0',2))%sec.themes.length];
   const type=gen===3&&step===6?'apex':step===6?'keystone':step===3?'notable':'minor';
   const node={id,parent,sector:sec.id,sectorIndex:s,phase,chapter,name:`${sec.name} · ${chapter} ${step}`,label:sec.name,rank,type,cost:[4,6,8,12][gen],effect:'Em pesquisa',angle:sec.angle+angular,x:Math.round(r*Math.cos(rad)),y:Math.round(r*Math.sin(rad)),lockedByAwakening:sec.id==='regencias',status:'draft'};
   const d=editorial?.describe(node);
   if(d)Object.assign(node,d);
   nodes.push(node);map.set(id,node);
  }
 }
 const edges=nodes.filter(n=>n.parent).map(n=>({from:n.parent,to:n.id}));
 const children=new Map();for(const n of nodes){if(!n.parent)continue;const arr=children.get(n.parent)||[];arr.push(n);children.set(n.parent,arr)}
 function nextNodes(path=[]){return children.get(path.length?path[path.length-1]:'origem')||[]}
 function canUnlock(path,id){return nextNodes(path).some(n=>n.id===id)}
 function formatCost(path=[]){return path.reduce((sum,id)=>sum+(map.get(id)?.cost||0),0)}
 return Object.freeze({VERSION,STAGES,GENERATIONS,sectors,nodes,map,edges,key,nextNodes,canUnlock,formatCost});
});