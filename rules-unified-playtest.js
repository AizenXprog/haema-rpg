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
 function exceptional({aFace,bFace,aRoll,bRoll,dt,modifier=0,possible=true,realDanger=false,hasInvicta=false,sceneAwarded=false}){
  const base=test({aFace,bFace,aRoll,bRoll,dt,modifier,possible});
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
  if(!Number.isInteger(m)||m<0||m>8)throw Error('Resultado de Metus inválido');
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

 // Incapacitação: não inventa dano/risco ambiental sem ameaça efetiva anunciada.
 function deathRisk(state,{kind='turn',rollSuccess=false,underThreat=false,careProvided=false}={}){
  if(!state||!Number.isInteger(state.integrity)||!Number.isInteger(state.deathRisks)||state.deathRisks<0||state.deathRisks>3)
   throw Error('Estado de risco inválido');
  if(state.integrity>0)return {...state,incapacitated:false,dead:false};
  let next={...state,incapacitated:true};
  if(state.deathRisks===3)return {...next,dead:true};
  if(kind==='turn'){
   if(!state.firstDeathCheckDone){
    next.firstDeathCheckDone=true;
    if(rollSuccess)next.stable=true;
    else{next.stable=false;next.deathRisks=Math.min(3,state.deathRisks+1);}
   }
  }else if(kind==='dangerRound'){
   if(!state.stable&&underThreat&&!careProvided)next.deathRisks=Math.min(3,state.deathRisks+1);
  }else if(kind==='effectiveDamage'){
   if(!state.stable&&underThreat)next.deathRisks=Math.min(3,state.deathRisks+1);
  }else if(kind==='stabilize'){
   if(careProvided)next.stable=true;
  }else throw Error('Evento de Risco desconhecido');
  next.dead=next.deathRisks>=3;return next;
 }
 function aid({withKit=true,attributeRoll,medicineRoll}){
  const dt=withKit?5:7;
  if(!Number.isInteger(attributeRoll)||!Number.isInteger(medicineRoll)||attributeRoll<1||medicineRoll<1)
   throw Error('Resultados de Medicina inválidos');
  return {dt,total:attributeRoll+medicineRoll,success:attributeRoll+medicineRoll>=dt,masterValidatesImprovisation:!withKit};
 }
 function safeRecovery({current,max,stable=false,safe=false,minutes=0,usedSceneReturn=false}){
  if(!Number.isInteger(current)||!Number.isInteger(max)||current<0||max<1)throw Error('Integridade inválida');
  if(!safe||!stable||minutes<10||usedSceneReturn||current!==0)return {integrity:current,recovered:false};
  return {integrity:1,recovered:true};
 }
 function longRest({current,max,rollValue,safe=false}){
  if(!Number.isInteger(rollValue)||rollValue<1||rollValue>6)throw Error('1d6 inválido');
  if(!Number.isInteger(current)||!Number.isInteger(max)||current<0||current>max)throw Error('Integridade inválida');
  return {integrity:safe?Math.min(max,current+rollValue):current,recovered:safe?rollValue:0};
 }
 function apex(type,{stored=0,actionSucceeded=false,validAnchor=false,adjacent=false,reactionAvailable=false,physicallyPossible=false,stableDiscovery=false,choiceOffered=false}={}){
  const eligible=stored===1&&actionSucceeded;
  let allowed=false,explanation='';
  switch(type){
   case 'golpe':allowed=eligible&&physicallyPossible;explanation='Dano máximo da arma +2 e uma Virada física proporcional; Aparo e Abs continuam';break;
   case 'protecao':allowed=stored===1&&adjacent&&reactionAvailable&&physicallyPossible;explanation='Intercepção de um único golpe alcançável ao aliado, gastando Reação e Invicta';break;
   case 'superacao':allowed=eligible&&choiceOffered&&physicallyPossible;explanation='Uma consequência humana adicional dentre opções anunciadas antes do gasto';break;
   case 'tanger':allowed=eligible&&validAnchor&&stableDiscovery;explanation='Uma rodada adicional sustentada ou âncora adjacente viável';break;
   default:throw Error('Tipo de Ápice inválido');
  }
  return {allowed,spend:allowed?1:0,remaining:allowed?0:stored,explanation,requiresMasterValidation:true};
 }


 const DISCOVERY_STATES=Object.freeze(['suspeita','provisoria','estavel']);
 const SCALES=Object.freeze({ajuste:{dt:5,preparations:0,requireSustain:false},
  intervencao:{dt:7,preparations:0,requireSustain:false},
  maior:{dt:9,preparations:2,requireSustain:true}});
 function validateDiscovery(discovery,{forManifestation=false}={}){
  const errors=[];
  if(!discovery||typeof discovery!=='object')return {valid:false,errors:['Descoberta ausente']};
  if(!REGENCIES.includes(discovery.regency))errors.push('Regência desconhecida');
  if(!DISCOVERY_STATES.includes(discovery.state))errors.push('Estado inválido');
  if(!SCALES[discovery.scale])errors.push('Escala inválida');
  for(const key of ['phenomenon','anchor','competence','effect','limits','duration','signal','counterplay','risk']){
   if(typeof discovery[key]!=='string'||!discovery[key].trim())errors.push('Falta '+key);
  }
  if(forManifestation&&discovery.state==='suspeita')errors.push('Suspeita não é manifestação conhecida');
  return {valid:errors.length===0,errors};
 }
 function tanger({discovery,awakened=[],regencyFace,skillFace,regencyRoll,skillRoll,
  preparations=0,anchored=false,canSustain=false,possible=true,essay=false}){
  const check=validateDiscovery(discovery,{forManifestation:!essay});
  if(!check.valid)return {allowed:false,reasons:check.errors};
  const errors=[];
  if(!awakened.includes(discovery.regency))errors.push('Regência ainda não Desperta');
  if(!anchored)errors.push('Âncora ausente');
  if(!possible)errors.push('Fenômeno não é fisicamente viável');
  const scale=SCALES[discovery.scale];
  if(preparations<scale.preparations)errors.push('Preparações insuficientes');
  if(scale.requireSustain&&!canSustain)errors.push('Sustentação indisponível');
  if(!essay&&discovery.state!=='estavel'&&discovery.state!=='provisoria')errors.push('Descoberta não disponível');
  if(errors.length)return {allowed:false,reasons:errors,dt:scale.dt+(essay?1:0)};
  const dt=scale.dt+(essay?1:0);
  const testResult=test({aFace:regencyFace,bFace:skillFace,aRoll:regencyRoll,bRoll:skillRoll,dt,possible});
  return {allowed:true,dt,success:testResult.success,total:testResult.total,
   tentative:essay&&testResult.success,requiresMasterValidation:true,
   note:'O teste não cria efeito além do que foi previamente registrado para a Descoberta'};
 }
 function stabilizeDiscovery({discovery,pe,studyConfirmed=false,freeFirst=false}){
  const check=validateDiscovery(discovery);
  if(!check.valid)return {allowed:false,reason:check.errors.join('; ')};
  if(discovery.state==='estavel')return {allowed:false,reason:'Já estável'};
  if(discovery.state!=='provisoria')return {allowed:false,reason:'Exige descoberta provisória e estudo'};
  if(!studyConfirmed)return {allowed:false,reason:'Estudo e demonstração precisam ser confirmados'};
  const costs={ajuste:4,intervencao:8,maior:12},cost=freeFirst?0:costs[discovery.scale];
  if(!Number.isInteger(pe)||pe<cost)return {allowed:false,reason:'PE insuficiente'};
  return {allowed:true,cost,remainingPE:pe-cost,discovery:{...discovery,state:'estavel'}};
 }

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
  initialLatebra,searchLatebra,progressCost,apexStrike,invictaCanGain,probability,
  deathRisk,aid,safeRecovery,longRest,apex,DISCOVERY_STATES,SCALES,validateDiscovery,tanger,stabilizeDiscovery});
});