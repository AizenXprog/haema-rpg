'use strict';
/* Interface opcional do candidato. Não importa nem sobrescreve fichas 0.1. */
function initHAEMAUnifiedLaboratory(){
 const root=document.getElementById('criacao');
 if(!root||root.dataset.haemaInit==='yes'||!window.HAEMAUnified)return;
 root.dataset.haemaInit='yes';
 const h=window.HAEMAUnified;
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
 $('reinforceMarks').addEventListener('click',()=>{
  if(!marks){$('latebraResult').textContent='Crie as Marcas primeiro.';return;}
  if(!confirm('O personagem gastou uma Ação Principal para reforçar o esconderijo, com cobertura plausível?'))return;
  const result=h.reinforceLatebra(available,h.roll(6));available=result.marks;
  $('latebraResult').textContent='MESTRE: '+(result.added?'Uma Marca nova foi adicionada.':'Nenhuma Marca acrescentada (duplicata ou limite).')+' Restam '+(available.join(', ')||'nenhuma')+'.';
 });
 $('noiseMarks').addEventListener('click',()=>{
  if(!marks)return;
  if(!confirm('Houve ruído forte que remove uma Marca oculta?'))return;
  const result=h.disturbLatebra(available,{noise:true});available=result.marks;
  $('latebraResult').textContent='MESTRE: ruído forte removeu a Marca '+(result.removed.join(', ')||'nenhuma')+'. '+(result.located?'Esconderijo localizado.':'Restam '+available.join(', '));
 });
 $('exposeMarks').addEventListener('click',()=>{
  if(!marks)return;
  if(!confirm('Houve exposição direta: esconderijo revelado independentemente das Marcas?'))return;
  const result=h.disturbLatebra(available,{exposed:true});available=result.marks;
  $('latebraResult').textContent='MESTRE: exposição direta. Esconderijo localizado, Marcas reveladas: '+result.removed.join(', ')+'.';
 });
 $('calcPE').addEventListener('click',()=>{
  const type=$('progressType').value,die=Number($('progressDie').value);
  try{$('peResult').textContent='Custo de d'+die+' para d'+(die+2)+': '+h.progressCost(type,die)+' PE. Requer vivência e condição apropriada, não só pontos.';}
  catch{$('peResult').textContent='Nenhum aumento disponível nessa progressão. Guarda inicia em d6 e todos os dados param em d12.';}
 });

 // Procedimentos médicos: testes exigem condição real, não curam ferimentos por magia.
 let deathState={integrity:character.integrity??h.integrity(character.attributes[2]),
  deathRisks:character.deathRisks||0,stable:character.stable!==false,firstDeathCheckDone:!!character.firstDeathCheckDone,dead:(character.deathRisks||0)>=3};
 function syncInjury(){
  $('woundCurrent').value=String(deathState.integrity);
  $('woundMax').value=String(h.integrity(character.attributes[2]));
  $('woundCount').value=String(character.wounds||0);
  character.integrity=deathState.integrity;
  character.deathRisks=deathState.deathRisks;
  character.stable=deathState.stable;
  character.firstDeathCheckDone=deathState.firstDeathCheckDone;
  save();
 }
 function injuryMsg(text){$('woundResult').textContent=text+' · Integridade '+deathState.integrity+' · Ferimentos '+character.wounds+' · Riscos de Morte '+deathState.deathRisks;}
 $('applyWound').addEventListener('click',()=>{
  const current=Number($('woundCurrent').value),max=Number($('woundMax').value),
   damage=Number($('woundDamage').value),wounds=Number($('woundCount').value);
  if(!Number.isInteger(current)||!Number.isInteger(max)||!Number.isInteger(damage)||damage<0||
    current<0||current>max||max!==h.integrity(character.attributes[2])||![0,1,2].includes(wounds)){
   injuryMsg('Valores inválidos; Integridade máxima é calculada pelo Vigor da ficha');return;
  }
  const r=h.damageState({current,max,wounds,damage});
  character.wounds=r.wounds;deathState.integrity=r.integrity;
  if(r.incapacitated&&current>0){deathState.deathRisks=0;deathState.stable=false;deathState.firstDeathCheckDone=false;}
  syncInjury();injuryMsg(r.newWound?'Ferimento registrado por esta fonte':'Dano registrado');
 });
 $('firstDeathCheck').addEventListener('click',()=>{
  if(deathState.integrity>0){injuryMsg('Não está incapacitado');return;}
  if(deathState.firstDeathCheckDone){injuryMsg('O teste inicial já ocorreu; não pode ser repetido');return;}
  const vigor=character.attributes[2],skill=character.skills[h.SKILLS.indexOf('Sobrevivência')];
  const a=h.roll(vigor),b=h.roll(skill),r=h.aid({withKit:true,attributeRoll:a,medicineRoll:b});
  deathState=h.deathRisk(deathState,{kind:'turn',rollSuccess:r.success});
  syncInjury();injuryMsg('Vigor d'+vigor+' ('+a+') + Sobrevivência d'+skill+' ('+b+') vs DT5: '+(r.success?'Estabilizou':'Falhou'));
 });
 $('dangerRound').addEventListener('click',()=>{
  if(deathState.integrity>0||deathState.stable){injuryMsg('Nenhum risco gerado: condição estável ou consciente');return;}
  if(!confirm('Há perigo físico efetivo e uma rodada completa se passou sem socorro?'))return;
  deathState=h.deathRisk(deathState,{kind:'dangerRound',underThreat:true});
  syncInjury();injuryMsg(deathState.dead?'Terceiro Risco: morte':'Mais um Risco de Morte');
 });
 $('stabilize').addEventListener('click',()=>{
  if(deathState.integrity>0||deathState.dead){injuryMsg('Socorro de incapacitado inaplicável');return;}
  const withKit=confirm('Há kit/materiais adequados? OK = kit DT5; Cancelar = improviso DT7 se plausível');
  const a=h.roll(character.attributes[3]),b=h.roll(character.skills[h.SKILLS.indexOf('Medicina')]);
  const result=h.aid({withKit,attributeRoll:a,medicineRoll:b});
  if(result.success)deathState=h.deathRisk(deathState,{kind:'stabilize',careProvided:true});
  syncInjury();injuryMsg('Socorro: '+a+'+'+b+' = '+result.total+' vs DT'+result.dt+' · '+(result.success?'estável':'sem estabilização'));
 });
 let usedRecovery=false;
 $('safeRecover').addEventListener('click',()=>{
  if(!confirm('Passaram 10 minutos de cuidados em segurança real?'))return;
  const r=h.safeRecovery({current:deathState.integrity,max:h.integrity(character.attributes[2]),
   safe:true,stable:deathState.stable,minutes:10,usedSceneReturn:usedRecovery});
  if(r.recovered){deathState.integrity=r.integrity;usedRecovery=true;}
  syncInjury();injuryMsg(r.recovered?'Voltou com 1 Integridade (limite da cena)':'Sem retorno automático: confira estabilidade, segurança e limite');
 });
 $('longRest').addEventListener('click',()=>{
  if(!confirm('Ocorreu descanso longo de aproximadamente 8h em segurança?'))return;
  const die=h.roll(6),r=h.longRest({current:deathState.integrity,max:h.integrity(character.attributes[2]),rollValue:die,safe:true});
  deathState.integrity=r.integrity;syncInjury();injuryMsg('Descanso longo 1d6='+die+' (Ferimentos permanecem)');
 });

 // Invicta: oportunidades técnicas são limitadas pelo personagem e pela cena.
 let sceneAwarded=false,essayAttempts=new Set();
 function invictaMsg(text){$('invictaResult').textContent='Invicta armazenada: '+character.invicta+'. '+text;}
 $('awardInvicta').addEventListener('click',()=>{
  const eligible=!!lastRoll?.invictaEligible;
  if(!h.invictaCanGain({eligible,current:character.invicta,sceneAwarded})){
   invictaMsg('Última rolagem não é elegível ou o limite da cena/personagem já foi alcançado.');return;
  }
  if(!confirm('O mestre confirmou risco real anunciado ANTES da rolagem e nenhuma outra Invicta recebida pelo grupo nesta cena?'))return;
  character.invicta=1;sceneAwarded=true;save();invictaMsg('Invicta obtida pelo feito técnico (registrada localmente)');
 });
 $('newScene').addEventListener('click',()=>{
  if(!confirm('Começou uma nova cena significativa para o grupo?'))return;
  sceneAwarded=false;usedRecovery=false;essayAttempts.clear();invictaMsg('Limite de cena reiniciado. Invicta já armazenada permanece.');
 });
 $('spendInvicta').addEventListener('click',()=>{
  const type=$('apexType').value,conditions=$('apexSituation').checked;
  const r=h.apex(type,{stored:character.invicta,actionSucceeded:conditions,validAnchor:conditions,
   adjacent:conditions,reactionAvailable:conditions,physicallyPossible:conditions,stableDiscovery:conditions,choiceOffered:conditions});
  if(!r.allowed){invictaMsg('Gasto não autorizado: confirme Invicta armazenada e todas as condições reais exigidas.');return;}
  if(!confirm('O mestre confirmou que esse Ápice ocorre após o sucesso pertinente e antes da resolução, e que as condições específicas são verdadeiras?'))return;
  character.invicta=0;save();
  invictaMsg('Ápice de '+type+' aplicado: '+r.explanation+(type==='golpe'?' · exemplo de dano bruto '+h.apexStrike(Number($('weapon').value)):''));
 });

 // Tanger requer a Descoberta completa, sem inventar um efeito padrão.
 fill($('regency'),h.REGENCIES.map(x=>[x,x]));
 fill($('regencyDie'),h.DICE.map(d=>[d,'d'+d]));
 fill($('discoverySkill'),h.SKILLS.map((name,i)=>[i,name+' · d'+character.skills[i]]));
 const getDiscovery=()=>({
  regency:$('regency').value,state:$('discoveryState').value,scale:$('discoveryScale').value,
  phenomenon:$('discoveryPhenomenon').value.trim(),anchor:$('discoveryAnchor').value.trim(),
  competence:h.SKILLS[Number($('discoverySkill').value)],
  effect:$('discoveryEffect').value.trim(),limits:$('discoveryLimits').value.trim(),
  duration:$('discoveryDuration').value.trim(),signal:$('discoverySignal').value.trim(),
  counterplay:$('discoveryCounterplay').value.trim(),risk:$('discoveryRisk').value.trim()
 });
 function regencyAccess(){
  const name=$('regency').value;
  if($('awakenedConfirmed').checked&&!character.awakened.includes(name)){
   if(confirm('O mestre realmente confirmou o Despertar desta Regência?')){character.awakened.push(name);save();}
   else return [];
  }
  return character.awakened;
 }
 $('tangerRoll').addEventListener('click',()=>{
  const d=getDiscovery(),check=h.validateDiscovery(d);if(!check.valid){$('tangerResult').textContent='Registro incompleto: '+check.errors.join('; ');return;}
  const awakened=regencyAccess(),regencyFace=Number($('regencyDie').value),
   skillFace=character.skills[Number($('discoverySkill').value)];
  const essayKey=d.regency+'|'+d.phenomenon+'|'+d.scale;
  if(d.state==='suspeita'&&essayAttempts.has(essayKey)){
   $('tangerResult').textContent='Este Ensaio já foi tentado nesta cena. É preciso nova cena ou hipótese materialmente diferente.';return;
  }
  if(d.state==='suspeita')essayAttempts.add(essayKey);
  const ra=h.roll(regencyFace),sa=h.roll(skillFace),essay=d.state==='suspeita';
  const result=h.tanger({discovery:d,awakened,regencyFace,skillFace,regencyRoll:ra,skillRoll:sa,
   preparations:$('preparedConfirmed').checked?2:0,canSustain:$('preparedConfirmed').checked,
   anchored:$('anchorConfirmed').checked,possible:true,essay});
  if(!result.allowed){$('tangerResult').textContent='Tanger não autorizado: '+result.reasons.join('; ');return;}
  $('tangerResult').textContent='Regência d'+regencyFace+' ('+ra+') + '+d.competence+' d'+skillFace+' ('+sa+') = '+result.total+' vs DT'+result.dt+': '+
   (result.success?'Sucesso matemático; mestre valida os efeitos já conhecidos.':'Falha: aplicar risco anteriormente anunciado.')+
   (result.tentative?' Ensaio provisório válido apenas nesta circunstância.':'');
  if(result.success){
   character.visualSignatures[d.regency]=$('visualSignature').value.slice(0,240);
   const exists=character.discoveries.some(x=>x.regency===d.regency&&x.phenomenon===d.phenomenon);
   if(!exists)character.discoveries.push(d);
   save();
  }
 });
 $('stabilizeDiscovery').addEventListener('click',()=>{
  const d=getDiscovery(),approved=$('studyConfirmed').checked;
  const result=h.stabilizeDiscovery({discovery:d,pe:character.pe,studyConfirmed:approved});
  if(!result.allowed){$('tangerResult').textContent='Não estabilizada: '+result.reason;return;}
  if(!confirm('O mestre confirmou o estudo, a demonstração em jogo e o custo de '+result.cost+' PE?'))return;
  character.pe=result.remainingPE;
  character.discoveries=character.discoveries.filter(x=>!(x.regency===d.regency&&x.phenomenon===d.phenomenon));
  character.discoveries.push(result.discovery);save();
  $('tangerResult').textContent='Descoberta Estável registrada com custo '+result.cost+' PE (saldo '+character.pe+'). Continua limitada ao efeito descrito.';
 });
 syncInjury();invictaMsg('A elegibilidade do grupo precisa de confirmação do mestre.');

 render();
}
document.addEventListener('DOMContentLoaded',initHAEMAUnifiedLaboratory);
document.addEventListener('haema:navigated',initHAEMAUnifiedLaboratory);