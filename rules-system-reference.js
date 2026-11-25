'use strict';
/**
 * HÆMA — Fonte única para a futura ficha. 
 * "oficial" designa decisões e conceitos explicitamente estabelecidos;
 * fórmulas são o protocolo selecionado para o playtest de 28/11/2026,
 * e NÃO um balanceamento ratificado por sessão humana.
 * Nenhum código de ficha legada é modificado por este arquivo.
 * Site e Sistema criado por Vitor Monte.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HaemaSystemReference=api;
})(typeof window!=='undefined'?window:null,function(){
 const STATUS=Object.freeze({
  canon:'base-oficial',
  playtest:'protocolo-experimental',
  pending:'a-decidir',
  legacy:'historico'
 });
 const VERSION='2026.11.25-reference';
 const ATTRIBUTES=Object.freeze(['Força','Destreza','Vigor','Intelecto','Percepção','Presença']);
 const GROUPS=Object.freeze({
  Sociais:Object.freeze(['Enganação','Persuasão','Empatia','Intimidação','Diplomacia','Liderança','Atuação']),
  Físicas:Object.freeze(['Atletismo','Acrobacia','Luta','Pontaria','Armas Brancas','Furtividade']),
  Conhecimento:Object.freeze(['Observação','Investigação','Ciências','Cultura','Estratégia']),
  Práticas:Object.freeze(['Medicina','Tecnologia','Engenharia','Sobrevivência','Condução','Ladinagem'])
 });
 const SKILLS=Object.freeze(Object.values(GROUPS).flat());
 const REGENCIES=Object.freeze([
  Object.freeze({id:'korven',name:'Kórven',aspect:'Forma',meaning:'matéria, estrutura e composição'}),
  Object.freeze({id:'saelir',name:'Sælir',aspect:'Pulso',meaning:'vida e ciclos biológicos'}),
  Object.freeze({id:'vraek',name:'Vraek',aspect:'Ímpeto',meaning:'movimento, energia e propagação'}),
  Object.freeze({id:'ithren',name:'Ithren',aspect:'Vínculo',meaning:'conexões e dependências'}),
  Object.freeze({id:'ossyra',name:'Ossyra',aspect:'Vestígio',meaning:'marcas, memória e permanência'}),
  Object.freeze({id:'naelth',name:'Nælth',aspect:'Limiar',meaning:'transições e fronteiras'}),
  Object.freeze({id:'eyris',name:'Eyris',aspect:'Percepção',meaning:'sentidos, consciência e interpretação'})
 ]);
 const DICE=Object.freeze([4,6,8,10,12]);
 const DRAFT_RULES=Object.freeze({
  creation:Object.freeze({attributesUpgrades:4,skillsUpgrades:6,startingDie:4,maxStartingDie:6,guard:6,awakenedAtStart:false,status:STATUS.playtest}),
  defense:Object.freeze({formula:'4 + grau(Guarda)',initial:6,status:STATUS.playtest}),
  integrity:Object.freeze({formula:'6 + faces(Vigor)',vigorD4:10,status:STATUS.playtest}),
  economy:Object.freeze({pePerProgressSession:1,pePerArc:2,status:STATUS.playtest}),
  resonance:Object.freeze({diceCount:3,faces:4,chosenNotRolled:true,mustPredefineSecret:true,status:STATUS.canon}),
  resonanceOutcomes:Object.freeze([
   Object.freeze({matches:0,state:'Indícios sem Despertar',awakened:false,regencyDie:null,echo:false,dtPenalty:null}),
   Object.freeze({matches:1,state:'Contato Frágil',awakened:true,regencyDie:4,echo:true,dtPenalty:2}),
   Object.freeze({matches:2,state:'Contato Instável',awakened:true,regencyDie:4,echo:true,dtPenalty:1}),
   Object.freeze({matches:3,state:'Contato Nítido',awakened:true,regencyDie:4,echo:true,dtPenalty:0})
  ]),
  discovery:Object.freeze({states:Object.freeze(['Suspeita','Provisória','Estável']),dt:Object.freeze({ajuste:5,intervencao:7,maior:9}),essayExtraDT:1,costs:Object.freeze({ajuste:4,intervencao:8,maior:12}),status:STATUS.playtest}),
  parry:Object.freeze({treeNode:'s1:1:4',learnedOnly:true,die:8,equalFacePerfect:true,procedureStatus:STATUS.pending}),
  activeGeneralResources:Object.freeze(['integridade','ferimentos','riscoDeMorte','metus','invicta','pe']),
  inactiveOrReserved:Object.freeze(['folego','sobrecarga','impetoTatico','ignis','motus'])
 });
 const SHEET=Object.freeze({
  version:VERSION,
  maxPages:3,
  pages:Object.freeze([
   Object.freeze({number:1,title:'Identidade e sobrevivência',sections:Object.freeze(['identificação','atributos','Guarda e Defesa','Integridade','Ferimentos e Risco','Metus','combate e equipamento principal'])}),
   Object.freeze({number:2,title:'Domínio humano',sections:Object.freeze(['24 competências','especializações','técnicas aprendidas','inventário','profissão e vivências'])}),
   Object.freeze({number:3,title:'Evolução e extraordinário',sections:Object.freeze(['PE e caminho da Constelação Viva','Invicta/Ápice','sete Regências','Despertar e Sintonia 3d4','Eco','Descobertas e Manifestações Evolutivas','Latebra'])})
  ])
 });
 const grade=faces=>{const index=DICE.indexOf(faces);if(index<0)throw Error('Dado fora da escala');return index+1;};
 const defense=guard=>4+grade(guard);
 const integrity=vigor=>6+(DICE.includes(vigor)?vigor:(()=>{throw Error('Vigor fora da escala')})());
 function resonance(pattern,chosen){
  if(!Array.isArray(pattern)||!Array.isArray(chosen)||pattern.length!==3||chosen.length!==3||[...pattern,...chosen].some(n=>!Number.isInteger(n)||n<1||n>4))
   throw Error('A Primeira Ressonância usa três d4 posicionados com faces 1–4');
  const matches=chosen.reduce((n,value,i)=>n+(value===pattern[i]?1:0),0);
  return Object.freeze({...DRAFT_RULES.resonanceOutcomes[matches],matches});
 }
 const echoDT=matches=>{
  if(!Number.isInteger(matches)||matches<1||matches>3)throw Error('Sem contato utilizável não existe Eco');
  return 5+DRAFT_RULES.resonanceOutcomes[matches].dtPenalty;
 };
 return Object.freeze({VERSION,STATUS,ATTRIBUTES,GROUPS,SKILLS,REGENCIES,DICE,DRAFT_RULES,SHEET,grade,defense,integrity,resonance,echoDT});
});
