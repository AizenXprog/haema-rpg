import {access,authorizedFetch,node,button,accessGate} from './auth.js';
import {createBookWeather} from './book-weather.js';
const TITLES={frikten:['Frikten','Sob o Peso do Inverno'],jankinss:['Jankinss','Os Filhos de Infêrnus']};
let generation=0,disposeReader=()=>{};
async function init(){
 disposeReader();const host=document.getElementById('volumes-access'),version=++generation;if(!host)return;
 host.replaceChildren(node('p','','Consultando os volumes…'));
 try{
  const permissions=await access();if(version!==generation||!host.isConnected)return;
  if(!permissions.areas.includes('library')){accessGate(host,permissions,'Biblioteca');return;}
  host.replaceChildren(node('p','','Os volumes exigem liberação do administrador. O acesso ao Bestiário permanece independente.'));
  for(const [id,[name,subtitle]] of Object.entries(TITLES)){
   const open=button('',()=>openVolume(id,open),'volume-cover');open.dataset.volume=id;
   open.append(node('small','','HÆMA · MANUSCRITOS'),node('strong','',name),node('span','',subtitle),node('b','',permissions.admin?'REVISAR VOLUME ↗':'CONSULTAR VOLUME ↗'));
   host.append(open);
  }
 }catch(error){if(version===generation)host.replaceChildren(node('p','',error.message),button('Tentar novamente',init));}
}
async function openVolume(id,opener){
 disposeReader();
 const dialog=document.createElement('dialog');dialog.className='volume-reader';dialog.dataset.theme=id;dialog.setAttribute('aria-label',TITLES[id].join(': '));
 const controller=new AbortController(),options={signal:controller.signal};let alive=true,request=0,book=null,chapter=0,page=0,pages=[],weather=null,timer=0,animation=null;
 const scenery=node('div','volume-scenery');scenery.setAttribute('aria-hidden','true');
 scenery.innerHTML='<div class="volume-horizon"></div><div class="volume-fossils"></div><div class="volume-mist"></div><div class="volume-frost"></div>';
 const back=node('canvas','weather-back'),front=node('canvas','weather-front');back.setAttribute('aria-hidden','true');front.setAttribute('aria-hidden','true');
 const sheet=node('section','volume-sheet'),top=node('div','volume-top'),title=node('strong','',TITLES[id][0]);
 const close=button('Fechar ×',()=>dialog.close(),'volume-close');top.append(title,close);
 const content=node('article','volume-copy');content.tabIndex=-1;
 const footer=node('nav','volume-controls');footer.setAttribute('aria-label','Navegação do livro');
 const prev=button('← Anterior',()=>turn(-1)),index=button('Índice',showIndex),next=button('Próxima →',()=>turn(1)),status=node('p','volume-status');status.setAttribute('role','status');footer.append(prev,index,next);
 sheet.append(top,content,status,footer);dialog.append(scenery,back,sheet,front);document.body.append(dialog);
 function cleanup(){if(!alive)return;alive=false;request++;controller.abort();clearTimeout(timer);weather?.dispose();animation?.cancel();book=null;pages=[];dialog.remove();disposeReader=()=>{};if(opener.isConnected)opener.focus();}
 dialog.addEventListener('close',cleanup,options);disposeReader=()=>{if(dialog.open)dialog.close();cleanup()};
 dialog.showModal();close.focus();content.append(node('p','','Verificando autorização…'));prev.disabled=next.disabled=index.disabled=true;
 async function load(revalidate=false){
  const seq=++request;
  try{
   const response=await authorizedFetch('/api/volumes?volume='+id,options),data=await response.json();if(!alive||seq!==request)return;
   if(!Array.isArray(data.chapters)||data.chapters.length!==4)throw Error('O volume está incompleto. Consulte o administrador.');
   const changed=book&&book.revision!==data.revision;book=data;
   if(!revalidate||changed){showIndex();if(!weather){weather=createBookWeather(dialog,id);dialog.classList.add('volume-opening');}}
   clearTimeout(timer);timer=setTimeout(()=>load(true),60000);
  }catch(error){if(!alive||seq!==request)return;book=null;pages=[];weather?.dispose();weather=null;animation?.cancel();prev.disabled=next.disabled=index.disabled=true;content.replaceChildren(node('h2','','Leitura indisponível'),node('p','',error.message),button('Consultar novamente',()=>load()));status.textContent='Nenhum texto privado permanece aberto.';}
 }
 function showIndex(){
  if(!book)return;page=-1;index.disabled=true;prev.disabled=true;next.disabled=false;content.replaceChildren(node('span','volume-kicker','MANUSCRITO · QUATRO CAPÍTULOS'),node('h2','',book.title),node('p','volume-subtitle',book.subtitle));
  const list=node('ol','volume-index');book.chapters.forEach((c,i)=>{const li=node('li');li.append(button(c.title,()=>selectChapter(i)));list.append(li)});content.append(list);status.textContent=book.released?'Índice do volume':'Revisão administrativa · ainda privado';content.scrollTop=0;
 }
 function selectChapter(i){chapter=i;const c=book.chapters[i];pages=[];let chunk=[],length=0;
  for(const p of c.paragraphs){if(chunk.length&&length+p.length>1400){pages.push(chunk);chunk=[];length=0}chunk.push(p);length+=p.length;}if(chunk.length)pages.push(chunk);page=0;paint(1);}
 function paragraph(text){const p=node('p');if(text.startsWith('**')&&text.endsWith('**'))p.append(node('strong','',text.slice(2,-2)));else if(text.startsWith('*')&&text.endsWith('*'))p.append(node('em','',text.slice(1,-1)));else p.textContent=text;return p;}
 function paint(direction){
  if(!book)return;index.disabled=false;prev.disabled=chapter===0&&page===0;next.disabled=chapter===3&&page===pages.length-1;
  content.replaceChildren(node('span','volume-kicker',TITLES[id][0]+' · '+String(chapter+1).padStart(2,'0')),node('h2','',book.chapters[chapter].title),...pages[page].map(paragraph));content.scrollTop=0;
  status.textContent='Capítulo '+(chapter+1)+' de 4 · página '+(page+1)+' de '+pages.length;weather?.turn(chapter,direction);
  animation?.cancel();if(!matchMedia('(prefers-reduced-motion:reduce)').matches)animation=content.animate([{opacity:.35,transform:'perspective(1000px) rotateY('+direction*5+'deg) translateX('+direction*9+'px)'},{opacity:1,transform:'none'}],{duration:380,easing:'cubic-bezier(.2,.7,.2,1)'});
  content.focus({preventScroll:true});
 }
 function turn(direction){if(!book)return;if(page===-1){selectChapter(0);return;}const p=page+direction;if(p<0){if(chapter>0){selectChapter(chapter-1);page=pages.length-1;paint(direction)}return;}if(p>=pages.length){if(chapter<3)selectChapter(chapter+1);return;}page=p;paint(direction);}
 dialog.addEventListener('keydown',e=>{if(e.target.closest('input,select,textarea'))return;if(e.key==='ArrowRight'){e.preventDefault();turn(1)}if(e.key==='ArrowLeft'){e.preventDefault();turn(-1)}},options);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void load(true)},options);
 await load();
}
document.addEventListener('haema:navigated',init);document.addEventListener('haema:auth',init);document.addEventListener('haema:leaving',()=>{generation++;disposeReader()});window.addEventListener('pagehide',()=>disposeReader());init();
