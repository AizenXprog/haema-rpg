import {access,authorizedFetch,node,button,login} from './auth.js';
import {createReservedAtmosphere} from './reserved-atmosphere.js';

const BOOKS={
 'arquivos-silenciados':{title:'Os Arquivos Silenciados',role:'HISTORIADORES',theme:'archive',annotation:'Examinar fragmentos'},
 'peso-da-coroa':{title:'O Peso da Coroa',role:'POLÍTICO',theme:'crown',annotation:'Conferir registro de custódia'},
 'regencias-conhecidas':{title:'Tratado das Regências Conhecidas',role:'REGENTES',theme:'regencies',annotation:'Inspecionar instrumento de estudo'}
};
const root=()=>document.getElementById('reserved-books');
let epoch=0,dispose=()=>{};
const el=(tag,cls='',text)=>node(tag,cls,text);
const api=async(action,data={})=>{
 const query=action==='read'||action==='list'?'/api/reserved?action='+action+(data.id?'&id='+encodeURIComponent(data.id):''):'/api/reserved';
 const response=await authorizedFetch(query,action==='read'||action==='list'?{}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data})});
 return response.json();
};
const status=(root,text)=>{const out=root.querySelector('[data-reserved-feedback]');if(out)out.textContent=text;};
function parseManuscript(raw){
 const sections=[];let current={title:'Folha de rosto',blocks:[]};
 const push=()=>{if(current.blocks.length)sections.push(current);};
 for(const line of raw.replace(/\r\n/g,'\n').split('\n')){
  if(/^#\s+/.test(line)){push();current={title:line.replace(/^#\s+/,''),blocks:[]};}
  else if(/^---+$/.test(line.trim()))current.blocks.push({type:'rule',text:line});
  else if(line.trim())current.blocks.push({type:'text',text:line});
 }
 push();
 return sections;
}
function rich(parent,text){
 const pattern=/(\*\*[^*]+\*\*|\*[^*]+\*)/g;let last=0,m;
 while((m=pattern.exec(text))){if(m.index>last)parent.append(document.createTextNode(text.slice(last,m.index)));
  const strong=m[0].startsWith('**');parent.append(el(strong?'strong':'em','',m[0].slice(strong?2:1,strong?-2:-1)));last=m.index+m[0].length;}
 if(last<text.length)parent.append(document.createTextNode(text.slice(last)));
}
function manuscriptBlock(block){
 if(block.type==='rule')return el('hr','reserved-rule');
 const p=el('p','reserved-paragraph');rich(p,block.text);return p;
}
function paginate(section,limit){
 const pages=[];let content=[],count=0;
 const push=()=>{if(content.length){pages.push(content);content=[];count=0;}};
 for(const block of section.blocks){
  if(block.type==='rule'){if(content.length)push();content.push(block);push();continue;}
  // Keeps every character intact while allowing long source paragraphs to flow over more than one physical page.
  const sentences=typeof Intl.Segmenter==='function'?[...new Intl.Segmenter('pt-BR',{granularity:'sentence'}).segment(block.text)].map(x=>x.segment):[block.text];
  let segment='';
  for(const sentence of sentences){
   if(segment.length&&count+segment.length+sentence.length>limit){content.push({type:'text',text:segment});count+=segment.length;segment='';push();}
   segment+=sentence;
   if(!content.length&&segment.length>limit*1.2){content.push({type:'text',text:segment});segment='';push();}
  }
  if(segment){if(count+segment.length>limit&&content.length)push();content.push({type:'text',text:segment});count+=segment.length;}
 }
 push();return pages.length?pages:[[]];
}

async function init(){
 dispose();const host=root(),seq=++epoch;if(!host)return;
 host.replaceChildren(el('p','','Consultando os livros reservados…'));
 try{
  const rights=await access();if(seq!==epoch||!host.isConnected)return;
  if(!rights.user){host.replaceChildren(el('p','','Os livros reservados exigem uma conta autorizada.'),button('Entrar com Google',login));return;}
  if(!rights.areas.includes('library')){host.replaceChildren(el('p','','A Biblioteca ainda não está liberada para sua conta.'));return;}
  const catalog=await api('list');if(seq!==epoch||!host.isConnected)return;
  host.replaceChildren();
  for(const id of Object.keys(BOOKS)){
   const book=BOOKS[id],record=catalog.find(v=>v.id===id),allowed=!!record?.allowed;
   const item=el('article','reserved-cover reserved-'+book.theme);
   const stand=el('div','reserved-bookstand'),body=el('div','reserved-book-object');
   const leaves=el('span','reserved-book-leaves');
   leaves.setAttribute('aria-hidden','true');
   const cover=el(allowed?'button':'div','reserved-cover-art');
   if(allowed){cover.type='button';cover.addEventListener('click',()=>openBook(id));cover.setAttribute('aria-label','Abrir '+book.title);}
   for(const corner of ['tl','tr','bl','br']){const ornament=el('span','reserved-cover-corner corner-'+corner);ornament.setAttribute('aria-hidden','true');cover.append(ornament);}
   const crest=el('img','reserved-book-crest');crest.src='assets/antler-sigil.svg';crest.alt='';crest.loading='lazy';crest.decoding='async';
   cover.append(el('span','reserved-eyebrow','HÆMA · ACERVO DE LORE'),crest,
    el('strong','reserved-cover-title',book.title),el('small','reserved-cover-role',book.role),el('span','reserved-cover-stamp','✥'));
   body.append(leaves,cover);stand.append(body);
   item.append(stand,el('p','reserved-access-note',allowed?'Leitura autorizada':'Documento sob custódia'));
   if(allowed)item.append(button('Abrir manuscrito',()=>openBook(id),'reserved-action'));
   else item.append(el('p','reserved-locked','Acesso concedido individualmente pelo administrador.'));
   host.append(item);
  }
 }catch(e){if(seq===epoch)host.replaceChildren(el('p','',e.message),button('Consultar novamente',init));}
}

async function openBook(id){
 dispose();const info=BOOKS[id];if(!info)return;
 const opener=document.activeElement;
 const dialog=el('dialog','reserved-reader theme-'+info.theme);dialog.setAttribute('aria-label',info.title);
 const frame=el('div','reserved-frame'),header=el('header','reserved-reader-top');
 header.append(el('span','','HÆMA / '+info.role));
 const close=button('Fechar ×',()=>dialog.close(),'reserved-reader-close');header.append(close);
 const page=el('article','reserved-sheet');page.setAttribute('tabindex','-1');
 const controls=el('nav','reserved-reader-nav');controls.setAttribute('aria-label','Navegação do livro');
 const previous=button('← Anterior',()=>change(-1),'reserved-nav-button'),
  home=button('Sumário',()=>{sectionIndex=-1;pageIndex=0;render()},'reserved-nav-button'),
  next=button('Próxima →',()=>change(1),'reserved-nav-button');
 const counter=el('span','reserved-counter');controls.append(previous,home,counter,next);
 const feedback=el('p','reserved-feedback');feedback.setAttribute('role','status');feedback.dataset.reservedFeedback='';
 frame.append(header,page,feedback,controls);dialog.append(frame);document.body.append(dialog);
 const oldOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
 const listenerAbort=new AbortController();
 let book=null,sections=[],sectionIndex=-1,pageIndex=0,requests=0,alive=true,checkTimer=null,atmosphere=null;
 const snapshot=()=>({chapter:sectionIndex,page:pageIndex});
 function cleanup(){if(!alive)return;alive=false;listenerAbort.abort();atmosphere?.dispose();clearInterval(checkTimer);book=null;sections=[];dialog.remove();document.body.style.overflow=oldOverflow;dispose=()=>{};opener?.focus?.();}
 dialog.addEventListener('close',cleanup,{once:true});dispose=()=>{if(dialog.open)dialog.close();cleanup();};
 dialog.showModal();atmosphere=createReservedAtmosphere(dialog,info.theme);close.focus();page.append(el('p','','Conferindo a autorização…'));
 try{
  const payload=await api('read',{id});if(!alive)return;
  book=payload;sections=parseManuscript(payload.manuscript);
  sectionIndex=Math.min(sections.length-1,Math.max(-1,payload.progress?.chapter??-1));
  pageIndex=Math.max(0,payload.progress?.page??0);
  render();
  checkTimer=setInterval(async()=>{try{const update=await api('read',{id});if(!alive)return;
   if(update.revision!==book.revision){book=update;sections=parseManuscript(book.manuscript);render();}
  }catch{if(alive){book=null;page.replaceChildren(el('p','','A leitura foi encerrada porque a autorização não pôde ser confirmada.'));previous.disabled=next.disabled=true;clearInterval(checkTimer);}}},60000);
 }catch(error){if(alive){page.replaceChildren(el('p','',error.message));previous.disabled=next.disabled=true;}}
 function pages(){return sectionIndex<0?[]:paginate(sections[sectionIndex],matchMedia('(max-width:720px)').matches?1050:1650);}
 function render(){
  if(!book||!sections.length)return;
  const container=document.createDocumentFragment();
  if(sectionIndex===-1){
   container.append(el('p','reserved-kicker','BIBLIOTECA RESERVADA'),el('h1','',book.title),el('p','reserved-subtitle',book.subtitle),el('h2','','Sumário'));
   const list=el('ol','reserved-toc');
   sections.forEach((chapter,i)=>{const li=el('li');li.append(button(chapter.title,()=>{sectionIndex=i;pageIndex=0;render();save()},'reserved-toc-link'));list.append(li);});
   container.append(list);
  }else{
   const segments=pages();pageIndex=Math.min(pageIndex,segments.length-1);
   container.append(el('p','reserved-kicker',info.role+' · '+String(sectionIndex+1).padStart(2,'0')),
    el('h2','',sections[sectionIndex].title));
   const body=el('div','reserved-page-copy');
   for(const block of segments[pageIndex])body.append(manuscriptBlock(block));
   container.append(body);
   // The document exists in the fiction only as an annex found near the end of chapter VII.
   // No early "Enigma" navigation or spoilers in the reader's permanent controls.
   if(book.puzzle && /^VII\s*[—-]/i.test(sections[sectionIndex].title) && pageIndex===segments.length-1){
    const marginal=el('aside','reserved-annotation');
    marginal.append(el('span','reserved-annotation-seal','✣'),
     el('p','reserved-annotation-overline','ANOTAÇÃO À MARGEM'),
     el('p','reserved-annotation-copy','Há marcas neste volume que não se esclarecem apenas pela leitura.'));
    marginal.append(button(info.annotation,()=>showPuzzle(),'reserved-annotation-trigger'));
    container.append(marginal);
   }
  }
  page.classList.remove('is-annex');page.replaceChildren(container);page.scrollTop=0;
  atmosphere?.turn(sectionIndex);
  const last=sectionIndex>=0?pages().length:0;
  previous.disabled=sectionIndex===-1;next.disabled=sectionIndex===sections.length-1&&pageIndex===last-1;
  counter.textContent=sectionIndex===-1?'SUMÁRIO':'CAPÍTULO '+(sectionIndex+1)+'/'+sections.length+' · PÁGINA '+(pageIndex+1)+'/'+last;
  status(dialog,'');
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches)page.animate([{opacity:.5,transform:'perspective(900px) rotateY(-5deg)'},{opacity:1,transform:'none'}],{duration:340,easing:'ease-out'});
  page.focus({preventScroll:true});
 }
 async function save(){if(!book)return;const p=snapshot();try{await api('save',{book_key:id,chapter_number:Math.max(0,p.chapter),page_number:p.page});}catch(e){status(dialog,'Não foi possível salvar sua posição: '+e.message);}}
 function change(by){
  if(!book)return;
  if(sectionIndex===-1){sectionIndex=0;pageIndex=0;}
  else{const count=pages().length,target=pageIndex+by;if(target>=0&&target<count)pageIndex=target;
   else if(by>0&&sectionIndex<sections.length-1){sectionIndex++;pageIndex=0;}
   else if(by<0&&sectionIndex>0){sectionIndex--;pageIndex=pages().length-1;}
   else if(by<0&&sectionIndex===0){sectionIndex=-1;pageIndex=0;}}
  render();void save();
 }
 function showPuzzle(){
  if(!book?.puzzle)return;
  const data=book.puzzle;
  const surface=el('section','reserved-puzzle');
  surface.append(el('span','reserved-kicker','ANEXO · DOCUMENTO SOB EXAME'),
   el('h2','',data.title||'Documento reservado'),el('p','',data.instructions||'Examine o material encontrado.'));
  surface.append(button('Voltar ao manuscrito',()=>render(),'reserved-annotation-return'));
  let getAnswer=()=>({});
  if(data.type==='palimpsest')getAnswer=palimpsest(surface,data);
  else if(data.type==='ledger')getAnswer=ledger(surface,data);
  else if(data.type==='wheel')getAnswer=wheel(surface,data);
  const output=el('p','reserved-puzzle-feedback');output.setAttribute('role','status');
  if(!book.revelation)surface.append(button('Conferir documento',async()=>{
   output.textContent='Conferindo…';
   try{const result=await api('solve',{book_key:id,attempt:getAnswer()});
    if(result.correct){output.textContent='Um registro adicional foi recuperado.';const updated=await api('read',{id});book=updated;showPuzzle();}
    else output.textContent='A leitura e os vestígios ainda não coincidem. Revise o anexo.';}
   catch(error){output.textContent=error.message;}
  },'reserved-action'),output);
  if(book.revelation){const reward=el('section','reserved-revelation');
   reward.append(el('h3','','Documento revelado'),el('p','',book.revelation));surface.append(reward);}
  page.classList.add('is-annex');page.replaceChildren(surface);page.scrollTop=0;counter.textContent='ANEXO DOCUMENTAL';
  previous.disabled=next.disabled=true;home.disabled=false;
 }
 dialog.addEventListener('keydown',ev=>{if(ev.target.closest('input,select,textarea,button'))return;if(ev.key==='ArrowLeft'){ev.preventDefault();change(-1);}if(ev.key==='ArrowRight'){ev.preventDefault();change(1);}},{signal:listenerAbort.signal});
}

function palimpsest(host,data){
 const guide=el('p','','Os testemunhos não formam uma única superfície. Observe a escrita, as marcas das fibras e aquilo que pode ter sido acrescentado posteriormente.');
 host.append(guide);
 const selected=[],slots=el('div','reserved-fragment-slots');
 const choices=el('div','reserved-fragment-grid');
 const paint=()=>{
  slots.replaceChildren();
  for(let i=0;i<6;i++){
   const index=i,slot=el('button','reserved-slot',selected[i]||'Fragmento '+(i+1));slot.type='button';
   slot.title='Remover fragmento da posição '+(i+1);slot.draggable=!!selected[index];slot.addEventListener('dragstart',ev=>{if(selected[index])ev.dataTransfer.setData('text/plain',selected[index]);});
   slot.addEventListener('click',()=>{if(selected[index]){selected.splice(index,1);paint();}});
   slot.addEventListener('dragover',ev=>ev.preventDefault());
   slot.addEventListener('drop',ev=>{ev.preventDefault();const id=ev.dataTransfer.getData('text/plain');
    if(!(data.fragments||[]).some(fragment=>fragment.id===id))return;
    const old=selected.indexOf(id);if(old>=0)selected.splice(old,1);
    if(selected.length<6)selected.splice(Math.min(index,selected.length),0,id);paint();
   });
   slots.append(slot);
  }
  choices.replaceChildren();
  for(const part of data.fragments||[]){
   const option=el('button','reserved-fragment');option.type='button';option.disabled=selected.includes(part.id)||selected.length>=6;
   option.append(el('b','',part.mark||part.id),el('span','',part.text||''),el('small','',part.note||''));
   option.draggable=!option.disabled;option.addEventListener('dragstart',ev=>ev.dataTransfer.setData('text/plain',part.id));
   option.addEventListener('click',()=>{selected.push(part.id);paint();});choices.append(option);
  }
 };
 paint();host.append(el('h3','','Mesa de reconstrução'),slots,choices);
 const tools=el('div','reserved-overlay');
 tools.append(el('h3','','Comparação das cópias'));
 const overlay=el('div','reserved-overlay-paper','As duas cópias apresentam sinais diferentes sob a luz. Compare as margens antes de registrar uma hipótese.');
 tools.append(overlay);
 const lamp=button('Alternar iluminação',()=>overlay.classList.toggle('is-lit'),'reserved-nav-button');tools.append(lamp);
 const question=el('label','','Que hipótese os vestígios sustentam?');
 const compare=el('select');for(const [v,label] of [['','Selecionar interpretação'],...(data.comparisons||[]).map(x=>[x.id,x.label])]){const option=el('option','',label);option.value=v;compare.append(option);}
 question.append(compare);tools.append(question);host.append(tools);
 return()=>({positions:selected,comparison:compare.value});
}
function ledger(host,data){
 const note=el('div','reserved-ledger');
 note.append(el('h3','','Entradas e saídas'));
 for(const row of data.entries||[])note.append(el('p','',row));
 host.append(note);
 const amount=el('input');amount.type='number';amount.min='0';amount.step='1';amount.inputMode='numeric';
 const amountLabel=el('label','','Valor faltante do comprovante D, em ₭');amountLabel.append(amount);host.append(amountLabel);
 host.append(el('h3','','Autenticidade dos comprovantes'));
 const documents=el('div','reserved-document-grid');
 for(const doc of data.documents||[])documents.append(el('p','reserved-document',doc.name+' · '+doc.description));
 host.append(documents);
 const pick=el('select'),pickLabel=el('label','','Comprovante autêntico');
 for(const [id,label] of [['','Selecionar documento'],...(data.documents||[]).map(x=>[x.id,x.name])]){const o=el('option','',label);o.value=id;pick.append(o);}pickLabel.append(pick);host.append(pickLabel);
 const origin=el('select'),originLabel=el('label','','Inconsistência de autorização');
 for(const [id,label] of [['','Selecionar registro'],...(data.traces||[]).map(x=>[x.id,x.label])]){const o=el('option','',label);o.value=id;origin.append(o);}originLabel.append(origin);host.append(originLabel);
 return()=>({value:Number(amount.value),document:pick.value,trace:origin.value});
}
function wheel(host,data){
 host.append(el('p','','O aro conserva traços cuja leitura depende de como as peças se relacionam. Investigue cada associação antes de tentar alinhar as marcas.'));
 const slots=[],layout=el('div','reserved-wheel');
 layout.setAttribute('aria-label','Instrumento circular de sete peças e marcas de alinhamento');
 const choices=[['','Escolher Regência'],...(data.pieces||[]).map(x=>[x.id,x.description])];
 for(let i=0;i<7;i++){
  const control=el('div','reserved-wheel-slot'),position=el('span','reserved-position',String(i+1));
  const angle=-Math.PI/2+i*2*Math.PI/7;
  control.style.left=(50+39*Math.cos(angle))+'%';control.style.top=(50+39*Math.sin(angle))+'%';
  const select=el('select');select.setAttribute('aria-label','Regência na posição '+(i+1));
  for(const [id,label] of choices){const option=el('option','',label);option.value=id;select.append(option);}
  // A pequena marca acompanha a tangente ao próximo encaixe do círculo.
  // O gabarito completo permanece somente no esquema privado do banco.
  const nextAngle=-Math.PI/2+((i+1)%7)*2*Math.PI/7;
  const direction=Math.atan2(Math.sin(nextAngle)-Math.sin(angle),Math.cos(nextAngle)-Math.cos(angle));
  const targetDirection=Math.round(direction/(Math.PI/2))*90;
  const guide=el('span','reserved-wheel-guide','➜');guide.style.transform='rotate('+targetDirection+'deg)';guide.setAttribute('aria-hidden','true');
  const rotor=el('button','reserved-rotor','➜');rotor.type='button';rotor.setAttribute('aria-label','Girar peça '+(i+1));
  let rotation=0;rotor.addEventListener('click',()=>{rotation=(rotation+1)%4;rotor.style.transform='rotate('+rotation*90+'deg)';rotor.setAttribute('aria-label','Girar peça '+(i+1)+'. Orientação '+rotation*90+' graus');});
  select.addEventListener('change',()=>{const repeats=slots.some(other=>other.select!==select&&other.select.value===select.value&&select.value);
   if(repeats)select.value='';});
  const current={select,rotation:()=>rotation};slots.push(current);control.append(position,select,rotor,guide);layout.append(control);
 }
 host.append(layout);
 return()=>({order:slots.map(x=>x.select.value),rotations:slots.map(x=>x.rotation())});
}
document.addEventListener('haema:navigated',init);
document.addEventListener('haema:auth',init);
document.addEventListener('haema:leaving',()=>{epoch++;dispose();});
window.addEventListener('pagehide',dispose);
init();
