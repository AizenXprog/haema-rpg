'use strict';
/** HÆMA 0.1 — Núcleo Jogável. Only rules explicitly present in docs/HAEMA_0.1_Nucleo_Jogavel.md. */
(()=>{
 const $=q=>document.querySelector(q), $$=q=>Array.from(document.querySelectorAll(q));
 // Single shared rules kernel for the manual, the character sheet, and every demonstrator.
 const core=window.HAEMA01;
 if(!core)throw new Error('O núcleo de regras HÆMA 0.1 não foi carregado.');
 const {ATTR,SKILL_GROUPS,SKILLS,DICE}=core;
 const STORAGE='haema-character-0.1',LEGACY=['haema-character-v2','haema-draft-v1'];
 const sumSteps=core.steps,grade=core.grade,die=core.die;
 const bounded=(x,min,max)=>Math.min(max,Math.max(min,Number.isFinite(+x)?Math.trunc(+x):min));
 const opt=(label,val)=>new Option(label,String(val));
 function fillDice(select,values=DICE){
  if(!select)return;select.replaceChildren();values.forEach(v=>select.add(opt('d'+v,v)));
 }
 function download(filename,content){
  const url=URL.createObjectURL(new Blob([content],{type:'application/json;charset=utf-8'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;
  document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function showResult(selector,value){const el=$(selector);if(el)el.textContent=value;}

 // Character creation v0.1. Never read the old v2 key except to offer an archival export.
 const fresh=()=>({format:'haema-character',version:'0.1',name:'',job:'',attributes:Array(6).fill(4),skills:Array(24).fill(4),wounds:0,integrity:null,stamina:null,impetus:0,overload:0,metus:0});
 function normalize(input){
  if(!input||typeof input!=='object'||input.format!=='haema-character'||input.version!=='0.1')return null;
  if(!Array.isArray(input.attributes)||input.attributes.length!==6||!input.attributes.every(x=>[4,6,8].includes(x))||sumSteps(input.attributes)>6)return null;
  if(!Array.isArray(input.skills)||input.skills.length!==24||!input.skills.every(x=>[4,6,8].includes(x))||sumSteps(input.skills)>8)return null;
  const next=fresh();next.name=String(input.name??'').slice(0,80);next.job=String(input.job??'').slice(0,100);
  next.attributes=[...input.attributes];next.skills=[...input.skills];
  next.wounds=bounded(input.wounds,0,2);next.impetus=bounded(input.impetus,0,3);next.overload=bounded(input.overload,0,6);
  next.metus=[0,4,6,8].includes(input.metus)?input.metus:0;
  next.integrity=input.integrity===null?null:bounded(input.integrity,0,10+next.attributes[2]);
  next.stamina=input.stamina===null?null:bounded(input.stamina,0,6+grade(next.attributes[2])-next.wounds);
  return next;
 }
 let char=fresh();
 try{const raw=localStorage.getItem(STORAGE);if(raw){const valid=normalize(JSON.parse(raw));if(valid)char=valid;}}catch{}
 const hasSheet=!!$('#attributes-v01');
 function persist(){
  try{localStorage.setItem(STORAGE,JSON.stringify(char));showResult('#sheet-status','◈ Salvo neste dispositivo');}
  catch{showResult('#sheet-status','Armazenamento indisponível — exporte uma cópia');}
 }
 const maxima=()=>core.resources(char.attributes[2],char.wounds);
 function syncResources(){
  if(!hasSheet)return;
  const {integrity,stamina}=maxima();
  if(char.integrity===null)char.integrity=integrity;if(char.stamina===null)char.stamina=stamina;
  char.integrity=bounded(char.integrity,0,integrity);char.stamina=bounded(char.stamina,0,stamina);
  showResult('#char-integrity',String(integrity));showResult('#char-stamina',String(stamina));
  for(const [id,value,max] of [['#char-integrity-now',char.integrity,integrity],['#char-stamina-now',char.stamina,stamina]]){
   const el=$(id);el.max=max;el.value=value;
  }
  $('#char-wounds').value=String(char.wounds);$('#char-impetus').value=String(char.impetus);$('#char-overload').value=String(char.overload);$('#char-metus').value=String(char.metus);
 }
 function counter(name,value,canLess,canMore,kind,index){
  const row=document.createElement('div');row.className='v01-counter';
  const nm=document.createElement('span');nm.textContent=name;nm.className='v01-counter-title';
  const controls=document.createElement('div');controls.className='v01-counter-controls';
  const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.disabled=!canLess;minus.setAttribute('aria-label','Reduzir '+name);
  const val=document.createElement('strong');val.textContent='d'+value;val.className='v01-counter-die';
  const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.disabled=!canMore;plus.setAttribute('aria-label','Aumentar '+name);
  minus.addEventListener('click',()=>adjust(kind,index,-2));plus.addEventListener('click',()=>adjust(kind,index,+2));
  controls.append(minus,val,plus);row.append(nm,controls);return row;
 }
 function adjust(kind,index,delta){
  const key=kind==='attr'?'attributes':'skills',budget=kind==='attr'?6:8;
  const v=char[key][index];if(v+delta<4||v+delta>8||delta>0&&sumSteps(char[key])>=budget)return;
  const was=maxima();const fullI=char.integrity===was.integrity,fullS=char.stamina===was.stamina;
  char[key][index]=v+delta;
  const now=maxima();if(fullI)char.integrity=now.integrity;if(fullS)char.stamina=now.stamina;
  renderSheet();persist();
 }
 function refreshDice(){
  const attr=$('#roll-attr-v01'),skill=$('#roll-skill-v01');if(!attr||!skill)return;
  const a=attr.value,b=skill.value;attr.replaceChildren();skill.replaceChildren();
  ATTR.forEach((n,i)=>attr.add(opt(n+' · d'+char.attributes[i],i)));
  SKILLS.forEach((n,i)=>skill.add(opt(n+' · d'+char.skills[i],i)));
  attr.value=a&&+a>=0&&+a<6?a:'0';skill.value=b&&+b>=0&&+b<24?b:'0';
 }
 function renderSheet(){
  if(!hasSheet)return;
  $('#attributes-v01').replaceChildren();$('#skills-v01').replaceChildren();
  const aleft=6-sumSteps(char.attributes),sleft=8-sumSteps(char.skills);
  showResult('#attr-points-v01',aleft+' avanços disponíveis');showResult('#skill-points-v01',sleft+' avanços disponíveis');
  ATTR.forEach((n,i)=>$('#attributes-v01').append(counter(n,char.attributes[i],char.attributes[i]>4,aleft>0&&char.attributes[i]<8,'attr',i)));
  let i=0;for(const [group,names] of Object.entries(SKILL_GROUPS)){
   const wrap=document.createElement('section');wrap.className='v01-skill-group';
   const heading=document.createElement('h4');heading.textContent=group;wrap.append(heading);
   names.forEach(n=>{wrap.append(counter(n,char.skills[i],char.skills[i]>4,sleft>0&&char.skills[i]<8,'skill',i));i++;});$('#skills-v01').append(wrap);
  }
  $('#char-name-v01').value=char.name;$('#char-job-v01').value=char.job;
  syncResources();refreshDice();
 }
 if(hasSheet){
  renderSheet();showResult('#sheet-status','◈ Salvo neste dispositivo');
  for(const [id,key] of [['#char-name-v01','name'],['#char-job-v01','job']]){
   $(id).addEventListener('input',e=>{char[key]=e.target.value;persist()});
  }
  for(const [id,key,max] of [['#char-wounds','wounds',2],['#char-impetus','impetus',3],['#char-overload','overload',6]]){
   $(id).addEventListener('change',e=>{
    const old=maxima();const wasFull=char.stamina===old.stamina;
    char[key]=bounded(e.target.value,0,max);
    if(key==='wounds'&&wasFull)char.stamina=maxima().stamina;
    syncResources();persist();
   });
  }
  for(const [id,key] of [['#char-integrity-now','integrity'],['#char-stamina-now','stamina']]){
   $(id).addEventListener('change',e=>{char[key]=bounded(e.target.value,0,maxima()[key]);syncResources();persist()});
  }
  $('#char-metus').addEventListener('change',e=>{char.metus=+e.target.value;persist()});
  $('#save-export-v01').addEventListener('click',()=>{
   const safe=(char.name||'personagem').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'-').slice(0,30);
   download('HAEMA-0.1-'+safe+'.json',JSON.stringify(char,null,2));
  });
  $('#load-import-v01').addEventListener('click',()=>$('#import-file-v01').click());
  $('#import-file-v01').addEventListener('change',async e=>{
   const file=e.target.files?.[0];e.target.value='';if(!file)return;
   if(file.size>100000){showResult('#sheet-status','Arquivo excede 100 KB');return;}
   try{const v=normalize(JSON.parse(await file.text()));if(!v)throw new Error('Versão incompatível');char=v;renderSheet();persist();}
   catch{showResult('#sheet-status','Arquivo inválido ou de outra versão — nada foi substituído');}
  });
  $('#reset-v01').addEventListener('click',()=>{if(!confirm('Iniciar outra ficha 0.1? A ficha anterior 0.1 será substituída neste aparelho. Exporte antes se quiser guardá-la.'))return;char=fresh();renderSheet();persist()});
  let old={};try{for(const key of LEGACY){const raw=localStorage.getItem(key);if(raw)old[key]=raw;}}catch{}
  if(Object.keys(old).length){
   $('#legacy-alert').hidden=false;
   $('#legacy-export').addEventListener('click',()=>download('HAEMA-FICHAS-ANTIGAS-ARQUIVO.json',JSON.stringify({archive:'haema-legacy',readOnly:true,storedKeys:old},null,2)));
  }
 }

 // Mesa central roll: exact two graded dice and difficulty (equal succeeds).
 if($('#roll-btn-v01')){
  $('#roll-btn-v01').addEventListener('click',()=>{
   const ai=+$('#roll-attr-v01').value,si=+$('#roll-skill-v01').value,a=char.attributes[ai],b=char.skills[si],cd=+$('#roll-cd-v01').value;
   const x=die(a),y=die(b),sum=x+y;
   showResult('#roll-a-v01',String(x));showResult('#roll-b-v01',String(y));showResult('#roll-total-v01',String(sum));
   showResult('#roll-verdict-v01',sum>=cd?'SUCESSO · '+sum+' ≥ '+cd:'FALHA · '+sum+' < '+cd);
   showResult('#roll-breakdown-v01',ATTR[ai]+' d'+a+' ('+x+') + '+SKILLS[si]+' d'+b+' ('+y+') = '+sum+' / CD '+cd);
   $$('.v01-die-display').forEach(el=>{el.classList.remove('roll-flash');void el.offsetWidth;el.classList.add('roll-flash')});
  });
 }

 // Manual live search: search full chapter text, including technical appendices.
 if($('#manual-search')){
  const input=$('#manual-search'),chapters=$$('.manual-chapter'),counter=$('#manual-count');
  input.addEventListener('input',()=>{
   const term=input.value.toLocaleLowerCase('pt-BR').trim();let matches=0;
   chapters.forEach(ch=>{const found=!term||ch.textContent.toLocaleLowerCase('pt-BR').includes(term);ch.hidden=!found;if(found)matches++;if(term&&found)ch.open=true;});
   showResult('#manual-count',matches+' '+(matches===1?'capítulo':'capítulos'));
   $('#manual-search-empty').hidden=!!matches;
  });
  $$('.manual-index-link').forEach(link=>link.addEventListener('click',()=>{
   const el=$(link.getAttribute('href'));if(el)el.open=true;
   if(input.value){input.value='';input.dispatchEvent(new Event('input'));}
  }));
  const h=location.hash?document.getElementById(location.hash.slice(1)):null;if(h?.matches('.manual-chapter'))h.open=true;
 }

 // Interactive example: resolution.
 for(const key of ['#lab-attr','#lab-skill','#atk-attr','#atk-skill','#atk-guard','#atk-weapon','#met-attr','#met-skill','#late-die','#res-vigor','#inv-attr','#inv-skill'])fillDice($(key));
 if($('#lab-roll'))$('#lab-roll').addEventListener('click',()=>{
  const a=+$('#lab-attr').value,b=+$('#lab-skill').value,cd=+$('#lab-dc').value,x=die(a),y=die(b);
  showResult('#lab-test-result',`Atributo d${a}: ${x} · Competência d${b}: ${y} · Total ${x+y} / CD ${cd} — ${x+y>=cd?'SUCESSO':'FALHA'}.`);
 });

 // Combat: exact attack/critical/damage proposal; explicitly no reactions or special tactics.
 if($('#atk-roll'))$('#atk-roll').addEventListener('click',()=>{
  const a=+$('#atk-attr').value,b=+$('#atk-skill').value,g=+$('#atk-guard').value,armor=+$('#atk-armor').value,w=+$('#atk-weapon').value,cover=+$('#atk-cover').value;
  const d=1+g+cover,x=die(a),y=die(b),hit=x+y>=d,critical=hit&&(x===a||y===b)&&(x+y>=d+3);
  let detail=`Dados ${x} (d${a}) + ${y} (d${b}) = ${x+y} contra Defesa ${d}`;
  if(hit){const dmg=die(w),final=Math.max(0,dmg+(critical?2:0)-armor);detail+=` · ACERTO${critical?' CRÍTICO (+2 · proposta)':''} · Dano ${dmg}${critical?' + 2':''} − armadura ${armor} = ${final}.`;}else detail+=' · ERROU · Sem dano.';
  if(w===10)detail+=' Arma devastadora: custa 1 Fôlego e normalmente gera Ruído Forte (não debitado aqui).';
  showResult('#atk-result',detail);
 });

 // Resources: transparent derived formulas; not a persistent character state.
 function renderResources(){
  if(!$('#res-vigor'))return;
  const vigor=+$('#res-vigor').value,wounds=+$('#res-wounds').value;
  const {integrity:maxI,stamina:maxS}=core.resources(vigor,wounds);
  for(const [id,max] of [['#res-life',maxI],['#res-stamina',maxS]]){
   const el=$(id);if(+el.max!==max){const wasFull=+el.value===+el.max;el.max=String(max);if(wasFull)el.value=String(max);else el.value=String(Math.min(+el.value,max));}
  }
  const lp=+$('#res-life').value,sp=+$('#res-stamina').value,over=+$('#res-overload').value;
  showResult('#res-life-label',lp+'/'+maxI);showResult('#res-stamina-label',sp+'/'+maxS);showResult('#res-overload-label',over+'/6');
  $('#res-life-track').style.width=(lp/maxI*100)+'%';$('#res-stamina-track').style.width=(sp/maxS*100)+'%';$('#res-overload-track').style.width=(over/6*100)+'%';
  let status=lp===0?'Incapacitado; testes de estabilização no início dos turnos seguintes.':'Integridade acima de zero.';
  if(wounds)status+=` ${wounds} Ferimento(s) reduz(em) o Fôlego máximo.`;
  if(over>=4&&over<=5)status+=' Sobrecarga 4–5: −1 em testes sob pressão.';
  if(over===6)status+=' Sobrecarga 6: não pode Forçar o Corpo novamente até reduzir.';
  showResult('#res-result',`Integridade = 10 + ${vigor} = ${maxI}. Fôlego máximo = 6 + grau ${grade(vigor)} − ${wounds} = ${maxS}. ${status}`);
 }
 if($('#res-vigor')){
  ['#res-vigor','#res-wounds','#res-life','#res-stamina','#res-overload'].forEach(id=>$(id).addEventListener('input',renderResources));renderResources();
 }

 // Metus: strict less-than cancellation and simultaneous normal rolls.
 if($('#met-roll'))$('#met-roll').addEventListener('click',()=>{
  const a=+$('#met-attr').value,b=+$('#met-skill').value,m=+$('#met-die').value,cd=+$('#met-dc').value;
  const x=die(a),y=die(b),z=die(m),{first:rx,second:ry}=core.applyMetus(x,y,z);
  showResult('#met-result',`Dado de atributo: ${x}${rx===0?' (anulado)':''}. Competência: ${y}${ry===0?' (anulado)':''}. Metus d${m}: ${z}. Resultado ${rx} + ${ry} = ${rx+ry} / CD ${cd} — ${rx+ry>=cd?'SUCESSO':'FALHA'}. Empate com Metus não anula.`);
 });

 // Latebra: unique secret marks, rules-based rerolls and individual searches.
 const late={active:false,finished:false,all:new Set(),found:new Set(),metus:0,attempts:0};
 function lateRefresh(message){
  const box=$('#late-marks');if(!box)return;box.replaceChildren();
  if(!late.active){box.textContent='Crie sua Latebra para iniciar.';return;}
  [...late.all].forEach(n=>{
   const el=document.createElement('span');el.className='late-mark'+(late.found.has(n)?' found':'');
   el.textContent=late.found.has(n)?String(n)+' ✓':'✦';el.title=late.found.has(n)?'Marca encontrada':'Marca secreta';box.append(el);
  });
  const left=[...late.all].filter(n=>!late.found.has(n)).length;
  late.finished=left===0;
  for(const id of ['#late-quick','#late-deep','#late-reinforce'])$(id).disabled=late.finished;
  showResult('#late-result',message+' · '+left+' marca(s) ainda oculta(s).'+(late.finished?' ESCONDERIJO DESCOBERTO.':''));
 }
 if($('#late-create')){
  $('#late-create').addEventListener('click',()=>{
   const faces=+$('#late-die').value,m=+$('#late-metus').value;
   const cfg=faces===4?[2,4,0]:faces===6?[2,6,1]:faces===8?[3,6,1]:faces===10?[3,6,2]:[4,6,2];
   late.all=new Set();late.found=new Set();late.active=true;late.finished=false;late.metus=m;late.attempts=0;
   let removedByMetus=false;
   for(let i=0;i<cfg[0];i++){
    let n=die(cfg[1]);for(let k=0;k<cfg[2]&&late.all.has(n);k++)n=die(cfg[1]);
    if(i===cfg[0]-1&&m>0&&n<die(m)){removedByMetus=true;continue;}
    late.all.add(n);
   }
   lateRefresh(`Latebra d${faces} formada${removedByMetus?' · Metus anulou o último dado inicial':''}. Duplicatas contam uma vez`);
  });
  function search(intensive){
   if(!late.active||late.finished)return;
   const rolls=Array.from({length:intensive?2:1},()=>die(6)),newFound=[];
   rolls.forEach(n=>{if(late.all.has(n)&&!late.found.has(n)){late.found.add(n);newFound.push(n)}});
   late.attempts++;
   lateRefresh(`Busca ${intensive?'Intensiva':'Rápida'} ${late.attempts}: ${rolls.join(' e ')}${newFound.length?' · Encontrou '+newFound.join(', '):' · Nenhuma marca nova'}`);
  }
  $('#late-quick').addEventListener('click',()=>search(false));$('#late-deep').addEventListener('click',()=>search(true));
  $('#late-reinforce').addEventListener('click',()=>{
   if(!late.active||late.finished)return;
   const left=late.all.size-late.found.size;
   if(left>=4){lateRefresh('Teto de quatro marcas ainda não encontradas');return;}
   const n=die(6);
   if(late.metus&&n<die(late.metus)){lateRefresh('Metus anulou o dado de Reforço');return;}
   if(late.all.has(n)||late.found.has(n)){lateRefresh('Reforço com resultado repetido: não acrescenta marca');return;}
   late.all.add(n);lateRefresh('Reforço criou uma nova marca oculta');
  });
 }

 // Invicta: dice only. No rule for granting Invicta is automated.
 const INV_THRESHOLD=core.INV_THRESHOLDS,INV_CHANCE=core.INV_CHANCES;
 function invUpdate(){
  if(!$('#inv-attr'))return;
  const a=+$('#inv-attr').value,b=+$('#inv-skill').value;
  const cd=Math.ceil((a+b)*.75),threshold=INV_THRESHOLD[b];
  showResult('#inv-requirements',`Para a dupla d${a} + d${b}, uma CD elegível é pelo menos ${cd} (75% do máximo da dupla). Competência d${b}: soma mínima ${threshold} em 5d20; chance matemática ${INV_CHANCE[b]} por tentativa elegível. Exige condição crítica externa e sucesso real validado pelo narrador.`);
 }
 if($('#inv-roll')){
  $('#inv-attr').addEventListener('change',invUpdate);$('#inv-skill').addEventListener('change',invUpdate);invUpdate();
  $('#inv-roll').addEventListener('click',()=>{
   const xs=Array.from({length:5},()=>die(20)),total=xs.reduce((a,b)=>a+b,0),threshold=INV_THRESHOLD[+$('#inv-skill').value];
   showResult('#inv-dice',xs.map(x=>'['+x+']').join(' + '));
   showResult('#inv-result',`Total ${total} de 5d20. Limiar ${threshold}. ${total>=threshold?'Atingiu o limiar matemático neste exemplo.':'Não atingiu o limiar matemático.'} Nenhuma Invicta foi adquirida ou registrada.`);
  });
 }
})();
