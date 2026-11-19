'use strict';
/* Técnicas humanas — Manual Unificado 19/11/2026. Critérios explícitos.
 * Verificação de vivência e pertinência continua pertencendo ao mestre.
 * Site e Sistema criado por Vitor Monte.
 */
(function(root,factory){
 if(typeof module==='object'&&module.exports)
  module.exports=factory(require('./rules-unified-playtest.js'),require('./techniques-unified-playtest.js'));
 else if(root)root.HAEMATechniquesRules=factory(root.HAEMAUnified,root.HAEMAUnifiedTechniques);
})(typeof window!=='undefined'?window:null,function(core,catalog){
 const KEYS=Object.freeze({
  1:[['Atletismo','Acrobacia','Luta','Pontaria','Armas Brancas','Furtividade']],
  2:[['Acrobacia']],3:[['Luta','Armas Brancas']],4:[['Luta','Armas Brancas']],
  5:[['Observação','Investigação','Estratégia']],6:[['Medicina','Tecnologia','Engenharia','Sobrevivência','Condução','Ladinagem']],
  7:[['Medicina'],['Atletismo']],8:[['Diplomacia']],9:[['Sobrevivência','Investigação']],
  10:[core.SKILLS],11:[['Pontaria']],12:[['Atletismo']],13:[['Luta']],
  14:[['Furtividade']],15:[['Estratégia']],16:[['Cultura','Sobrevivência']],
  17:[['Liderança']],18:[['Diplomacia']],19:[['Enganação']],20:[['Medicina']],
  21:[['Engenharia','Tecnologia']],22:[['Condução']]
 });
 function get(id){return catalog.find(t=>t.id===Number(id))||null;}
 function requirement(tech,character){
  if(!tech||!character||!Array.isArray(character.skills)||character.skills.length!==core.SKILLS.length)
   return {met:false,matched:[],needsMaster:true,reason:'Dados incompletos'};
  const threshold=tech.requirement.includes('d8')?8:6;
  const groups=KEYS[tech.id];
  if(!groups)return {met:false,matched:[],needsMaster:true,reason:'Requisito não mapeado'};
  const matched=groups.map(names=>names.filter(n=>character.skills[core.SKILLS.indexOf(n)]>=threshold));
  const met=matched.every(choices=>choices.length>0);
  // Mesmo nos critérios numéricos explícitos, vivência e condição precisam ser confirmadas.
  return {met,matched,needsMaster:true,reason:met?'Nível atendido; confirmar vivência com o mestre':'Competência insuficiente'};
 }
 function evaluate(character,id,{masterApproved=false}={}){
  const tech=get(id);
  if(!tech)return {allowed:false,reason:'Técnica desconhecida'};
  const known=Array.isArray(character?.techniques)&&character.techniques.includes(tech.name);
  if(known)return {allowed:false,reason:'Já adquirida'};
  const required=requirement(tech,character);
  if(!required.met)return {allowed:false,reason:required.reason,tech,required};
  if(!Number.isInteger(character.pe)||character.pe<tech.cost)return {allowed:false,reason:'PE insuficiente',tech,required};
  if(!masterApproved)return {allowed:false,reason:'Mestre deve confirmar vivência, contexto e requisitos',tech,required};
  return {allowed:true,reason:'Compra verificada',tech,required};
 }
 function acquire(character,id,options={}){
  const validation=evaluate(character,id,options);
  if(!validation.allowed)return {ok:false,reason:validation.reason,character};
  return {ok:true,reason:'Técnica adquirida',character:{
   ...character,pe:character.pe-validation.tech.cost,
   techniques:[...character.techniques,validation.tech.name]
  }};
 }
 return Object.freeze({catalog,requirement,evaluate,acquire});
});
