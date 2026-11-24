/* HÆMA — 126 técnicas realmente aprendíveis, em PLAYTEST.
 * Cada habilidade tem operação, vantagem específica, limite e exemplo.
 * Não concede permissão sobre ações que qualquer personagem já pode tentar.
 * O benefício mecânico só pertence a quem adquiriu o nó na Constelação.
 * Site e Sistema criado por Vitor Monte.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HaemaTrainingGuide=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const A={
 };
 function get(node){
  const match=/^s[0-6]:(x|[01]{1,3}):([1-6])$/.exec(node.id);
  if(!match)return null;
  const route=match[1];
  if(route!=='x'&&route.length!==1)return null;
  const entry=A[node.sector]?.[route]?.[Number(match[2])-1];
  return entry?{trigger:entry[0],effect:entry[1],limit:entry[2],example:entry[3]}:null;
 }
 return Object.freeze({get,all:A});
});
