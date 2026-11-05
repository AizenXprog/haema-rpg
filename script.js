'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

// Navigation — works with touch, keyboard and narrow screens.
const menuButton = $('#menu-button');
const navigation = $('#nav');
function setMenu(open) {
  navigation.classList.toggle('is-open',open);
  menuButton.setAttribute('aria-expanded',String(open));
  menuButton.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');
}
menuButton.addEventListener('click',()=>setMenu(menuButton.getAttribute('aria-expanded')!=='true'));
navigation.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
document.addEventListener('keydown',event=>{if(event.key==='Escape')setMenu(false)});
document.addEventListener('click',event=>{if(!event.target.closest('.header-inner'))setMenu(false)});
window.addEventListener('resize',()=>{if(window.innerWidth>=960)setMenu(false)},{passive:true});

// Respect motion settings and keep content visible without IntersectionObserver.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if(!reducedMotion.matches && 'IntersectionObserver' in window){
  const observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}});
  },{threshold:.06,rootMargin:'0px 0px 35px 0px'});
  $$('.reveal').forEach(element=>observer.observe(element));
}else{$$('.reveal').forEach(element=>element.classList.add('is-visible'))}

// Accessible manual tabs, including left/right/home/end keyboard navigation.
const tabs = $$('.manual-tab');
function openTab(index,moveFocus=false){
  tabs.forEach((tab,i)=>{
    const selected=i===index;
    tab.classList.toggle('active',selected);
    tab.setAttribute('aria-selected',String(selected));
    tab.tabIndex=selected?0:-1;
    const panel=$('#panel-'+tab.dataset.tab);
    panel.hidden=!selected;
  });
  if(moveFocus)tabs[index].focus();
}
tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>openTab(index));
  tab.addEventListener('keydown',event=>{
    let next=index;
    if(event.key==='ArrowRight'||event.key==='ArrowDown')next=(index+1)%tabs.length;
    else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(index+tabs.length-1)%tabs.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=tabs.length-1;
    else return;
    event.preventDefault();openTab(next,true);
  });
});

const ATTRIBUTES=['Corpo','Reflexos','Raciocínio','Presença','Firmeza'];
const SKILLS=[
  'Atletismo','Combate','Pontaria','Discrição',
  'Condução','Sobrevivência','Medicina','Tecnologia',
  'Atenção','Investigação','Ciências','Cultura',
  'Influência','Empatia','Expressão','Subterfúgio'
];
const STORAGE_KEY='haema-character-v2';
const defaultCharacter=()=>({name:'',job:'',attributes:[1,1,1,1,1],skills:Array(16).fill(0),spec1:'',spec2:'',tech1:'',tech2:''});
const sum=arr=>arr.reduce((acc,value)=>acc+value,0);
function normalizeCharacter(input){
  if(!input || typeof input!=='object'||Array.isArray(input))return null;
  if(!Array.isArray(input.attributes)||input.attributes.length!==5||!input.attributes.every(n=>Number.isInteger(n)&&n>=1&&n<=3)||sum(input.attributes)>9)return null;
  if(!Array.isArray(input.skills)||input.skills.length!==16||!input.skills.every(n=>Number.isInteger(n)&&n>=0&&n<=2)||sum(input.skills)>12)return null;
  const character=defaultCharacter();
  character.attributes=[...input.attributes];character.skills=[...input.skills];
  for(const key of ['name','job','spec1','spec2','tech1','tech2']){
    if(input[key]!=null){if(typeof input[key]!=='string')return null;character[key]=input[key].slice(0,100)}
  }
  return character;
}
let character=defaultCharacter();
try {const saved=localStorage.getItem(STORAGE_KEY);if(saved){const parsed=normalizeCharacter(JSON.parse(saved));if(parsed)character=parsed;}}catch{}
function saveCharacter(){
  const status=$('#save-status');
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(character));status.textContent='◈  Salvo neste navegador'}
  catch{status.textContent='Não foi possível salvar automaticamente. Exporte a ficha.'}
}
const inputMap={name:'#char-name',job:'#char-job',spec1:'#specialization-1',spec2:'#specialization-2',tech1:'#technique-1',tech2:'#technique-2'};
for(const [field,selector] of Object.entries(inputMap)){
  $(selector).addEventListener('input',event=>{character[field]=event.target.value;saveCharacter()});
}
function fillInputs(){for(const [field,selector] of Object.entries(inputMap))$(selector).value=character[field]}
function makeCounter(index,value,kind,canIncrement,canDecrement){
  const wrap=document.createElement('div');wrap.className=kind==='attribute'?'attr-controls':'skill-counter';
  const dec=document.createElement('button');dec.type='button';dec.className='counter-button';dec.textContent='−';dec.disabled=!canDecrement;dec.dataset.kind=kind;dec.dataset.index=String(index);dec.dataset.step='-1';dec.setAttribute('aria-label','Diminuir '+(kind==='attribute'?ATTRIBUTES[index]:SKILLS[index]));
  const number=document.createElement(kind==='attribute'?'span':'strong');number.className=kind==='attribute'?'attr-val':'skill-val';number.textContent=String(value);
  const inc=document.createElement('button');inc.type='button';inc.className='counter-button';inc.textContent='+';inc.disabled=!canIncrement;inc.dataset.kind=kind;inc.dataset.index=String(index);inc.dataset.step='1';inc.setAttribute('aria-label','Aumentar '+(kind==='attribute'?ATTRIBUTES[index]:SKILLS[index]));
  wrap.append(dec,number,inc);return wrap;
}
function renderCharacter(){
  const availableAttributes=9-sum(character.attributes),availableSkills=12-sum(character.skills);
  $('#attribute-points').textContent=availableAttributes+' '+(availableAttributes===1?'ponto restante':'pontos restantes');
  $('#skill-points').textContent=availableSkills+' '+(availableSkills===1?'ponto restante':'pontos restantes');
  const attributes=$('#attributes');attributes.replaceChildren();
  character.attributes.forEach((value,index)=>{
    const el=document.createElement('div');el.className='attr-box';
    const title=document.createElement('span');title.className='attr-title';title.textContent=ATTRIBUTES[index].toUpperCase();
    el.append(title,makeCounter(index,value,'attribute',value<3&&availableAttributes>0,value>1));attributes.append(el);
  });
  const skills=$('#skills');skills.replaceChildren();
  character.skills.forEach((value,index)=>{
    const el=document.createElement('div');el.className='skill-box';
    const title=document.createElement('span');title.className='skill-name';title.textContent=SKILLS[index];
    el.append(title,makeCounter(index,value,'skill',value<2&&availableSkills>0,value>0));skills.append(el);
  });
  $('#derived-life').textContent=String(10+character.attributes[0]*2);
  $('#derived-defense').textContent=String(12+character.attributes[1]);
  refreshDiceOptions();
}
function changeCounter(event){
  const button=event.target.closest('button[data-kind]');if(!button||button.disabled)return;
  const key=button.dataset.kind==='attribute'?'attributes':'skills';
  const index=Number(button.dataset.index),step=Number(button.dataset.step);
  const max=key==='attributes'?3:2,min=key==='attributes'?1:0,budget=key==='attributes'?9:12;
  const current=character[key][index];
  if(current+step<min||current+step>max||step>0&&sum(character[key])>=budget)return;
  character[key][index]+=step;renderCharacter();saveCharacter();
}
$('#attributes').addEventListener('click',changeCounter);
$('#skills').addEventListener('click',changeCounter);

// Portable offline-safe character backup, with schema and size validation on import.
$('#export-character').addEventListener('click',()=>{
  const data={format:'haema-character',version:1,...character};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob);const link=document.createElement('a');
  const safeName=(character.name||'personagem').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'-').slice(0,40);
  link.href=url;link.download='HAEMA-'+safeName+'.json';document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('#import-character').addEventListener('click',()=>$('#character-file').click());
$('#character-file').addEventListener('change',async event=>{
  const file=event.target.files?.[0];event.target.value='';if(!file)return;
  if(file.size>100000){$('#save-status').textContent='Arquivo muito grande para uma ficha.';return}
  try{
    const parsed=JSON.parse(await file.text());const loaded=normalizeCharacter(parsed);
    if(!loaded)throw new Error('Ficha inválida');
    character=loaded;fillInputs();renderCharacter();saveCharacter();
    $('#save-status').textContent='◈  Ficha importada e salva';
  }catch{$('#save-status').textContent='Não foi possível abrir essa ficha JSON.'}
});
$('#reset-character').addEventListener('click',()=>{
  if(!window.confirm('Limpar os dados deste personagem neste navegador?'))return;
  character=defaultCharacter();fillInputs();renderCharacter();saveCharacter();
});

// Dice options reflect the current character sheet without losing the selected item.
function refreshDiceOptions(){
  const fields=[['#dice-attr',ATTRIBUTES,character.attributes],['#dice-skill',SKILLS,character.skills]];
  for(const [selector,names,values] of fields){
    const select=$(selector);const previous=select.value;select.replaceChildren();
    names.forEach((name,index)=>{const option=document.createElement('option');option.value=String(index);option.textContent=`${name} (+${values[index]})`;select.appendChild(option)});
    select.value=previous&&Number(previous)<names.length?previous:'0';
  }
}
function die10(){
  // Rejection sampling avoids modulo bias even on a long sequence of rolls.
  const random=new Uint32Array(1);const limit=4294967290;
  do{crypto.getRandomValues(random)}while(random[0]>=limit);
  return random[0]%10+1;
}
let rollCount=0;
let rolling=false;
$('#dice-roll').addEventListener('click',()=>{
  if(rolling)return;rolling=true;
  const btn=$('#dice-roll');btn.disabled=true;
  const a=die10(),b=die10();const attrIndex=Number($('#dice-attr').value),skillIndex=Number($('#dice-skill').value);
  const attr=character.attributes[attrIndex],skill=character.skills[skillIndex],bonus=Number($('#dice-bonus').value),target=Number($('#dice-dc').value);
  const total=a+b+attr+skill+bonus;
  const dice=[$('#dice-one'),$('#dice-two')];
  dice.forEach(el=>{el.classList.remove('is-rolling');void el.offsetWidth;el.classList.add('is-rolling')});
  $('#dice-verdict').textContent='ROLANDO…';
  const show=()=>{
    dice[0].querySelector('span').textContent=String(a);dice[1].querySelector('span').textContent=String(b);
    $('#dice-total').textContent=String(total);$('#dice-attempt').textContent='ROLAGEM Nº '+String(++rollCount).padStart(2,'0');
    const verdict=a===1&&b===1?'FALHA CRÍTICA · DOIS UNS':a===10&&b===10?'ACERTO EXCEPCIONAL · DOIS DEZ':total>=target+5?'SUCESSO MARCANTE · +5 ACIMA DO ALVO':total>=target?'SUCESSO · ALVO ALCANÇADO':total>=target-3?'FALHA POR POUCO · SUCESSO COM CUSTO A CRITÉRIO DO MESTRE':'FALHA · ALVO NÃO ALCANÇADO';
    $('#dice-verdict').textContent=verdict;
    $('#dice-breakdown').textContent=`${a} + ${b} + ${attr} (${ATTRIBUTES[attrIndex]}) + ${skill} (${SKILLS[skillIndex]}) ${bonus<0?'− '+Math.abs(bonus):'+ '+bonus} = ${total} / ALVO ${target}`;
    rolling=false;btn.disabled=false;
  };
  if(reducedMotion.matches){show()}else{setTimeout(show,400)}
});
fillInputs();renderCharacter();
