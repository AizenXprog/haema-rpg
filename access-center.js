import {access,rpc,node} from './auth.js';

const AREAS=[
 {id:'library',name:'Biblioteca',desc:'Entrada no acervo e leitura dos materiais autorizados'},
 {id:'bestiary',name:'Bestiário',desc:'Registros de criaturas conforme as liberações globais'},
 {id:'portal',name:'Campanhas e fichas',desc:'Área online das campanhas e personagens'},
 {id:'mesa',name:'Ficha local e dados',desc:'Ferramentas de mesa e dados'},
 {id:'materials',name:'Materiais da campanha',desc:'Documentos e recursos da campanha'},
 {id:'studio',name:'HÆMA Estúdio',desc:'Ferramentas privadas de projeção e mesa física'}
];
const STATUS={approved:'Aprovado',pending:'Pendente',denied:'Negado',revoked:'Revogado'};
const statusText=s=>STATUS[s]||'Não identificado';
const n=(tag,cls='',text)=>node(tag,cls,text);
const asArray=x=>Array.isArray(x)?x:[];
const sorted=x=>[...new Set(asArray(x))].sort();
const equal=(a,b)=>JSON.stringify(sorted(a))===JSON.stringify(sorted(b));
function action(label,run,cls='access-action'){
 const control=n('button',cls,label);control.type='button';
 control.addEventListener('click',async()=>{
  if(control.disabled)return;
  control.disabled=true;
  try{await run();}catch(error){
   const message=control.closest('.access-center')?.querySelector('.access-feedback');
   if(message){message.replaceChildren(notice(error?.message||'Não foi possível concluir a alteração.','error'));message.scrollIntoView({behavior:'smooth',block:'nearest'});}
  }finally{if(control.isConnected)control.disabled=false;}
 });
 return control;
}
function labelState(text,kind='muted'){return n('span','access-label is-'+kind,text);}
function small(text){return n('p','access-help',text);}
function notice(text,kind='info'){const box=n('p','access-notice is-'+kind,text);box.setAttribute('role','status');return box;}
function currentReason(user,book,areas=user.areas,grants=user.books,status=user.status){
 if(user.admin)return {ok:true,label:'Administrador',reason:'O administrador possui acesso de revisão.'};
 if(status!=='approved')return {ok:false,label:'Conta '+statusText(status).toLowerCase(),reason:'A conta precisa ser aprovada.'};
 if(!areas.includes('library'))return {ok:false,label:'Sem Biblioteca',reason:'Ative a área Biblioteca para esta pessoa.'};
 if(!grants.includes(book.id))return {ok:false,label:'Não atribuído',reason:'Este livro ainda não foi atribuído à pessoa.'};
 if(!book.published)return {ok:false,label:'Livro pausado',reason:'O volume não está liberado para os destinatários.'};
 if(!book.ready)return {ok:false,label:'Volume incompleto',reason:'O livro ainda não está pronto para leitura.'};
 return {ok:true,label:'Leitura liberada',reason:'A pessoa pode abrir este livro na Biblioteca.'};
}
function bookRecipients(data,id){return data.users.filter(u=>!u.admin&&u.books.includes(id));}
function stats(data){
 const approved=data.users.filter(u=>u.status==='approved'&&!u.admin).length;
 const waiting=data.users.filter(u=>u.status==='pending').length;
 const assigned=data.books.reduce((sum,b)=>sum+bookRecipients(data,b.id).length,0);
 const effective=data.books.reduce((sum,b)=>sum+data.users.filter(u=>!u.admin&&currentReason(u,b).ok).length,0);
 return [
  [String(data.users.length),'Contas cadastradas'],
  [String(approved),'Contas aprovadas'],
  [String(waiting),'Solicitações pendentes'],
  [String(effective)+' / '+String(assigned),'Leituras realmente liberadas']
 ];
}
function toDate(value){try{return new Date(value).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});}catch{return 'Data indisponível';}}
export async function renderAccessCenter(panel,isCurrent=()=>true){
 const root=n('div','access-center'),header=n('header','access-intro');
 header.append(n('p','access-eyebrow','ADMINISTRAÇÃO / HÆMA'),n('h2','','Central de Acessos'),
  small('Controle de quem pode entrar nas áreas do site e quais livros cada pessoa pode ler. Os livros reservados exigem três condições: conta aprovada, Biblioteca habilitada e atribuição do volume — além da liberação do próprio livro.'));
 const menu=n('nav','access-views');menu.setAttribute('aria-label','Visões da Central de Acessos');
 const overview=n('div','access-overview'),feedback=n('div','access-feedback');
 feedback.setAttribute('role','status');
 const body=n('section','access-body');
 const toolbar=n('div','access-toolbar');
 root.append(header,menu,overview,feedback,toolbar,body);
 panel.replaceChildren(root);
 let data=null,mode='users',selectedUser='',selectedBook='',search='',filter='all',sequence=0;
 const active=()=>isCurrent()&&root.isConnected;
 function showFeedback(message,kind='good'){
  feedback.replaceChildren(message?notice(message,kind):n('span','',''));
 }
 function renderOverview(){
  overview.replaceChildren();
  for(const [value,label] of stats(data)){
   const card=n('div','access-stat');card.append(n('strong','',value),n('span','',label));overview.append(card);
  }
 }
 function renderMenu(){
  menu.replaceChildren();
  const choices=[['users','Por pessoa'],['books','Por livro'],['audit','Histórico']];
  for(const [id,label] of choices){
   const b=action(label,()=>{if(mode===id)return;mode=id;search='';filter='all';renderMode();},'access-tab');
   b.setAttribute('aria-current',mode===id?'page':'false');
   menu.append(b);
  }
 }
 async function refresh(message=''){
  const which=++sequence;
  try{
   const snapshot=await rpc('haema_access_control_snapshot');
   if(!active()||which!==sequence)return;
   if(!snapshot||!Array.isArray(snapshot.users)||!Array.isArray(snapshot.books))throw Error('A Central não conseguiu consultar as permissões.');
   data={users:snapshot.users.map(u=>({...u,areas:asArray(u.areas),books:asArray(u.books)})),
    books:snapshot.books,campaigns:asArray(snapshot.campaigns),recent:asArray(snapshot.recent)};
   if(!data.users.some(u=>u.id===selectedUser))selectedUser=data.users.find(u=>!u.admin)?.id||data.users[0]?.id||'';
   if(!data.books.some(b=>b.id===selectedBook))selectedBook=data.books[0]?.id||'';
   renderOverview();renderMode();if(message)showFeedback(message,'good');
  }catch(error){if(active()){body.replaceChildren(notice('Falha ao atualizar: '+(error.message||'erro desconhecido'),'error'),
   action('Tentar novamente',()=>refresh()));}}
 }
 function renderMode(){
  if(!active()||!data)return;
  renderMenu();
  toolbar.replaceChildren();body.replaceChildren();
  if(mode==='users')renderUsers();
  else if(mode==='books')renderBooks();
  else renderAudit();
 }
 function renderUsers(){
  const hint=n('p','access-section-intro','Selecione uma conta para editar todas as áreas e os três livros, conferindo o resultado antes de salvar.');
  toolbar.append(hint);
  const searchInput=n('input','access-search');searchInput.type='search';searchInput.placeholder='Buscar por nome ou e-mail';searchInput.setAttribute('aria-label','Buscar pessoas');searchInput.value=search;
  const filterInput=n('select','access-filter');filterInput.setAttribute('aria-label','Filtrar por situação');
  for(const [value,label] of [['all','Todos'],['approved','Aprovados'],['pending','Pendentes'],['revoked','Revogados'],['denied','Negados'],['restricted','Com livro atribuído, mas bloqueado']]){
   const option=n('option','',label);option.value=value;filterInput.append(option);
  }
  filterInput.value=filter;
  toolbar.append(searchInput,filterInput,action('Atualizar',()=>refresh(),'access-refresh'));
  const layout=n('div','access-layout'),roster=n('div','access-roster'),editor=n('div','access-editor');
  roster.setAttribute('aria-label','Pessoas cadastradas');
  layout.append(roster,editor);body.append(layout);
  const filtered=()=>{
   const q=search.trim().toLocaleLowerCase('pt-BR');
   return data.users.filter(u=>{
    const matches=!q||String(u.name+' '+u.email).toLocaleLowerCase('pt-BR').includes(q);
    if(!matches)return false;
    if(filter==='restricted')return data.books.some(b=>u.books.includes(b.id)&&!currentReason(u,b).ok);
    return filter==='all'||u.status===filter;
   });
  };
  function drawRoster(){
   const users=filtered();roster.replaceChildren();
   roster.append(n('p','access-roster-count',users.length+' pessoa(s) encontrada(s)'));
   for(const user of users){
    const choice=action('',()=>{selectedUser=user.id;drawRoster();drawEditor();},'access-user-row');
    choice.setAttribute('aria-pressed',String(selectedUser===user.id));
    const main=n('span','access-user-info');
    main.append(n('strong','',user.name),n('small','',user.email||'Sem e-mail disponível'));
    const eligible=data.books.filter(b=>currentReason(user,b).ok).length;
    const aside=n('span','access-user-side');
    aside.append(labelState(user.admin?'Administrador':statusText(user.status),user.admin?'gold':user.status==='approved'?'good':user.status==='pending'?'warning':'bad'),
     n('small','',user.admin?'Acesso total':eligible+' / '+data.books.length+' livro(s)'));
    choice.append(main,aside);roster.append(choice);
   }
   if(!users.length)roster.append(small('Nenhuma pessoa encontrada. Altere a busca ou o filtro.'));
   if(users.length&&!users.some(u=>u.id===selectedUser))selectedUser=users[0].id;
   drawEditor();
  }
  function drawEditor(){
   editor.replaceChildren();
   const user=data.users.find(u=>u.id===selectedUser);
   if(!user){editor.append(small('Selecione uma pessoa na lista.'));return;}
   const heading=n('header','access-editor-header');
   heading.append(n('p','access-eyebrow','PERMISSÕES INDIVIDUAIS'),
    n('h3','',user.name),small(user.email||'Cadastro sem e-mail'),
    labelState(user.admin?'Protegido':statusText(user.status),user.admin?'gold':user.status==='approved'?'good':'warning'));
   editor.append(heading);
   if(user.admin){
    editor.append(notice('A conta administradora tem acesso integral para revisão e não pode ser revogada nesta Central.','info'));
    return;
   }
   const statusSection=n('section','access-editor-section');
   statusSection.append(n('h4','','1. Situação da conta'),small('A aprovação da conta é obrigatória para acesso às áreas e aos livros.'));
   const statusSelect=n('select','access-field');statusSelect.setAttribute('aria-label','Situação da conta');
   const statuses=user.status==='pending'?['pending','approved','denied','revoked']:['approved','denied','revoked'];
   statuses.forEach(value=>{const option=n('option','',statusText(value));option.value=value;statusSelect.append(option);});
   statusSelect.value=user.status;
   statusSection.append(statusSelect);
   const areasSection=n('section','access-editor-section');
   areasSection.append(n('h4','','2. Áreas do site'),small('O acesso a uma área não libera automaticamente os livros reservados.'));
   const areaChoices=n('div','access-area-grid'),areaInputs=new Map();
   for(const area of AREAS){
    const wrap=n('label','access-area-option'),input=n('input');input.type='checkbox';input.checked=user.areas.includes(area.id);
    const description=n('span');description.append(n('strong','',area.name),n('small','',area.desc));
    wrap.append(input,description);areaChoices.append(wrap);areaInputs.set(area.id,input);
   }
   areasSection.append(areaChoices);
   const campaignSection=n('section','access-editor-section');
   campaignSection.append(n('h4','','3. Campanhas'),small('Mantenha os vínculos atuais ou adicione esta pessoa a uma campanha que você administra.'));
   const memberships=asArray(user.campaigns).map(id=>data.campaigns.find(c=>c.id===id)?.name||'Campanha vinculada');
   campaignSection.append(small('Vínculos existentes: '+(memberships.length?memberships.join(', '):'nenhum')));
   const campaignSelect=n('select','access-field');campaignSelect.setAttribute('aria-label','Adicionar pessoa à campanha');
   const emptyCampaign=n('option','','Não alterar vínculos atuais');emptyCampaign.value='';campaignSelect.append(emptyCampaign);
   for(const c of asArray(data.campaigns)){
    const opt=n('option','',c.name+(asArray(user.campaigns).includes(c.id)?' · já participa':''));opt.value=c.id;campaignSelect.append(opt);
   }
   campaignSection.append(campaignSelect);
   const booksSection=n('section','access-editor-section');
   booksSection.append(n('h4','','4. Livros reservados'),small('Marque os volumes atribuídos à pessoa. Sem liberação do livro ou sem Biblioteca, a leitura continuará bloqueada.'));
   const bookControls=n('div','access-books-user'),bookInputs=new Map();
   for(const book of data.books){
    const row=n('label','access-book-option'),input=n('input');input.type='checkbox';input.checked=user.books.includes(book.id);
    const group=n('span');
    group.append(n('strong','',book.title),n('small','',book.published?'Volume disponível aos autorizados':'Volume pausado para os jogadores'));
    row.append(input,group);bookControls.append(row);bookInputs.set(book.id,input);
   }
   booksSection.append(bookControls);
   const previewSection=n('section','access-editor-section');
   previewSection.append(n('h4','','5. Visibilidade efetiva'),small('Esta é a situação que a pessoa terá após salvar estas escolhas.'));
   const preview=n('div','access-visibility');previewSection.append(preview);
   const saveRow=n('div','access-save-row'),saveFeedback=n('p','access-save-feedback');
   saveFeedback.setAttribute('role','status');
   const saveButton=action('Salvar todas as permissões',async()=>{
    const nextStatus=statusSelect.value,areas=readAreas(),books=readBooks();
    if(nextStatus==='pending'&&nextStatus!==user.status)throw Error('Contas já analisadas não podem voltar a pendente.');
    if(['denied','revoked'].includes(nextStatus)&&nextStatus!==user.status){
     if(!confirm('Confirmar alteração de '+user.name+' para '+statusText(nextStatus)+'? Isso bloqueia o acesso às áreas do HÆMA.'))return;
    }
    if(books.length&&!areas.includes('library')&&nextStatus==='approved'){
     if(!confirm('Você atribuiu livros, mas a área Biblioteca não está habilitada. Deseja salvar mesmo assim?'))return;
    }
    saveFeedback.textContent='Salvando todas as permissões…';saveFeedback.dataset.error='false';
    try{
     await rpc('haema_access_control_user_save',{
      target:user.id,next_status:nextStatus,requested_areas:areas,requested_books:books,expected_revision:user.revision,campaign:campaignSelect.value||null
     });
     await refresh('Permissões de '+user.name+' salvas e verificadas no Supabase.');
    }catch(error){
     saveFeedback.textContent=error.message||'Falha ao salvar. Nenhuma permissão foi confirmada.';
     saveFeedback.dataset.error='true';
    }
   },'access-primary');
   saveRow.append(saveButton,saveFeedback);
   editor.append(statusSection,areasSection,campaignSection,booksSection,previewSection,saveRow);
   function readAreas(){return statusSelect.value==='approved'?[...areaInputs].filter(([,input])=>input.checked).map(([id])=>id):[];}
   function readBooks(){return [...bookInputs].filter(([,input])=>input.checked).map(([id])=>id);}
   function updatePreview(){
    const nextStatus=statusSelect.value,areas=readAreas(),books=readBooks();
    const permitted=nextStatus==='approved';
    for(const control of areaInputs.values())control.disabled=!permitted;
    campaignSelect.disabled=!permitted;
    if(!permitted){for(const c of areaInputs.values())c.checked=false;campaignSelect.value='';}
    preview.replaceChildren();
    const summary=n('div','access-visibility-header');
    summary.append(n('strong','',areas.includes('library')&&permitted?'Biblioteca habilitada':'Biblioteca bloqueada'),
     labelState(permitted?'Conta '+statusText(nextStatus).toLowerCase():'Conta sem aprovação',permitted?'good':'warning'));
    preview.append(summary);
    for(const book of data.books){
     const result=currentReason(user,book,areas,books,nextStatus),line=n('div','access-visibility-row');
     line.append(n('span','',book.title),labelState(result.label,result.ok?'good':book.published?'muted':'warning'));
     const explanation=n('small','',result.reason);line.append(explanation);preview.append(line);
    }
    const campaignChanged=!!campaignSelect.value&&!asArray(user.campaigns).includes(campaignSelect.value);
    const changed=user.status!==nextStatus||!equal(areas,user.areas)||!equal(books,user.books)||campaignChanged;
    saveButton.disabled=!changed;
    saveButton.textContent=changed?'Salvar '+(books.length)+' livro(s) e áreas':'Nenhuma alteração pendente';
   }
   statusSelect.addEventListener('change',updatePreview);
   campaignSelect.addEventListener('change',updatePreview);
   for(const c of areaInputs.values())c.addEventListener('change',updatePreview);
   for(const [,c] of bookInputs)c.addEventListener('change',()=>{
    if(c.checked&&statusSelect.value==='approved'&&!areaInputs.get('library').checked){
     areaInputs.get('library').checked=true;
     saveFeedback.textContent='Biblioteca foi marcada junto com o novo livro para que a leitura possa funcionar.';
    }
    updatePreview();
   });
   updatePreview();
  }
  searchInput.addEventListener('input',()=>{search=searchInput.value;drawRoster();});
  filterInput.addEventListener('change',()=>{filter=filterInput.value;drawRoster();});
  drawRoster();
 }
 function renderBooks(){
  toolbar.append(n('p','access-section-intro','Aqui você controla a liberação do volume e quem recebe autorização. Uma atribuição só vira leitura efetiva quando a conta está aprovada e tem Biblioteca.'));
  const grid=n('div','access-book-summary');
  for(const book of data.books){
   const tile=action('',()=>{selectedBook=book.id;renderMode();},'access-book-tile');
   tile.setAttribute('aria-pressed',String(selectedBook===book.id));
   tile.append(n('strong','',book.title),labelState(book.published?'Disponível aos autorizados':'Leitura pausada',book.published?'good':'warning'),
    n('small','',(book.published?book.eligible:0)+' leitura(s) efetiva(s) · '+book.assigned+' atribuição(ões)'));
   grid.append(tile);
  }
  toolbar.append(grid);
  const book=data.books.find(b=>b.id===selectedBook);
  if(!book)return;
  const panel=n('section','access-book-manager');
  panel.append(n('p','access-eyebrow','CONTROLE DO VOLUME'),n('h3','',book.title));
  panel.append(notice(book.published?
   'Este livro NÃO é público. Somente contas aprovadas, com Biblioteca e autorização individual conseguem ler.':
   'O livro está pausado. Mesmo as pessoas já marcadas como autorizadas não conseguem ler até você habilitar a liberação.','info'));
  const release=n('div','access-publish');
  release.append(labelState(book.ready?'Manuscrito e enigma preparados':'Conteúdo incompleto',book.ready?'good':'bad'),
   labelState(book.published?'Disponível para autorizados':'Pausado',book.published?'good':'warning'));
  const publishing=action(book.published?'Pausar leitura do livro':'Liberar para pessoas autorizadas',async()=>{
   const current=book.published;
   const prompt=current
    ?'Pausar '+book.title+'? As pessoas perderão acesso enquanto o volume estiver pausado, mas as atribuições serão preservadas.'
    :'Liberar '+book.title+' SOMENTE para as pessoas com autorização individual, conta aprovada e Biblioteca habilitada?';
   if(!confirm(prompt))return;
   await rpc('haema_reserved_admin_publish',{book_key:book.id,next_published:!current});
   await refresh('Situação de '+book.title+' atualizada.');
  },'access-primary');
  if(!book.ready)publishing.disabled=true;
  release.append(publishing);panel.append(release);
  const recipients=n('section','access-book-recipients');
  recipients.append(n('h4','','Pessoas autorizadas para este livro'),
   small('Marque ou desmarque as contas aprovadas com acesso à Biblioteca. Para conceder acesso à Biblioteca ou aprovar uma conta, use a visão Por pessoa.'));
  const chooser=n('div','access-recipients-list'),selected=new Set(bookRecipients(data,book.id).map(u=>u.id));
  const expected=bookRecipients(data,book.id).map(u=>u.id);
  const recipientsList=data.users.filter(u=>!u.admin).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  let checkedById=new Map();
  function renderRecipients(){
   chooser.replaceChildren();checkedById=new Map();
   for(const user of recipientsList){
    const eligible=user.status==='approved'&&user.areas.includes('library');
    const row=n('label','access-recipient'),box=n('input');box.type='checkbox';
    box.checked=selected.has(user.id);
    if(!eligible)box.disabled=true;
    const name=n('span','access-recipient-info');name.append(n('strong','',user.name),
     n('small','',eligible?'Conta aprovada · Biblioteca habilitada':user.status!=='approved'?'Conta '+statusText(user.status).toLowerCase():'Biblioteca não habilitada'));
    row.append(box,name,labelState(selected.has(user.id)?(book.published&&eligible?'Pode ler':'Atribuído, bloqueado'):'Não atribuído',
      selected.has(user.id)&&eligible&&book.published?'good':selected.has(user.id)?'warning':'muted'));
    if(!eligible){
      const open=action('Editar pessoa',()=>{selectedUser=user.id;mode='users';renderMode();},'access-link');
      row.append(open);
    }
    box.addEventListener('change',()=>{if(box.checked)selected.add(user.id);else selected.delete(user.id);renderRecipients();updateRecipientsSave();});
    checkedById.set(user.id,box);chooser.append(row);
   }
  }
  const actions=n('div','access-save-row'),warning=n('p','access-save-feedback');warning.setAttribute('role','status');
  const save=action('Salvar pessoas autorizadas',async()=>{
   const selectedIds=[...selected];
   const removed=expected.filter(id=>!selected.has(id));
   if(removed.length&&!confirm('Revogar o acesso de '+removed.length+' pessoa(s) a '+book.title+'?'))return;
   warning.textContent='Salvando autorizações…';
   try{
    await rpc('haema_access_control_book_save',{book_key:book.id,requested_users:selectedIds,expected_users:expected});
    await refresh('Destinatários de '+book.title+' atualizados.');
   }catch(error){warning.textContent=error.message||'Não foi possível salvar.';warning.dataset.error='true';}
  },'access-primary');
  actions.append(save,warning);
  function updateRecipientsSave(){
   const changed=!equal([...selected],expected);
   save.disabled=!changed;save.textContent=changed?'Salvar '+selected.size+' atribuição(ões)':'Nenhuma mudança pendente';
  }
  renderRecipients();updateRecipientsSave();
  recipients.append(chooser,actions);panel.append(recipients);body.append(panel);
 }
 function renderAudit(){
  toolbar.append(small('Últimos registros administrativos de aprovação, acesso aos livros e liberação de volumes.'));
  const names=Object.fromEntries(data.users.map(u=>[u.id,u.name]));
  const events={
   'access.review':'Aprovação ou revisão de conta','access.bundle':'Permissões da pessoa salvas',
   'reserved.grant':'Autorização individual de livro','reserved.access.book':'Destinatários de livro atualizados',
   'reserved.publish':'Disponibilidade de livro alterada'
  };
  const list=n('div','access-audit-list');
  for(const log of data.recent){
   const row=n('article','access-audit-item');
   row.append(n('time','',toDate(log.at)),n('strong','',events[log.action]||'Atualização administrativa'));
   const subject=log.subject?names[log.subject]||'Conta cadastrada':null;
   const d=log.details||{},label=subject||d.book||'Biblioteca';
   row.append(n('p','',label));
   if(d.before_status&&d.after_status)row.append(n('small','','Situação: '+statusText(d.before_status)+' → '+statusText(d.after_status)));
   list.append(row);
  }
  if(!data.recent.length)list.append(small('Nenhuma alteração registrada.'));
  body.append(list);
 }
 const who=await access();
 if(!active())return;
 if(!who.admin){root.replaceChildren(notice('Esta área exige uma conta administradora.','error'));return;}
 await refresh();
}
