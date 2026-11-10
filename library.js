import {access, authorizedFetch, accessGate, node, button} from './auth.js';

// The server is authoritative for player visibility: its index includes only
// records with deliberately released paragraphs. The administrator can inspect
// unpublished canonical/concept records while preparing a release.
const knownFauna = (records,admin=false) => (Array.isArray(records) ? records : []).filter(
  item => admin ? (item.released === true || item.state === 'canon' || item.state === 'concept')
    : item.released === true
);
let generation = 0;
let readerCleanup = () => {};
const root = () => document.getElementById('library-access');

async function initLibrary() {
  readerCleanup();
  const host = root();
  const version = ++generation;
  if (!host) return;
  const cover=document.querySelector('.tome');
  const caption=document.querySelector('.desk-caption');
  const feedback=document.querySelector('[data-access-feedback]');
  const setBookAction=(action,label,authorized=false)=>{
    if(!cover)return;
    cover.removeAttribute('aria-hidden');
    cover.setAttribute('role','button');
    cover.setAttribute('tabindex','0');
    cover.setAttribute('aria-label',label);
    cover.dataset.access=authorized?'authorized':'locked';
    cover.onclick=action;
    cover.onkeydown=event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();action();}
    };
    document.querySelector('.tome-cover')?.classList.toggle('is-authorized',authorized);
  };
  const explainGate=message=>{
    if(feedback)feedback.textContent=message;
    document.querySelector('.library-entry')?.scrollIntoView({
      behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',
      block:'center'
    });
    host.querySelector('button')?.focus({preventScroll:true});
  };
  setBookAction(()=>explainGate('Estamos consultando seu acesso. O livro só abre após autorização.'),'Consultar o acesso ao Bestiário');
  if(caption)caption.textContent='BESTIÁRIO · VERIFICANDO ACESSO';
  if(feedback)feedback.textContent='';
  host.replaceChildren(node('p','archive-kicker','Consultando seu acesso…'));
  try {
    const permissions = await access();
    if (version !== generation || host !== root()) return;
    if (!permissions.areas.includes('library')) {
      accessGate(host,permissions,'Biblioteca');
      const message=!permissions.user?'Entre com sua conta Google para solicitar acesso ao Bestiário.'
        :permissions.status==='denied'||permissions.status==='revoked'
          ?'Seu acesso à Biblioteca está suspenso. Fale com o administrador.'
          :'Sua conta aguarda aprovação. Peça ao administrador as permissões Biblioteca de Lore e Bestiário.';
      setBookAction(()=>explainGate(message),'Consultar autorização para abrir o Bestiário');
      if(caption)caption.textContent='BESTIÁRIO · ACESSO RESTRITO';
      return;
    }
    host.replaceChildren(node('span','archive-kicker','ACERVO AUTORIZADO'),
      node('h2','','Escolha um volume.'),
      node('p','','O Bestiário reúne os registros disponíveis para a sua conta.'));
    if (!permissions.areas.includes('bestiary')) {
      host.append(node('p','','A Biblioteca está liberada, mas o Bestiário ainda precisa de autorização própria.'));
      setBookAction(()=>explainGate('Solicite ao administrador a permissão Bestiário para abrir este volume.'),'Consultar autorização do Bestiário');
      if(caption)caption.textContent='BESTIÁRIO · AUTORIZAÇÃO NECESSÁRIA';
      return;
    }
    host.append(button('Abrir o Bestiário', () => openBook(permissions), 'archive-button open-volume'));
    setBookAction(()=>openBook(permissions),'Abrir o Bestiário',true);
    if(caption)caption.textContent='VOLUME DISPONÍVEL · BESTIÁRIO';
  } catch (error) {
    if (version !== generation) return;
    host.replaceChildren(node('h2','','O acervo aguarda.'),node('p','',error.message),
      button('Tentar novamente',initLibrary));
    setBookAction(()=>explainGate('Não foi possível verificar seu acesso. Use Tentar novamente.'),'Consultar erro de acesso ao Bestiário');
    if(caption)caption.textContent='BESTIÁRIO · ACESSO INDISPONÍVEL';
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
      index=knownFauna(latest,permissions.admin);
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
      end.append(node('span','end-ornament','✥'),node('p','','Por ora, nada mais tenho a acrescentar.'));
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
    entries.push(() => {
      const preface=node('div','book-copy');
      preface.append(
        node('p','','Estas folhas não foram escritas para encerrar a história das criaturas, mas para impedir que aquilo que delas conheço se perca. Cada encontro, relato e vestígio me oferece somente uma parcela do mundo.'),
        node('p','','Anoto o que posso sustentar, separo o que vi do que ouvi e deixo em branco o que ainda não compreendo. Não há vergonha na dúvida; há, porém, grande perigo em tomar a imaginação por testemunho.'),
        node('p','','Não contes os nomes aqui reunidos como se fossem todos os habitantes destas terras. A natureza há de guardar muito mais do que estas páginas conseguem alcançar. E eu ainda tenho muito a descobrir.')
      );
      const leaves=[node('span','folio-label','BESTIÁRIO · PRIMEIRAS FOLHAS'),
        node('h2','','A quem abrir este caderno'),preface];
      if (permissions.admin && !index.some(item=>item.released)) {
        leaves.push(node('p','book-release-note',
          'Nota para o mestre: nenhum registro tem trechos liberados aos jogadores. Use Administração → Liberações para publicar os parágrafos escolhidos.'));
      }
      return leaves;
    });
    if (!index.length) {
      entries.push(() => [node('span','folio-label','BESTIÁRIO · ACERVO AINDA NÃO LIBERADO'),
        node('h2','','Nenhuma criatura disponível para leitura.'),
        node('p','','O acesso ao livro está funcionando. O mestre ainda não liberou nenhum registro do Bestiário para os jogadores.'),
        node('p','','Assim que o mestre selecionar e publicar os trechos autorizados, os animais aparecerão neste índice.')]);
    }
    for (let i=0;i<index.length;i+=6) {
      const items = index.slice(i,i+6);
      entries.push(() => {
        const list = node('ol','book-index');
        for (const item of items) {
          const li = node('li');
          const display = permissions.admin && !item.released ? item.title+' · NÃO PUBLICADO' : item.title;
          const pick = button(display,() => loadEntry(item.id),'book-index-entry');
          li.append(pick);list.append(li);
        }
        return [node('span','folio-label','BESTIÁRIO · ÍNDICE'),node('h2','',i===0?'Criaturas que pude conhecer':'Outras folhas do caderno'),list];
      });
    }
    if (index.length) {
      entries.push(() => {
        const note=node('div','book-copy');
        note.append(
          node('p','','Estas páginas contêm apenas os nomes que minhas notas puderam alcançar. Não lhes concedas a autoridade de um catálogo completo: os caminhos são muitos, e muito do que vive permanece sem nome entre minhas folhas.'),
          node('p','','Deixo espaço para novas criaturas, novos relatos e correções daquilo que um dia julguei compreender. Um bestiário terminado seria, talvez, o sinal de que seu autor deixou de olhar para o mundo.')
        );
        return [node('span','folio-label','FOLHAS POR ESCREVER'),node('h2','','Ainda resta tanto a descobrir'),note];
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
        const parts = [node('span','folio-label',i===0?'DO CADERNO DE CRIATURAS':'DAS FOLHAS QUE SE SEGUEM')];
        if (i===0) {
          parts.push(node('h2','creature-title',item.title),node('p','creature-subtitle',item.subtitle));
        } else parts.push(node('h3','running-title',item.title));
        const content=node('div','book-copy');
        // Plain text from authorized source. No remote HTML or inferred lore.
        for (const line of text.split('\n').filter(Boolean)) {
          const p=node('p','',line.replace(/\*\*/g,''));
          content.append(p);
        }
        parts.push(content,node('div','book-source',i===paragraphs.length-1?'Esta página não é a última descoberta.':'De um caderno de observações'));
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
    index=knownFauna(await response.json(),permissions.admin);
    if(alive)showIndex();
  } catch(error) { if(alive){spread.replaceChildren(node('article','book-page',error.message));status('Índice indisponível');} }
}
document.addEventListener('haema:navigated',initLibrary);
document.addEventListener('haema:auth',initLibrary);
document.addEventListener('haema:leaving',()=>{readerCleanup();generation++;});
initLibrary();
