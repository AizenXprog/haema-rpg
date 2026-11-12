import {access,rpc,node} from './auth.js';
const n=(tag,cls='',value)=>node(tag,cls,value);
const TYPES=[
 ['','Todas as atividades'],['session','Sessões'],['navigation','Navegação'],
 ['library','Biblioteca'],['puzzle','Enigmas'],['character','Fichas'],
 ['material','Materiais'],['record','Registros do mestre'],['campaign','Campanhas'],
 ['chat','Mensagens enviadas'],['access','Permissões'],['security','Segurança']
];
const BOOKS={'arquivos-silenciados':'Os Arquivos Silenciados','peso-da-coroa':'O Peso da Coroa','regencias-conhecidas':'Tratado das Regências Conhecidas'};
const ACTION={
 'page.view':'Visitou página','session.connected':'Sessão autenticada',
 'book.open':'Abriu manuscrito','book.chapter':'Mudou de capítulo',
 'puzzle.attempt':'Tentou solucionar enigma','reserved.puzzle.solved':'Concluiu enigma',
 'chat.sent':'Enviou mensagem à campanha','campaign.created':'Criou campanha',
 'campaign.member_added':'Entrou na campanha','campaign.member_removed':'Saiu da campanha',
 'character.insert':'Criou ficha','character.update':'Editou ficha','character.delete':'Excluiu ficha',
 'material.insert':'Criou material','material.update':'Editou material','material.delete':'Excluiu material',
 'record.insert':'Criou registro do mestre','record.update':'Editou registro do mestre','record.delete':'Excluiu registro do mestre',
 'access.review':'Revisou acesso de pessoa','access.bundle':'Salvou permissões de pessoa',
 'reserved.grant':'Alterou autorização de livro','reserved.access.book':'Alterou destinatários do livro',
 'reserved.publish':'Alterou liberação do livro','volume.release':'Liberou ou recolheu volume',
 'reserved.import':'Importou manuscrito','reserved.reset':'Reiniciou progresso de leitura',
 'library.release':'Liberou trechos do Bestiário'
};
const dateString=date=>[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
function safeCsv(value){
 let str=String(value??'').replace(/[\r\n\t]+/g,' ').trim();
 if(/^[=+@-]/.test(str))str="'"+str;
 return '"'+str.replace(/"/g,'""')+'"';
}
function action(label,cb,cls='activity-button'){
 const b=n('button',cls,label);b.type='button';
 b.addEventListener('click',async()=>{if(b.disabled)return;b.disabled=true;
  try{await cb();}catch(e){const box=b.closest('.activity-center')?.querySelector('[data-activity-feedback]');if(box)box.textContent=e.message||'Falha na operação.';}
  finally{if(b.isConnected)b.disabled=false;}
 });return b;
}
const caption=(text)=>n('p','activity-caption',text);
const fmt=iso=>{try{return new Date(iso).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});}catch{return String(iso||'');}};
function topic(item){
 if(BOOKS[item.target])return BOOKS[item.target];
 if(item.action==='page.view')return item.target;
 if(item.action==='book.chapter')return (BOOKS[item.target]||item.target)+' · capítulo '+(Number(item.scope)+1);
 if(item.target&&/^[0-9a-f]{8}-/.test(item.target))return 'Registro '+item.target.slice(0,8);
 return item.target||'—';
}
const categoryName=x=>TYPES.find(t=>t[0]===x)?.[1]||x;
function fillSelect(select,items){
 for(const [v,label]of items){const o=n('option','',label);o.value=v;select.append(o);}
}
export async function renderActivityAdmin(panel,isCurrent=()=>true){
 const root=n('section','activity-center');
 const heading=n('div','activity-heading');
 heading.append(n('p','activity-kicker','HÆMA / PORTAL ADMINISTRATIVO'),
  n('h2','','Atividades e Auditoria'),
  caption('Eventos registrados para contas autenticadas. As alterações de fichas e permissões são verificadas no banco; a navegação é sinalizada pelo navegador e pode ser incompleta.'));
 const controls=n('div','activity-controls');
 const person=n('select','activity-select');person.setAttribute('aria-label','Filtrar por usuário');
 const category=n('select','activity-select');category.setAttribute('aria-label','Filtrar por categoria');
 const start=n('input','activity-date');start.type='date';start.setAttribute('aria-label','Data inicial');
 const end=n('input','activity-date');end.type='date';end.setAttribute('aria-label','Data final');
 const today=new Date();start.value=dateString(new Date(today.getTime()-6*86400000));end.value=dateString(today);
 const search=n('input','activity-search');search.type='search';search.placeholder='Buscar ação, livro ou registro';search.setAttribute('aria-label','Buscar no histórico exibido');
 const stats=n('div','activity-stats');
 const feedback=n('p','activity-feedback');feedback.dataset.activityFeedback='';feedback.setAttribute('role','status');
 const content=n('div','activity-stream'),pages=n('div','activity-pager');
 const actions=n('div','activity-actions');
 const privacy=n('p','activity-privacy');privacy.append('As páginas visitadas e ações relevantes são registradas, nunca senhas, textos de mensagens ou tentativas completas de enigmas. Eventos novos têm retenção de 90 dias. Consulte o ');
 const privacyLink=n('a','','aviso de privacidade');privacyLink.href='privacidade.html';privacy.append(privacyLink,'.');
 root.append(heading,stats,controls,actions,feedback,content,pages,privacy);panel.replaceChildren(root);
 const live=()=>root.isConnected&&isCurrent();
 const auth=await access();if(!live())return;
 if(!auth.admin){root.replaceChildren(caption('Acesso exclusivo à administração.'));return;}
 let offset=0,report=null,filtered=[],seq=0;
 fillSelect(category,TYPES);
 fillSelect(person,[['','Todas as pessoas']]);
 controls.append(person,category,start,end,search);
 async function fetchReport(size=50,at=offset){
  const from=start.value?new Date(start.value+'T00:00:00').toISOString():null;
  const to=end.value?new Date(end.value+'T23:59:59').toISOString():null;
  if(from&&to&&new Date(from)>new Date(to))throw Error('A data inicial não pode ser posterior à final.');
  return rpc('haema_activity_feed',{p_from:from,p_to:to,p_actor:person.value||null,p_category:category.value||null,p_limit:size,p_offset:at});
 }
 function showStats(){
  stats.replaceChildren();
  const entries=[['total','Eventos no período',report?.total||0],['library','Leitura',report?.counts?.library||0],['puzzle','Investigações',report?.counts?.puzzle||0],['access','Permissões',report?.counts?.access||0]];
  for(const [,label,value]of entries){
   const box=n('div','activity-stat');box.append(n('strong','',String(value)),n('span','',label));stats.append(box);
  }
 }
 function paint(){
  if(!live()||!report)return;
  filtered=(report.items||[]).filter(item=>{
   const q=search.value.trim().toLocaleLowerCase('pt-BR');
   return !q||[item.action,item.actor_name,item.subject_name,topic(item),item.category].join(' ').toLocaleLowerCase('pt-BR').includes(q);
  });
  content.replaceChildren();
  if(!filtered.length){content.append(caption(search.value?'Nenhuma ocorrência corresponde à busca nesta página.':'Nenhum evento encontrado para esses filtros.'));return;}
  let day='';
  for(const item of filtered){
   const date=String(item.occurred_at||'').slice(0,10);
   if(date!==day){day=date;content.append(n('h3','activity-date-heading',new Date(date+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})));}
   const row=n('article','activity-event');
   const icon=n('span','activity-event-marker','◈');
   const main=n('div','activity-event-main');
   main.append(n('strong','',ACTION[item.action]||item.action));
   const info=n('p','',item.actor_name||'Usuário não identificado');
   if(item.subject_name)info.append(' · pessoa afetada: '+item.subject_name);
   main.append(info,n('small','',topic(item)));
   const side=n('div','activity-event-side');
   side.append(n('time','',fmt(item.occurred_at)),
    n('span','activity-event-type',categoryName(item.category)),
    n('small','',item.source==='cliente'?'Informado pelo navegador':'Registrado no servidor'));
   row.append(icon,main,side);content.append(row);
  }
 }
 function paintPages(){
  pages.replaceChildren();
  const endIndex=Math.min(offset+50,Number(report?.total||0));
  pages.append(caption((report?.total?offset+1:0)+'–'+endIndex+' de '+(report?.total||0)+' eventos'));
  const back=action('Anterior',()=>{offset=Math.max(0,offset-50);return load();});
  const next=action('Próxima',()=>{offset+=50;return load();});
  back.disabled=offset===0;next.disabled=endIndex>=Number(report?.total||0);
  pages.append(back,next);
 }
 async function load(){
  const version=++seq;feedback.textContent='Consultando registros…';
  try{
   const result=await fetchReport();
   if(!live()||version!==seq)return;
   report=result;
   if(person.options.length===1&&Array.isArray(result.users)){
    const value=person.value;person.replaceChildren();
    fillSelect(person,[['','Todas as pessoas'],...result.users.map(u=>[u.id,u.name||'Conta'])]);
    person.value=value;
   }
   feedback.textContent=report.total+' evento(s) encontrado(s).';
   showStats();paint();paintPages();
  }catch(e){if(live()&&version===seq){feedback.textContent=e.message||'Não foi possível consultar a auditoria.';content.replaceChildren();}}
 }
 function update(){offset=0;return load();}
 const apply=action('Aplicar filtros',update,'activity-primary');
 const refresh=action('Atualizar',()=>load());
 const exportBtn=action('Exportar CSV',async()=>{
  if(!report?.total){feedback.textContent='Nenhum evento disponível para exportação.';return;}
  feedback.textContent='Preparando exportação dos eventos filtrados…';
  const total=Math.min(10000,Number(report.total));
  const rows=[];
  for(let at=0;at<total;at+=1000){
   const result=await fetchReport(Math.min(1000,total-at),at);
   rows.push(...(result.items||[]));
   if(!live())return;
  }
  const headers=['Data e hora','Usuário','Categoria','Ação','Referência','Pessoa afetada','Origem'];
  const lines=[headers.map(safeCsv).join(';'),...rows.map(v=>[fmt(v.occurred_at),v.actor_name,categoryName(v.category),ACTION[v.action]||v.action,topic(v),v.subject_name,v.source].map(safeCsv).join(';'))];
  const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});
  const href=URL.createObjectURL(blob);
  const a=n('a');a.href=href;a.download='haema-atividades-'+dateString(new Date())+'.csv';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(href),1000);
  feedback.textContent=rows.length+' evento(s) exportado(s)'+(report.total>10000?' (limite de 10.000 por arquivo).':'.');
 });
 const retention=action('Aplicar retenção',async()=>{
  if(!confirm('Excluir apenas eventos novos com mais de 90 dias? Os registros históricos anteriores continuarão protegidos no banco.'))return;
  const removed=await rpc('haema_activity_prune');
  feedback.textContent=removed+' evento(s) expirado(s) removido(s).';
  await load();
 });
 actions.append(apply,refresh,exportBtn,retention);
 search.addEventListener('input',paint);
 person.addEventListener('change',()=>void update());
 category.addEventListener('change',()=>void update());
 start.addEventListener('change',()=>void update());
 end.addEventListener('change',()=>void update());
 await load();
}
