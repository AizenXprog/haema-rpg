'use strict';
const $=s=>document.querySelector(s);
const menu=$('#menu-toggle'),nav=$('#main-nav');
if(menu&&nav){
 const close=()=>{menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Abrir menu');nav.classList.remove('open')};
 menu.addEventListener('click',()=>{const opened=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(opened));menu.setAttribute('aria-label',opened?'Fechar menu':'Abrir menu');nav.classList.toggle('open',opened)});
 nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('.header-inner'))close()});
 window.addEventListener('resize',()=>{if(innerWidth>=940)close()},{passive:true});
}
// Deep links to chapters expand the corresponding section.
if(location.hash){const selected=document.querySelector(location.hash);if(selected?.tagName==='DETAILS')selected.open=true}
window.addEventListener('hashchange',()=>{const selected=document.querySelector(location.hash);if(selected?.tagName==='DETAILS')selected.open=true});
const ATTRIBUTES=['Corpo','Reflexos','Raciocínio','Presença','Firmeza'];
const SKILLS=['Atletismo','Combate','Pontaria','Discrição','Condução','Sobrevivência','Medicina','Tecnologia','Atenção','Investigação','Ciências','Cultura','Influência','Empatia','Expressão','Subterfúgio'];
const STORAGE_KEY='haema-character-v2';
const blank=()=>({name:'',job:'',attributes:[1,1,1,1,1],skills:Array(16).fill(0),spec1:'',spec2:'',tech1:'',tech2:''});
const sum=arr=>arr.reduce((t,n)=>t+n,0);
function normalize(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 if(!Array.isArray(input.attributes)||input.attributes.length!==5||!input.attributes.every(n=>Number.isInteger(n)&&n>=1&&n<=3)||sum(input.attributes)>9)return null;
 if(!Array.isArray(input.skills)||input.skills.length!==16||!input.skills.every(n=>Number.isInteger(n)&&n>=0&&n<=2)||sum(input.skills)>12)return null;
 const c=blank();c.attributes=[...input.attributes];c.skills=[...input.skills];
 for(const key of ['name','job','spec1','spec2','tech1','tech2']){
  if(input[key]!=null){if(typeof input[key]!=='string')return null;c[key]=input[key].slice(0,100)}
 }
 return c;
}
let character=blank();
try{const saved=localStorage.getItem(STORAGE_KEY);if(saved)character=normalize(JSON.parse(saved))||blank()}catch{}
function save(){const status=$('#save-status');try{localStorage.setItem(STORAGE_KEY,JSON.stringify(character));if(status)status.textContent='◈ Ficha salva neste navegador'}catch{if(status)status.textContent='Falha no salvamento local. Exporte sua ficha.'}}
const inputs={name:'#char-name',job:'#char-job',spec1:'#specialization-1',spec2:'#specialization-2',tech1:'#technique-1',tech2:'#technique-2'};
function refreshValues(){for(const [key,id] of Object.entries(inputs)){const element=$(id);if(element)element.value=character[key]}}
function makeCounter(i,n,kind,canAdd,canSub){
 const container=document.createElement('div');container.className='counter';
 const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.disabled=!canSub;minus.dataset.kind=kind;minus.dataset.index=i;minus.dataset.delta='-1';minus.setAttribute('aria-label',`Diminuir ${kind==='attribute'?ATTRIBUTES[i]:SKILLS[i]}`);
 const value=document.createElement('strong');value.textContent=n;
 const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.disabled=!canAdd;plus.dataset.kind=kind;plus.dataset.index=i;plus.dataset.delta='1';plus.setAttribute('aria-label',`Aumentar ${kind==='attribute'?ATTRIBUTES[i]:SKILLS[i]}`);
 container.append(minus,value,plus);return container;
}
function render(){
 if(!$('#attributes'))return;
 const leftAttr=9-sum(character.attributes),leftSkills=12-sum(character.skills);
 $('#attribute-points').textContent=`${leftAttr} ${leftAttr===1?'ponto restante':'pontos restantes'}`;
 $('#skill-points').textContent=`${leftSkills} ${leftSkills===1?'ponto restante':'pontos restantes'}`;
 const attrs=$('#attributes');attrs.replaceChildren();character.attributes.forEach((n,i)=>{const box=document.createElement('div');box.className='attribute-box';const lbl=document.createElement('span');lbl.className='label';lbl.textContent=ATTRIBUTES[i].toUpperCase();box.append(lbl,makeCounter(i,n,'attribute',n<3&&leftAttr>0,n>1));attrs.append(box)});
 const skills=$('#skills');skills.replaceChildren();character.skills.forEach((n,i)=>{const box=document.createElement('div');box.className='skill-box';const lbl=document.createElement('span');lbl.className='label';lbl.textContent=SKILLS[i];box.append(lbl,makeCounter(i,n,'skill',n<2&&leftSkills>0,n>0));skills.append(box)});
 $('#derived-life').textContent=10+2*character.attributes[0];$('#derived-defense').textContent=12+character.attributes[1];refreshDiceLabels();
}
if($('#attributes')){
 for(const [key,id] of Object.entries(inputs))$(id).addEventListener('input',e=>{character[key]=e.target.value;save()});
 const click=e=>{const b=e.target.closest('button[data-kind]');if(!b||b.disabled)return;const key=b.dataset.kind==='attribute'?'attributes':'skills',idx=+b.dataset.index,delta=+b.dataset.delta;const max=key==='attributes'?3:2,min=key==='attributes'?1:0,budget=key==='attributes'?9:12;const current=character[key][idx];if(current+delta<min||current+delta>max||delta>0&&sum(character[key])>=budget)return;character[key][idx]+=delta;render();save()};
 $('#attributes').addEventListener('click',click);$('#skills').addEventListener('click',click);
 $('#export-character').addEventListener('click',()=>{const data={format:'haema-character',version:1,...character};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='HAEMA-'+(character.name||'personagem').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9_-]+/gi,'-').slice(0,40)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)});
 $('#import-character').addEventListener('click',()=>$('#character-file').click());
 $('#character-file').addEventListener('change',async e=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;if(f.size>100000){$('#save-status').textContent='Arquivo muito grande.';return}try{const parsed=normalize(JSON.parse(await f.text()));if(!parsed)throw Error('Arquivo inválido');character=parsed;refreshValues();render();save();$('#save-status').textContent='◈ Personagem importado'}catch{$('#save-status').textContent='Não foi possível abrir esta ficha JSON.'}});
 $('#reset-character').addEventListener('click',()=>{if(!confirm('Limpar os dados deste personagem neste navegador?'))return;character=blank();refreshValues();render();save()});
 refreshValues();render();
}
function refreshDiceLabels(){
 const attrs=$('#dice-attr'),skills=$('#dice-skill');
 if(!attrs || !skills || !attrs.options.length || !skills.options.length)return;
 ATTRIBUTES.forEach((name,i)=>attrs.options[i].textContent=`${name} (+${character.attributes[i]})`);
 SKILLS.forEach((name,i)=>skills.options[i].textContent=`${name} (+${character.skills[i]})`);
}
function die10(){const rand=new Uint32Array(1);const limit=4294967290;do{crypto.getRandomValues(rand)}while(rand[0]>=limit);return rand[0]%10+1}
if($('#dice-roll')){
 const selectAttrs=$('#dice-attr'),selectSkills=$('#dice-skill');
 ATTRIBUTES.forEach((name,i)=>selectAttrs.add(new Option(`${name} (+${character.attributes[i]})`,String(i))));
 SKILLS.forEach((name,i)=>selectSkills.add(new Option(`${name} (+${character.skills[i]})`,String(i))));
 let attempts=0,rolling=false;
 $('#dice-roll').addEventListener('click',()=>{
  if(rolling)return;rolling=true;const button=$('#dice-roll');button.disabled=true;
  const a=die10(),b=die10(),attrIndex=+selectAttrs.value,skillIndex=+selectSkills.value,att=character.attributes[attrIndex],skill=character.skills[skillIndex],modifier=+$('#dice-bonus').value,target=+$('#dice-dc').value,total=a+b+att+skill+modifier;
  const d1=$('#dice-one'),d2=$('#dice-two');d1.classList.remove('is-rolling');d2.classList.remove('is-rolling');void d1.offsetWidth;d1.classList.add('is-rolling');d2.classList.add('is-rolling');$('#dice-verdict').textContent='ROLANDO…';
  const finish=()=>{d1.querySelector('span').textContent=a;d2.querySelector('span').textContent=b;$('#dice-total').textContent=total;$('#dice-attempt').textContent='ROLAGEM Nº '+String(++attempts).padStart(2,'0');$('#dice-verdict').textContent=a===1&&b===1?'FALHA CRÍTICA · DOIS UNS':a===10&&b===10?'ACERTO EXCEPCIONAL · DOIS DEZ':total>=target+5?'SUCESSO MARCANTE · +5 ACIMA DO ALVO':total>=target?'SUCESSO · ALVO ALCANÇADO':total>=target-3?'FALHA POR POUCO · SUCESSO COM CUSTO A CRITÉRIO DO MESTRE':'FALHA · ALVO NÃO ALCANÇADO';$('#dice-breakdown').textContent=`${a} + ${b} + ${att} (${ATTRIBUTES[attrIndex]}) + ${skill} (${SKILLS[skillIndex]}) ${modifier<0?'− '+Math.abs(modifier):'+ '+modifier} = ${total} / ALVO ${target}`;rolling=false;button.disabled=false};
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)finish();else setTimeout(finish,420)
 });
}

// Decorative cursor: rAF only while changing position; disabled for touch and reduced motion.
(()=>{
 const canUse=window.matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
 if(!canUse.matches)return;
 const cursor=document.createElement('div');cursor.className='haema-pointer';cursor.setAttribute('aria-hidden','true');
 cursor.innerHTML='<span class="haema-pointer-outer"></span><span class="haema-pointer-star">✦</span>';
 document.body.appendChild(cursor);document.documentElement.classList.add('cursor-ready');
 let x=0,y=0,atX=0,atY=0,active=false,frame=0;
 const animate=()=>{
   atX+=(x-atX)*.24;atY+=(y-atY)*.24;
   cursor.style.transform=`translate3d(${atX}px,${atY}px,0)`;
   if(Math.abs(x-atX)+Math.abs(y-atY)>.7 && active)frame=requestAnimationFrame(animate);
   else {cursor.style.transform=`translate3d(${x}px,${y}px,0)`;atX=x;atY=y;frame=0;}
 };
 const start=()=>{if(!frame)frame=requestAnimationFrame(animate)};
 document.addEventListener('pointermove',e=>{
   if(e.pointerType!=='mouse')return;
   x=e.clientX;y=e.clientY;
   if(!active){atX=x;atY=y;cursor.classList.add('is-visible');active=true;}
   const target=e.target;
   const typing=!!target.closest('input,textarea,select,[contenteditable="true"]');
   cursor.classList.toggle('is-hidden',typing);
   cursor.classList.toggle('is-hovering',!!target.closest('a,button,summary,[role="button"]'));
   start();
 },{passive:true});
 document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')cursor.classList.add('is-pressed')},{passive:true});
 document.addEventListener('pointerup',()=>cursor.classList.remove('is-pressed'),{passive:true});
 document.addEventListener('pointercancel',()=>cursor.classList.remove('is-pressed'),{passive:true});
 document.addEventListener('mouseout',e=>{if(!e.relatedTarget){cursor.classList.remove('is-visible');active=false;}},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cursor.classList.remove('is-visible');active=false;if(frame)cancelAnimationFrame(frame);frame=0;}},{passive:true});
 canUse.addEventListener('change',e=>{cursor.classList.toggle('cursor-off',!e.matches);document.documentElement.classList.toggle('cursor-ready',e.matches);});
})();