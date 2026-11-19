'use strict';
/**
 * HÆMA — núcleo isolado do Manual Unificado (19/11/2026).
 * CANDIDATO EXPERIMENTAL, não oficial. Não altera fichas 0.1.
 * Site e Sistema criado por Vitor Monte.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HAEMAUnified=api;
})(typeof window!=='undefined'?window:null,function(){
 const DICE=Object.freeze([4,6,8,10,12]);
 const ATTR=Object.freeze(['Força','Destreza','Vigor','Intelecto','Percepção','Presença']);
 const SKILL_GROUPS=Object.freeze({
  Sociais:['Enganação','Persuasão','Empatia','Intimidação','Diplomacia','Liderança','Atuação'],
  Físicas:['Atletismo','Acrobacia','Luta','Pontaria','Armas Brancas','Furtividade'],
  Conhecimento:['Observação','Investigação','Ciências','Cultura','Estratégia'],
  Práticas:['Medicina','Tecnologia','Engenharia','Sobrevivência','Condução','Ladinagem']
 });
 const SKILLS=Object.freeze(Object.values(SKILL_GROUPS).flat());
 const HIGH=Object.freeze({4:4,6:5,8:7,10:8,12:10});
 const LATEBRA=Object.freeze({4:[2,4,0],6:[2,6,1],8:[3,6,1],10:[3,6,2],12:[4,6,2]});
 const COSTS=Object.freeze({competencia:[6,10,16,24],atributo:[14,22,34,50],guarda:[12,20,30],regencia:[10,16,24,36],descoberta:[4,8,12]});
 const REGENCIES=Object.freeze(['Kórven','Sælir','Vraek','Ithren','Ossyra','Nælth','Eyris']);
 function assertDie(d){if(!DICE.includes(d))throw Error('Dado inválido: '+d);return d;}
 function grade(d){return DICE.indexOf(assertDie(d))+1;}
 function defense(guard=6,{shield=false,partialCover=false,defending=false}={}){
  return 4+grade(guard)+Math.max(shield?1:0,partialCover?2:0)+(defending?1:0);
 }
 function integrity(vigor){return 6+assertDie(vigor);}
 function createdCharacter(){
  return {format:'haema-character',version:'unified-playtest-20261119',name:'',job:'',
   attributes:Array(6).fill(4),skills:Array(24).fill(4),guard:6,integrity:10,
   wounds:0,deathRisks:0,stable:true,metus:0,pe:0,invicta:0,
   awakened:[],discoveries:[],techniques:[],experiences:[],visualSignatures:{}};
 }
 function steps(fields){return fields.reduce((n,d)=>n+grade(d)-1,0);}
 function validateCreation(c){
  const errors=[];
  if(!c||c.version!=='unified-playtest-20261119')errors.push('Versão da ficha não corresponde ao candidato');
  if(!Array.isArray(c?.attributes)||c.attributes.length!==6||!c.attributes.every(x=>[4,6].includes(x)))errors.push('Seis atributos, inicialmente d4/d6');
  if(!Array.isArray(c?.skills)||c.skills.length!==24||!c.skills.every(x=>[4,6].includes(x)))errors.push('Vinte e quatro competências, inicialmente d4/d6');
  if(!errors.length){
   if(steps(c.attributes)>4)errors.push('No máximo 4 aumentos iniciais de atributo');
   if(steps(c.skills)>6)errors.push('No máximo 6 aumentos iniciais de competência');
  }
  return {valid:errors.length===0,errors};
 }
 function roll(faces,rng=Math.random){assertDie(faces);let v=Math.floor(rng()*faces)+1;if(!Number.isInteger(v)||v<1||v>faces)throw Error('Fonte aleatória inválida');return v;}
 function validateRoll(faces,value){assertDie(faces);if(!Number.isInteger(value)||value<1||value>faces)throw Error('Resultado de dado inválido');}
 function test({aFace,bFace,aRoll,bRoll,dt,modifier=0,possible=true}){
  validateRoll(aFace,aRoll);validateRoll(bFace,bRoll);
  if(!Number.isFinite(dt)||!Number.isInteger(dt))throw Error('DT inválida');
  if(!Number.isInteger(modifier)||modifier< -2||modifier>2)throw Error('Modificador fora do limite fixo ±2');
  const natural=aRoll+bRoll, total=natural+modifier,success=Boolean(possible)&&total>=dt;
  return {natural,total,dt,success,margin:natural-dt,possible:Boolean(possible),requiresMasterValidation:true};
 }
 function exceptional({aFace,bFace,aRoll,bRoll,dt,possible=true,realDanger=false,hasInvicta=false,sceneAwarded=false}){
  const base=test({aFace,bFace,aRoll,bRoll,dt,possible});
  const high=aRoll>=HIGH[aFace]&&bRoll>=HIGH[bFace]&&(aRoll===aFace||bRoll===bFace);
  const critical=base.success&&base.margin>=3&&high;
  return {...base,high,critical,invictaEligible:critical&&base.margin>=6&&realDanger&&!hasInvicta&&!sceneAwarded};
 }
 function opposed(attacker,defender,{tieOwner='defender'}={}){
  const a=attacker.aRoll+attacker.bRoll,b=defender.aRoll+defender.bRoll;
  return {attacker:a,defender:b,winner:a>b?'attacker':a<b?'defender':tieOwner,tie:a===b};
 }
 function attack({aFace,bFace,aRoll,bRoll,defenseValue,weaponFace=6,weaponRoll,armor=0,parry=0,dodged=false,criticalChoice='none',possible=true}){
  const hit=exceptional({aFace,bFace,aRoll,bRoll,dt:defenseValue,possible});
  assertDie(weaponFace);validateRoll(weaponFace,weaponRoll);
  if(![0,1,2].includes(armor)||![0,1,2].includes(parry))throw Error('Proteção inválida');
  if(!['none','impact','virada'].includes(criticalChoice))throw Error('Escolha de crítico inválida');
  if(criticalChoice!=='none'&&!hit.critical)throw Error('Escolha de crítico sem crítico válido');
  const landed=hit.success&&!dodged;
  const raw=landed?weaponRoll+(criticalChoice==='impact'?2:0):0;
  return {...hit,landed,critical:landed&&hit.critical,raw,
   damage:landed?Math.max(0,raw-parry-armor):0,virada:landed&&criticalChoice==='virada'};
 }
 function damageState({current,max,wounds=0,damage}){
  if(!Number.isInteger(current)||!Number.isInteger(max)||!Number.isInteger(damage)||damage<0||current<0||max<1)throw Error('Integridade inválida');
  const next=Math.max(0,Math.min(current,max)-damage);
  const injured=damage>=6||(current>0&&next===0);
  return {integrity:next,wounds:Math.min(2,wounds+(injured?1:0)),incapacitated:next===0,newWound:injured&&wounds<2};
 }
 function metus(a,b,m){
  if(![0,4,6,8].includes(m))throw Error('Metus inválido');
  if(!m)return {rolls:[a,b],canceled:[false,false],total:a+b};
  return {rolls:[a<m?0:a,b<m?0:b],canceled:[a<m,b<m],total:(a<m?0:a)+(b<m?0:b)};
 }
 function initialLatebra(furtividade,roller=roll){
  const [count,faces,rerolls]=LATEBRA[assertDie(furtividade)];
  const marks=new Set();
  for(let i=0;i<count;i++){
   let n=roller(faces);validateRoll(faces,n);
   for(let j=0;j<rerolls&&marks.has(n);j++){n=roller(faces);validateRoll(faces,n);}
   marks.add(n);
  }
  return [...marks].sort((a,b)=>a-b);
 }
 function searchLatebra(marks,rolls){
  const hidden=new Set(marks),discovered=[];
  for(const n of rolls){if(hidden.delete(n))discovered.push(n);}
  return {remaining:[...hidden],discovered,located:hidden.size===0};
 }
 function progressCost(type,from){
  const costs=COSTS[type];if(!costs)throw Error('Evolução inválida');
  if(type==='descoberta'){if(!Number.isInteger(from)||from<0||from>2)throw Error('Escala inválida');return costs[from];}
  const first=type==='guarda'?6:4;
  const index=DICE.indexOf(from)-DICE.indexOf(first);
  if(index<0||index>=costs.length)throw Error('Grau sem avanço disponível');
  return costs[index];
 }
 function apexStrike(weaponFace,{armor=0,parry=0}={}){return Math.max(0,assertDie(weaponFace)+2-armor-parry);}
 function invictaCanGain({eligible,current=0,sceneAwarded=false}){return eligible&&current===0&&!sceneAwarded;}
 function probability(aFace,bFace,dt,kind='success'){
  assertDie(aFace);assertDie(bFace);
  let wins=0;
  for(let a=1;a<=aFace;a++)for(let b=1;b<=bFace;b++){
   const r=exceptional({aFace,bFace,aRoll:a,bRoll:b,dt,possible:true,realDanger:true});
   if(kind==='success'?r.success:kind==='critical'?r.critical:kind==='invicta'?r.invictaEligible:false)wins++;
  }
  return wins/(aFace*bFace);
 }
 return Object.freeze({VERSION:'unified-playtest-20261119',STATUS:'experimental',
  DICE,ATTR,SKILL_GROUPS,SKILLS,HIGH,LATEBRA,COSTS,REGENCIES,grade,defense,integrity,
  createdCharacter,validateCreation,roll,test,exceptional,opposed,attack,damageState,metus,
  initialLatebra,searchLatebra,progressCost,apexStrike,invictaCanGain,probability});
});