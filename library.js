import {access, authorizedFetch, accessGate, node, button} from './auth.js';

const states = {canon:'Cânone', concept:'Cânone conceitual', proposal:'Proposta · não aprovada', historical:'Histórico · substituído'};
let generation = 0;
let readerCleanup = () => {};
const root = () => document.getElementById('library-access');

async function initLibrary() {
  readerCleanup();
  const host = root();
  const version = ++generation;
  if (!host) return;
  const cover=document.querySelector('.tome');
  cover?.setAttribute('aria-hidden','true');
  cover?.removeAttribute('role');
  cover?.removeAttribute('tabindex');
  if(cover) {cover.onclick=null;cover.onkeydown=null;}
  document.querySelector('.tome-cover')?.classList.remove('is-authorized');
  host.replaceChildren(node('p','archive-kicker','Consultando seu acesso…'));
  try {
    const permissions = await access();
    if (version !== generation || host !== root()) return;
    if (!permissions.areas.includes('library')) { accessGate(host,permissions,'Biblioteca'); return; }
    host.replaceChildren(node('span','archive-kicker','ACERVO AUTORIZADO'),
      node('h2','','Escolha um volume.'),
      node('p','','O Bestiário reúne os registros disponíveis para a sua conta.'));
    if (!permissions.areas.includes('bestiary')) {
      host.append(node('p','','A entrada no Bestiário precisa de uma autorização própria.'));
      return;
    }
    host.append(button('Abrir o Bestiário', () => openBook(permissions), 'archive-button open-volume'));
    cover.removeAttribute('aria-hidden');
    cover.setAttribute('role','button');
    cover.setAttribute('tabindex','0');
    cover.setAttribute('aria-label','Abrir o Bestiário');
    cover.onclick=()=>openBook(permissions);
    cover.onkeydown=event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();openBook(permissions);}
    };
    document.querySelector('.tome-cover')?.classList.add('is-authorized');
  } catch (error) {
    if (version !== generation) return;
    host.replaceChildren(node('h2','','O acervo aguarda.'),node('p','',error.message),
      button('Tentar novamente',initLibrary));
  }
}
async function openBook(permissions) {
  const dialog = document.getElementById('bestiary-reader');
  if (!dialog || dialog.open) return;
  let index = [];
  let entries = [];
  let page = 0;
  let entryId = null;
  let entryRevision = null;
  let request = 0;
  let alive = true;
  let touchStart = null;
  const spread = dialog.querySelector('.book-spread');
  spread.tabIndex=-1;
  const readStatus = dialog.querySelector('.reader-status');
  const close = dialog.querySelector('[data-close]');
  const toc = dialog.querySelector('[data-index]');
  const previous = dialog.querySelector('[data-previous]');
  const next = dialog.querySelector('[data-next]');
  const mobile = matchMedia('(max-width: 720px)');
  const perSpread = () => mobile.matches ? 1 : 2;
  const status = message => { readStatus.textContent = message; };
  const abort = new AbortController();
  const options = {signal:abort.signal};
  const clearPrivate = () => {
    alive = false;
    request++;
    abort.abort();
    clearInterval(revalidate);
    index = []; entries = [];
    spread.replaceChildren();
    readerCleanup = () => {};
  };
  const dismiss = () => { dialog.close(); clearPrivate(); document.querySelector('.open-volume')?.focus(); };
  close.addEventListener('click',dismiss,options);
  dialog.addEventListener('close',clearPrivate,options);
  readerCleanup = dismiss;
  dialog.showModal();
  close.focus();
  spread.replaceChildren(node('div','book-page','Abrindo o índice…'));
  async function checkRelease() {
    try {
      const response=await authorizedFetch('/api/library', {signal:abort.signal});
      const latest=await response.json();
      if(!alive)return;
      index=latest;
      if(entryId) {
        const current=index.find(item=>item.id===entryId);
        if(!current) {showIndex();spread.focus({preventScroll:true});}
        else if(current.revision!==entryRevision) await loadEntry(entryId);
      }
    } catch { if (alive) { dismiss(); void initLibrary(); } }
  }
  const revalidate = setInterval(checkRelease,60000);
  function paint(direction = 'next') {
    const pages = entries.slice(page,page+perSpread());
    const fragment = document.createDocumentFragment();
    for (let i=0;i<pages.length;i++) {
      const sheet = node('article','book-page');
      sheet.append(...pages[i]());
      sheet.append(node('span','page-number',String(page+i+1).padStart(2,'0')));
      fragment.append(sheet);
    }
    if (pages.length === 1 && !mobile.matches) {
      const end = node('article','book-page book-end');
      end.append(node('span','end-ornament','✥'),node('p','','Fim deste registro.'));
      fragment.append(end);
    }
    spread.replaceChildren(fragment);
    spread.dataset.direction=direction;
    spread.classList.remove('is-turning');
    void spread.offsetWidth;
    spread.classList.add('is-turning');
    previous.disabled=page===0;
    next.disabled=page+perSpread()>=entries.length;
    status((entryId ? 'Registro' : 'Índice')+' · página '+(page+1)+' de '+entries.length);
  }
  function showIndex() {
    request++;
    entryId = null;
    page = 0;
    entries=[];
    if (!index.length) {
      entries.push(() => [node('span','folio-label','BESTIÁRIO'),node('h2','','Um acervo em preparação.'),
        node('p','','O administrador ainda está escolhendo os registros disponíveis para você.')]);
    }
    for (let i=0;i<index.length;i+=6) {
      const items = index.slice(i,i+6);
      entries.push(() => {
        const list = node('ol','book-index');
        for (const item of items) {
          const li = node('li');
          const pick = button(item.title,() => loadEntry(item.id),'book-index-entry');
          pick.append(node('small','',states[item.state]));
          li.append(pick);list.append(li);
        }
        return [node('span','folio-label','BESTIÁRIO · ÍNDICE'),node('h2','',i===0?'Registros do acervo':'Continuação'),list];
      });
    }
    paint();
  }
  async function loadEntry(id) {
    const version = ++request;
    previous.disabled=true;next.disabled=true;
    spread.setAttribute('aria-busy','true');
    status('Consultando o registro…');
    try {
      const response=await authorizedFetch('/api/library?entry='+encodeURIComponent(id),{signal:abort.signal});
      const item=await response.json();
      if (!alive || version!==request) return;
      entryId=id;entryRevision=item.revision;page=0;
      const paragraphs=item.paragraphs;
      entries=paragraphs.map((text,i)=>()=> {
        const parts = [node('span','folio-label',states[item.state])];
        if (i===0) {
          parts.push(node('h2','creature-title',item.title),node('p','creature-subtitle',item.subtitle));
        } else parts.push(node('h3','running-title',item.title));
        const content=node('div','book-copy');
        // Plain text from authorized source. No remote HTML or inferred lore.
        for (const line of text.split('\n').filter(Boolean)) {
          const p=node('p','',line.replace(/\*\*/g,''));
          content.append(p);
        }
        parts.push(content,node('div','book-source','Registro '+item.source_version+' · '+(item.master?'Arquivo do mestre':'Trecho liberado')));
        return parts;
      });
      if (!entries.length) entries=[()=>[node('p','','Este registro aguarda liberação.')]];
      paint();
      // The selected index button was removed. Keep keyboard focus in the reader.
      spread.focus({preventScroll:true});
    } catch (error) {
      if (!alive || version!==request) return;
      // Remove previously delivered content when authorization fails.
      entries=[];index=[];spread.replaceChildren(node('article','book-page',error.message));status('Leitura interrompida');
    } finally { if(alive && version===request) spread.removeAttribute('aria-busy'); }
  }
  function turn(delta) {
    const target=page+delta*perSpread();
    if(target<0 || target>=entries.length || spread.getAttribute('aria-busy')==='true')return;
    page=target;paint(delta>0?'next':'previous');
  }
  previous.addEventListener('click',()=>turn(-1),options);
  next.addEventListener('click',()=>turn(1),options);
  toc.addEventListener('click',showIndex,options);
  dialog.addEventListener('keydown',event=>{
    if (event.target.closest('input,textarea,select'))return;
    if (event.key==='ArrowRight') {event.preventDefault();turn(1);}
    if (event.key==='ArrowLeft') {event.preventDefault();turn(-1);}
  },options);
  spread.addEventListener('touchstart',event=>{touchStart=event.touches[0];},{...options,passive:true});
  spread.addEventListener('touchend',event=>{
    if(!touchStart)return;
    const end=event.changedTouches[0],dx=end.clientX-touchStart.clientX,dy=end.clientY-touchStart.clientY;
    if(Math.abs(dx)>70 && Math.abs(dx)>Math.abs(dy)*1.6)turn(dx<0?1:-1);
    touchStart=null;
  },{...options,passive:true});
  mobile.addEventListener('change',()=>{page=Math.floor(page/perSpread())*perSpread();paint();},options);
  document.addEventListener('visibilitychange',async()=>{
    if (document.hidden || !alive) return;
    await checkRelease();
  },options);
  try {
    const response=await authorizedFetch('/api/library',{signal:abort.signal});
    index=await response.json();
    if(alive)showIndex();
  } catch(error) { if(alive){spread.replaceChildren(node('article','book-page',error.message));status('Índice indisponível');} }
}
document.addEventListener('haema:navigated',initLibrary);
document.addEventListener('haema:auth',initLibrary);
document.addEventListener('haema:leaving',()=>{readerCleanup();generation++;});
initLibrary();
