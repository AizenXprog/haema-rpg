'use strict';
/* Interface opcional do candidato. Não importa nem sobrescreve fichas 0.1. */
document.addEventListener('DOMContentLoaded',()=>{
 const h=window.HAEMAUnified;if(!h)return;
 const $=id=>document.getElementById(id);
 const store='haema-character-unified-playtest-20261119';
 let character=h.createdCharacter(),marks=null,available=[],lastRoll=null;
 try{const raw=localStorage.getItem(store);if(raw){const c=JSON.parse(raw);if(h.validateCreation(c).valid)character=c;}}catch{}
 const option=(value,label)=>new Option(label??String(value),String(value));
 function fill(select,entries){select.replaceChildren(...entries.map(([v,t])=>option(v,t)));}
 function syncSelectors(){
  fill($('testAttr'),h.ATTR.map((name,i)=>[i,name+' · d'+character.attributes[i]]));
  fill($('testSkill'),h.SKILLS.map((name,i)=>[i,name+' · d'+character.skills[i]]));
  fill($('guard'),h.DICE.map(d=>[d,'d'+d+' · Defesa '+h.defense(d)]));
  fill($('latebraDie'),h.DICE.map(d=>[d,'d'+d]));
  fill($('progressDie'),h.DICE.map(d=>[d,'d'+d]));
 }
 function makeCounter(name,kind,index){
  const wrap=document.createElement('div');wrap.className='stat';
  const label=document.createElement('span');label.textContent=name;
  const controls=document.createElement('div');controls.className='controls';
  const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label','Reduzir '+name);
  const display=document.createElement('output');
  const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label','Aumentar '+name);
  for(const [btn,delta] of [[minus,-2],[plus,2]])btn.addEventListener('click',()=>change(kind,index,delta));
  controls.append(minus,display,plus);wrap.append(label,controls);wrap._ui={minus,plus,display};
  return wrap;
 }
 const attrRows=h.ATTR.map((s,i)=>makeCounter(s,'attributes',i));
 const skillRows=h.SKILLS.map((s,i)=>makeCounter(s,'skills',i));
 $('attributes').replaceChildren(...attrRows);
 let offset=0;
 for(const [group,names] of Object.entries(h.SKILL_GROUPS)){
  const section=document.createElement('section');
  const title=document.createElement('h3');title.textContent=group;
  const grid=document.createElement('div');grid.className='stats';grid.append(...skillRows.slice(offset,offset+names.length));
  offset+=names.length;section.append(title,grid);$('skills').append(section);
 }
 function used(key){return character[key].reduce((acc,d)=>acc+(d-4)/2,0);}
 function render(){
  $('name').value=character.name;$('job').value=character.job;
  for(const [key,rows,limit] of [['attributes',attrRows,4],['skills',skillRows,6]]){
   for(let i=0;i<rows.length;i++){
    const d=character[key][i],ui=rows[i]._ui;
    ui.display.textContent='d'+d;ui.minus.disabled=d===4;ui.plus.disabled=d===6||used(key)>=limit;
   }
  }
  $('attrBudget').textContent='· '+used('attributes')+'/4 distribuídos';
  $('skillBudget').textContent='· '+used('skills')+'/6 distribuídos';
  $('derived').textContent='Guarda inicial d6 · Defesa '+h.defense(6)+' · Integridade máxima '+h.integrity(character.attributes[2])+' · sem Despertar automático';
  const oldA=$('testAttr').value,oldS=$('testSkill').value;
  syncSelectors();$('testAttr').value=oldA||'0';$('testSkill').value=oldS||'0';
 }
 function change(key,index,delta){
  const v=character[key][index]+delta,limit=key==='attributes'?4:6;
  if(![4,6].includes(v)||(delta>0&&used(key)>=limit))return;
  character[key][index]=v;character.integrity=h.integrity(character.attributes[2]);render();save();
 }
 function save(){
  if(!h.validateCreation(character).valid){$('sheetStatus').textContent='Distribuição inválida';return;}
  try{localStorage.setItem(store,JSON.stringify(character));$('sheetStatus').textContent='Ficha experimental salva neste dispositivo, separada da 0.1';}
  catch{$('sheetStatus').textContent='Armazenamento indisponível: exporte sua ficha';}
 }
 $('name').addEventListener('input',e=>{character.name=e.target.value;save();});
 $('job').addEventListener('input',e=>{character.job=e.target.value;save();});
 $('save').addEventListener('click',save);
 $('reset').addEventListener('click',()=>{
  if(!confirm('Criar outra ficha experimental? Exporte esta antes para mantê-la. Fichas 0.1 nunca serão apagadas.'))return;
  character=h.createdCharacter();render();save();
 });
 $('export').addEventListener('click',()=>{
  const file=new Blob([JSON.stringify(character,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(file),a=document.createElement('a');
  a.href=url;a.download='HAEMA-manual-unificado-experimental.json';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 function choices(){
  const aIndex=Number($('testAttr').value),bIndex=Number($('testSkill').value);
  return {aFace:character.attributes[aIndex],bFace:character.skills[bIndex],aName:h.ATTR[aIndex],bName:h.SKILLS[bIndex]};
 }
 $('rollTest').addEventListener('click',()=>{
  const d=choices(),a=h.roll(d.aFace),b=h.roll(d.bFace),dt=Number($('testDT').value),modifier=Number($('modifier').value);
  const r=h.exceptional({aFace:d.aFace,bFace:d.bFace,aRoll:a,bRoll:b,dt,modifier,realDanger:$('danger').checked});
  const total=r.total,success=r.success;
  lastRoll={...r,modifier,success};
  const chance=(100*h.probability(d.aFace,d.bFace,dt)).toFixed(1);
  $('rollResult').textContent=d.aName+' d'+d.aFace+' ('+a+') + '+d.bName+' d'+d.bFace+' ('+b+') '+(modifier>=0?'+':'')+modifier+' = '+total+' contra DT '+dt+'. '+(success?'Sucesso matemático.':'Falha matemática.')+
   ' Chance sem modificador: '+chance+'%. '+(r.critical?'Condição natural de crítico alcançada (em ação elegível). ':'')+
   (r.invictaEligible?'Candidato técnico de Invicta: confirme limite pessoal e da cena. ':'')+'O mestre determina possibilidade e consequências.';
 });
 $('rollCombat').addEventListener('click',()=>{
  const d=choices(),a=h.roll(d.aFace),b=h.roll(d.bFace),guard=Number($('guard').value);
  const defenseValue=h.defense(guard,{shield:$('shield').checked,partialCover:$('cover').checked});
  const weapon=Number($('weapon').value),weaponRoll=h.roll(weapon);
  const base=h.exceptional({aFace:d.aFace,bFace:d.bFace,aRoll:a,bRoll:b,dt:defenseValue});
  const r=h.attack({aFace:d.aFace,bFace:d.bFace,aRoll:a,bRoll:b,defenseValue,weaponFace:weapon,weaponRoll,armor:Number($('armor').value),parry:Number($('parry').value),criticalChoice:base.critical?'impact':'none'});
  $('combatResult').textContent='Ataque '+a+'+'+b+' = '+r.total+' vs Defesa '+defenseValue+'. '+(r.landed?'Acertou. Dano da arma '+weaponRoll+', resultado final '+r.damage+'.':'Não acertou.')+
   (r.critical?' Crítico: Impacto (+2 bruto) foi usado apenas como exemplo; Virada seria escolha alternativa.':'')+
   ' Esquiva não foi rolada: se usada e bem-sucedida, evita o ataque. Mestre valida linha, Aparo e manobras.';
 });
 $('rollMetus').addEventListener('click',()=>{
  const d=choices(),a=h.roll(d.aFace),b=h.roll(d.bFace),level=Number($('metusLevel').value),fear=h.roll(level),r=h.metus(a,b,fear);
  $('metusResult').textContent='Dados: '+a+' e '+b+'. Metus d'+level+' tirou '+fear+'. Resultado após anulação: '+r.rolls.join(' + ')+' = '+r.total+'. '+r.canceled.filter(Boolean).length+' dado(s) anulados. Igualdade nunca anula.';
 });
 $('createMarks').addEventListener('click',()=>{
  marks=h.initialLatebra(Number($('latebraDie').value));available=[...marks];
  $('latebraResult').textContent='MESTRE: Marcas secretas '+available.join(', ')+'. Não mostrar ao jogador.';
 });
 function search(intensive){
  if(!marks){$('latebraResult').textContent='Crie as Marcas primeiro.';return;}
  const rolls=Array.from({length:intensive?2:1},()=>h.roll(6));
  const r=h.searchLatebra(available,rolls);available=r.remaining;
  $('latebraResult').textContent='MESTRE: Busca '+(intensive?'Intensiva (Ação + Movimento)':'Rápida (Ação)')+', resultado '+rolls.join(', ')+'. Reveladas '+(r.discovered.join(', ')||'nenhuma')+'. Restam '+(available.join(', ')||'nenhuma')+'. '+(r.located?'Esconderijo localizado.':'Ainda oculto.');
 }
 $('quickSearch').addEventListener('click',()=>search(false));$('intensiveSearch').addEventListener('click',()=>search(true));
 $('calcPE').addEventListener('click',()=>{
  const type=$('progressType').value,die=Number($('progressDie').value);
  try{$('peResult').textContent='Custo de d'+die+' para d'+(die+2)+': '+h.progressCost(type,die)+' PE. Requer vivência e condição apropriada, não só pontos.';}
  catch{$('peResult').textContent='Nenhum aumento disponível nessa progressão. Guarda inicia em d6 e todos os dados param em d12.';}
 });
 render();
});