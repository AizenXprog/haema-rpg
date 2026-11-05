'use strict';
/** Visual teaching layer. Reads events from the 0.1 rules engine; never rolls or changes game state. */
let removeDemoListener=()=>{};
function initExperience(){
 removeDemoListener();
 const $=s=>document.querySelector(s);
 const steps=[
  {title:'Você descreve uma ação',body:'Em HÆMA, diga o que seu personagem pretende fazer. O narrador descreve a situação e só pede rolagem quando existe risco ou consequência.',scene:'EXEMPLO DE MESA · Você tenta saltar entre dois telhados. A queda seria perigosa, então o narrador pede um teste.',chapter:'resolucao'},
  {title:'Escolha atributo e competência',body:'Se houver risco, o narrador escolhe dois dados graduados que façam sentido: um do atributo e outro da competência. Não existe uma dupla fixa para toda situação.',scene:'EXEMPLO DE MESA · Neste salto, a combinação escolhida é Destreza d6 + Atletismo d4. Os dados variam conforme a ficha e a ação.',chapter:'criacao'},
  {title:'Role os dois dados e some',body:'Some os números que saírem nos dados, não as faces totais. Compare o resultado com a Dificuldade do Teste (DT) definida pelo narrador. Alcançar exatamente a DT é sucesso.',scene:'EXEMPLO DIDÁTICO · d6 mostra 4 e d4 mostra 3. Total = 7. Contra DT 7, você tem sucesso.',chapter:'resolucao'},
  {title:'A história continua',body:'O narrador descreve o que aconteceu. Uma falha não precisa encerrar a cena: ela pode trazer um custo, atraso, ruído ou risco. Para avançar, pratique no laboratório abaixo.',scene:'PRÓXIMO PASSO · Vá ao capítulo Resolução e faça o salto entre telhados no laboratório.',chapter:'resolucao'}
 ];
 if($('#lesson-next')){
  let page=0;const prev=$('#lesson-prev'),next=$('#lesson-next');
  const paint=()=>{
   const s=steps[page];$('#lesson-counter').textContent='PASSO '+String(page+1).padStart(2,'0')+' / 04';$('#lesson-title').textContent=s.title;
   $('#lesson-body').textContent=s.body;$('#lesson-scene').textContent=s.scene;
   $('#lesson-deep').href='#'+s.chapter;$('#lesson-fill').style.width=(page+1)*25+'%';
   $('#lesson-step-label').textContent=(page+1)+' DE 4';prev.disabled=page===0;next.textContent=page===3?'RECOMEÇAR ↺':'PRÓXIMO PASSO →';
   $('#lesson-counter').closest('.lesson-content').classList.remove('lesson-change');void $('#lesson-title').offsetWidth;
   if(!matchMedia('(prefers-reduced-motion: reduce)').matches)$('#lesson-counter').closest('.lesson-content').classList.add('lesson-change');
  };
  prev.addEventListener('click',()=>{page=Math.max(0,page-1);paint()});
  next.addEventListener('click',()=>{page=(page+1)%4;paint()});
  $('#lesson-deep').addEventListener('click',()=>{const ch=document.getElementById(steps[page].chapter);if(ch?.tagName==='DETAILS')ch.open=true});
  paint();
 }
 const rooftop=$('#rooftop-demo');
 if(rooftop)rooftop.addEventListener('click',()=>{
  const attr=$('#lab-attr'),skill=$('#lab-skill'),difficulty=$('#lab-dt'),roll=$('#lab-roll');
  if(!attr||!skill||!difficulty||!roll)return;
  attr.value='6';skill.value='4';difficulty.value='7';
  const notice=$('#rooftop-note');if(notice)notice.textContent='Destreza d6 + Atletismo d4, DT 7. Confira abaixo o resultado sorteado de verdade.';
  roll.click();$('#lab-test')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
 });
 const element=(tag,cls,value)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(value!=null)e.textContent=value;return e};
 function dice(stage,rolls,steps,title,successful){
  const root=$(stage);if(!root)return;root.replaceChildren();root.className='demonstration-stage'+(successful===true?' demo-success':successful===false?' demo-failure':'');
  if(title)root.append(element('div','demo-headline',title));
  const tray=element('div','visual-dice-tray');
  for(const d of rolls){
   const unit=element('div','visual-die'+(d.canceled?' is-cancelled':'')+(d.type==='metus'?' is-metus':''));
   unit.append(element('span','visual-die-label',d.label+' · D'+d.faces));
   const poly=element('div','visual-die-shell');poly.dataset.faces=String(d.faces);
   poly.append(element('span','visual-die-numeral',String(d.roll)));unit.append(poly);
   if(d.canceled)unit.append(element('span','visual-die-flag','ANULADO'));
   tray.append(unit);
  }
  root.append(tray);
  const timeline=element('ol','demo-calculation');
  steps.forEach((s,i)=>{const row=element('li','demo-calc-step');row.append(element('span','demo-calc-number',String(i+1).padStart(2,'0')));row.append(element('span','demo-calc-text',s));timeline.append(row)});
  root.append(timeline);
 }
 const onDemonstrate=event=>{
  const v=event.detail;
  if(!v||!v.kind)return;
  if(v.kind==='test')dice('#visual-lab-test',[
   {label:'Atributo',faces:v.a,roll:v.x},{label:'Competência',faces:v.b,roll:v.y}
  ],[`Dado do atributo = ${v.x}; dado da competência = ${v.y}.`,`Soma: ${v.x} + ${v.y} = ${v.total}.`,`Comparação com DT ${v.dt}: ${v.total} ${v.total>=v.dt?'≥':'<'} ${v.dt}. ${v.success?'SUCESSO':'FALHA'}.`],v.success?'A DT foi alcançada':'A DT não foi alcançada',v.success);
  if(v.kind==='metus'){
   dice('#visual-lab-metus',[
    {label:'Atributo',faces:v.a,roll:v.x,canceled:v.x<v.z},
    {label:'Competência',faces:v.b,roll:v.y,canceled:v.y<v.z},
    {label:'Metus',faces:v.m,roll:v.z,type:'metus'}
   ],[`Metus mostra ${v.z}. Só anula resultados estritamente menores que ${v.z}.`,`Restam ${v.rx} e ${v.ry}: ${v.rx} + ${v.ry} = ${v.total}.`,`Comparação com DT ${v.dt}: ${v.success?'SUCESSO':'FALHA'}. Empate com Metus não anula.`],v.success?'O personagem resiste à interferência':'O medo compromete o teste',v.success);
  }
  if(v.kind==='combat'){
   let reactionText='Sem reação defensiva';
   if(v.reaction==='dodge')reactionText=v.dodged?`Esquiva: ${v.dodgeX} + ${v.dodgeY} = ${v.dodgeTotal} ≥ ataque ${v.total}; o golpe foi evitado.`:`Esquiva: ${v.dodgeX} + ${v.dodgeY} = ${v.dodgeTotal} < ataque ${v.total}; o golpe continua.`;
   if(v.reaction==='parry')reactionText=`Aparo: ${v.parryRoll} no dado → redução de ${v.parryAmount} (⌊${v.parryRoll}/2⌋).`;
   const phases=[`Ataque: ${v.x} + ${v.y} = ${v.total}. Defesa = 1 + Guarda ${v.guard}${v.cover?` + cobertura ${v.cover}`:''} = ${v.defense}.`,v.hit?`Acertou. ${v.critical?'Crítico experimental: +2 no dano.':'Sem crítico.'}`:'Errou. Não há reação nem rolagem de dano.',v.hit?reactionText:'Nenhuma reação necessária.',v.hit? v.dodged?'Esquiva bem-sucedida: dano final 0.':`Dano: ${v.damageRoll}${v.critical?' + 2':''} − armadura ${v.armor}${v.parryAmount?' − Aparo '+v.parryAmount:''} = ${v.final}.`:'Dano final = 0.'];
   const rolls=[{label:'Atributo',faces:v.a,roll:v.x},{label:'Competência',faces:v.b,roll:v.y}];
   if(v.hit&&v.reaction==='dodge')rolls.push({label:'Esquiva · Des.',faces:v.dodgeA,roll:v.dodgeX},{label:'Esquiva · Acrob.',faces:v.dodgeB,roll:v.dodgeY});
   if(v.hit&&v.reaction==='parry')rolls.push({label:'Aparo',faces:v.parryFace,roll:v.parryRoll});
   if(v.damageRoll!=null)rolls.push({label:'Arma',faces:v.weapon,roll:v.damageRoll});
   dice('#visual-lab-combat',rolls,phases,v.hit?(v.dodged?'A Esquiva evitou o ataque':v.final?'Impacto resolvido':'Golpe absorvido'):'O ataque não alcançou a Defesa',v.hit&&!v.dodged&&v.final>0);
  }
  if(v.kind==='latebra'){
   const root=$('#visual-lab-latebra');if(!root)return;
   root.replaceChildren();root.className='demonstration-stage latebra-stage';
   root.append(element('div','demo-headline','Registro da ocultação'));
   const info=element('div','latebra-visual-head');
   info.append(element('strong','',`${v.found} revelada(s)`));info.append(element('span','',`${v.hidden} marcas ainda ocultas`));root.append(info);
   const bar=element('div','latebra-visual-progress');const fill=element('span','');fill.style.width=(v.total?100*v.found/v.total:0)+'%';bar.append(fill);root.append(bar);
   root.append(element('p','latebra-visual-event',v.message||'As marcas secretas não são exibidas para quem procura.'));
  }
  };
 document.addEventListener('haema:demonstrate',onDemonstrate);
 removeDemoListener=()=>document.removeEventListener('haema:demonstrate',onDemonstrate);
}
initExperience();
document.addEventListener('haema:navigated',initExperience);