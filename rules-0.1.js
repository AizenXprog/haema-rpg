'use strict';
/** Verifiable calculation kernel for HÆMA 0.1; no legacy mechanics or side effects. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HAEMA01=api;})(typeof window!=='undefined'?window:null,function(){
 const ATTR=['Força','Destreza','Vigor','Intelecto','Percepção','Presença'];
 const SKILL_GROUPS={
  'Sociais':['Enganação','Persuasão','Empatia','Intimidação','Diplomacia','Liderança','Atuação'],
  'Físicas':['Atletismo','Acrobacia','Luta','Pontaria','Armas Brancas','Furtividade'],
  'Intelectuais':['Observação','Investigação','Ciências','Cultura','Estratégia'],
  'Práticas':['Medicina','Tecnologia','Engenharia','Sobrevivência','Condução','Ladinagem']
 };
 const SKILLS=Object.values(SKILL_GROUPS).flat(), DICE=[4,6,8,10,12];
 const DTS={5:'Simples sob pressão',7:'Padrão',9:'Exigente',11:'Difícil',13:'Extremamente difícil',15:'Excepcional'};
 const INV_THRESHOLDS={4:90,6:88,8:86,10:84,12:82}, INV_CHANCES={4:'0,094%',6:'0,193%',8:'0,363%',10:'0,636%',12:'1,052%'};
 const LATEBRA={4:{count:2,faces:4,rerolls:0},6:{count:2,faces:6,rerolls:1},8:{count:3,faces:6,rerolls:1},10:{count:3,faces:6,rerolls:2},12:{count:4,faces:6,rerolls:2}};
 const grade=d=>DICE.indexOf(d)+1;
 const steps=arr=>arr.reduce((n,d)=>n+(d-4)/2,0);
 const resources=(vigor,wounds=0)=>({integrity:10+vigor,stamina:6+grade(vigor)-wounds,defense:7,guard:6});
 const success=(a,b,dt)=>a+b>=dt;
 const defense=(guard,cover=0,shield=0)=>1+guard+cover+shield;
 const applyMetus=(a,b,m)=>({first:a<m?0:a,second:b<m?0:b,total:(a<m?0:a)+(b<m?0:b)});
 const attack=(aFace,bFace,aRoll,bRoll,guard,cover=0,armor=0,weaponRoll=0)=>{
  const d=defense(guard,cover),total=aRoll+bRoll,hit=total>=d;
  const critical=hit&&(aRoll===aFace||bRoll===bFace)&&total>=d+3;
  const final=hit?Math.max(0,weaponRoll+(critical?2:0)-armor):0;
  return {defense:d,total,hit,critical,damage:final};
 };
 const invictaDT=(attrFace,skillFace)=>Math.ceil((attrFace+skillFace)*.75);
 const invictaThreshold=skillFace=>INV_THRESHOLDS[skillFace];
 function die(faces,randomSource){
  if(!DICE.includes(faces)&&faces!==20)throw new Error('Invalid die');
  if(randomSource)return randomSource(faces);
  const r=new Uint32Array(1),top=Math.floor(4294967296/faces)*faces;
  do{crypto.getRandomValues(r)}while(r[0]>=top);return r[0]%faces+1;
 }
 function initialLatebra(furtividade,metus=0,roller=die){
  const config=LATEBRA[furtividade];if(!config)throw new Error('Invalid Latebra level');
  const marks=new Set();let canceledByMetus=false;
  for(let index=0;index<config.count;index++){
   let n=roller(config.faces);
   for(let retry=0;retry<config.rerolls&&marks.has(n);retry++)n=roller(config.faces);
   if(index===config.count-1 && metus>0 && n<roller(metus)){canceledByMetus=true;continue;}
   marks.add(n);
  }
  return {marks,canceledByMetus};
 }
 function searchLatebra(marks,found,rolls){
  const discoveries=[];
  for(const n of rolls){if(marks.has(n)&&!found.has(n)){found.add(n);discoveries.push(n);}}
  return discoveries;
 }
 function reinforceLatebra(marks,found,newRoll,metusRoll=0){
  if(marks.size-found.size>=4)return 'cap';
  if(metusRoll>0&&newRoll<metusRoll)return 'metus';
  if(marks.has(newRoll)||found.has(newRoll))return 'duplicate';
  marks.add(newRoll);return 'added';
 }
 return Object.freeze({ATTR,SKILL_GROUPS,SKILLS,DICE,DTS,INV_THRESHOLDS,INV_CHANCES,LATEBRA,grade,steps,resources,success,defense,applyMetus,attack,invictaDT,invictaThreshold,die,initialLatebra,searchLatebra,reinforceLatebra});
});
