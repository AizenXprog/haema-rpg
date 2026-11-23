'use strict';
/* HÆMA · Arquivo Técnico do Mestre.
 * No secret data in source, localStorage, or preview. Supabase RLS decides access.
 * Site e Sistema criado por Vitor Monte.
 */
const KINDS=Object.freeze({
 jornada:'Jornada / arco',sessao:'Sessão',npc:'Personagem do mundo',
 criatura:'Criatura observada',local:'Local',pista:'Pista / revelação',
 encontro:'Encontro',cronologia:'Linha do tempo',recurso:'Recurso / preparação',nota:'Anotação'
});
const BOOK_STATES=Object.freeze({canon:'Consolidado',concept:'Conceito',historical:'Registro histórico',proposal:'Proposta',legend:'Relato sem comprovação física'});
const FAUNA_THREAT=Object.freeze({hostile:'Fauna de risco',non_hostile:'Não hostil',undetermined:'Perigo não definido'});
const SECTIONS=Object.freeze([
 ['overview','Visão geral','O que acompanhar'],
 ['journeys','Jornadas e sessões','Planejamento e andamento'],
 ['world','Mundo e Bestiário','Tudo o que vive e acontece'],
 ['archive','Arquivo reservado','Anotações e auditoria']
]);
const el=(tag,cls,text)=>{
 const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;
};
const btn=(text,callback,cls='master-button secondary')=>{
 const b=el('button',cls,text);b.type='button';b.addEventListener('click',callback);return b;
};
const control=(title,type='text',value='')=>{
 const root=el('div','master-field'),label=el('label','',title),input=type==='textarea'?el('textarea'):type==='select'?el('select'):el('input');
 const id='master-field-'+Math.random().toString(36).slice(2,10);
 label.htmlFor=id;input.id=id;
 if(!['textarea','select'].includes(type))input.type=type;
 if(type!=='select')input.value=value??'';
 root.append(label,input);
 return {root,input};
};
function option(select,value,title){
 const o=el('option','',title);o.value=value;select.append(o);
}
function fmtTime(raw){
 if(!raw)return '';
 const d=new Date(raw);
 return Number.isFinite(d.getTime())?d.toLocaleString('pt-BR',{dateStyle:'medium',timeStyle:'short'}):'';
}
function safeText(value,max=40000){return String(value??'').trim().slice(0,max);}
function snippet(value,max=200){
 const text=String(value??'').replace(/\s+/g,' ').trim();
 return text.length>max?text.slice(0,max-1)+'…':text;
}
function kindLabel(k){return KINDS[k]||'Registro';}
function createFieldSelect(title,items,current){
 const f=control(title,'select');
 for(const [key,label] of items)option(f.input,key,label);
 if(current!==undefined&&current!==null)f.input.value=current;
 return f;
}
export function renderMasterArchive({
 panel,client,user,campaign,campaigns,oldRecords=[],members=[],names={},audit=[],
 onCampaignChange,onLegacyEdit,isCurrent
}){
 if(!panel||!client||!user||!campaign||campaign.gm_id!==user.id){
  panel?.replaceChildren(el('p','portal-info','Arquivo restrito ao mestre responsável por esta campanha.'));
  return;
 }
 const state={items:[],fauna:[],faunaError:'',mode:'overview',query:'',worldFilter:'all',faunaClass:'all',faunaPage:0,journeyFilter:'all',showArchived:false,form:null};
 let request=0;
 const mount=el('div','master-workspace');
 panel.replaceChildren(mount);
 const isAlive=()=>panel.isConnected&&(!isCurrent||isCurrent());
 const message=(text,error=false)=>{
  if(!isAlive())return;
  const existing=mount.querySelector('.master-feedback');
  if(existing)existing.remove();
  const m=el('p','master-feedback'+(error?' is-error':''),text);
  m.setAttribute('role','status');mount.prepend(m);
 };
 async function readData(){
  const token=++request;
  const archive=await client.from('haema_gm_archive')
   .select('id,campaign_id,owner_id,parent_id,kind,title,content,status,tags,bestiary_id,metadata,archived,created_at,updated_at')
   .eq('campaign_id',campaign.id).order('updated_at',{ascending:false}).limit(500);
  if(archive.error)throw archive.error;
  const fauna=await client.rpc('haema_gm_bestiary_index',{cid:campaign.id});
  if(!isAlive()||token!==request)return false;
  state.items=Array.isArray(archive.data)?archive.data:[];
  state.fauna=Array.isArray(fauna.data)?fauna.data:[];
  state.faunaError=fauna.error?'O Bestiário exige autorização própria da Biblioteca. Os registros privados continuam disponíveis.':'';
  return true;
 }
 function topbar(){
  const hero=el('header','master-hero');
  const left=el('div');
  left.append(el('p','master-eyebrow','HÆMA · ARQUIVO PRIVADO DO MESTRE'),el('h2','','Seu mundo, documentado.'));
  left.append(el('p','master-lead','Jornadas, sessões, criaturas, pistas, NPCs e decisões num único lugar. Nada aqui é revelado automaticamente aos jogadores.'));
  const row=el('div','master-hero-actions');
  if(campaigns.length>1){
   const sel=createFieldSelect('Campanha',campaigns.map(c=>[c.id,c.name]),campaign.id);
   sel.input.addEventListener('change',()=>onCampaignChange?.(sel.input.value));
   row.append(sel.root);
  }else row.append(el('span','master-campaign-name',campaign.name));
  const back=el('a','master-text-link','Voltar às fichas');
  back.href='fichas.html?secao=characters';
  row.append(back);hero.append(left,row);return hero;
 }
 function tabs(){
  const nav=el('nav','master-nav');nav.setAttribute('aria-label','Áreas técnicas do mestre');
  for(const [id,title,subtitle] of SECTIONS){
   const b=btn('',()=>{state.mode=id;state.query='';draw()},'master-tab'+(state.mode===id?' is-active':''));
   b.setAttribute('aria-current',state.mode===id?'page':'false');
   b.append(el('strong','',title),el('small','',subtitle));nav.append(b);
  }
  return nav;
 }
 function tile(value,label,detail){
  const box=el('div','master-stat');box.append(el('strong','',String(value)),el('span','',label),el('small','',detail));return box;
 }
 function searchBar(placeholder='Buscar neste arquivo…'){
  const c=el('div','master-search'),label=el('label','','Pesquisar'),input=el('input');
  input.type='search';input.placeholder=placeholder;input.value=state.query;label.append(input);
  input.addEventListener('input',()=>{state.query=input.value.toLocaleLowerCase('pt-BR').trim();state.faunaPage=0;drawResults()});
  c.append(label);return c;
 }
 function matches(obj){
  if(!state.query)return true;
  const src=[obj.title,obj.content,obj.kind,kindLabel(obj.kind),...(obj.tags||[]),obj.bestiary_id||''].join(' ').toLocaleLowerCase('pt-BR');
  return src.includes(state.query);
 }
 function pending(){
  const count=state.items.filter(i=>!i.archived&&i.status==='rascunho').length;
  return count;
 }
 function recordCard(item){
  const card=el('article','master-record');
  const top=el('div','master-record-head');
  const label=el('div');label.append(el('small','master-record-kind',kindLabel(item.kind)),el('h3','',item.title));
  const mark=el('span','master-status',item.archived?'Arquivado':item.status);
  top.append(label,mark);card.append(top);
  if(item.content)card.append(el('p','master-record-copy',snippet(item.content,245)));
  const more=el('p','master-record-meta',
   [fmtTime(item.updated_at),...(item.tags||[]).slice(0,4).map(t=>'#'+t)].filter(Boolean).join(' · '));
  card.append(more);
  if(item.bestiary_id){
   const animal=state.fauna.find(f=>f.id===item.bestiary_id);
   card.append(el('p','master-linked','Bestiário: '+(animal?.title||item.bestiary_id)));
  }
  if(item.parent_id){
   const relation=state.items.find(n=>n.id===item.parent_id);
   if(relation)card.append(el('p','master-linked','Ligado a: '+relation.title));
  }
  const actions=el('div','master-record-actions');
  actions.append(btn('Abrir e editar',()=>edit(item)));
  actions.append(btn(item.archived?'Restaurar':'Arquivar',()=>void archiveItem(item)));
  card.append(actions);return card;
 }
 function collection(parent,items,emptyMessage){
  const box=el('div','master-collection');
  if(items.length===0)box.append(el('p','master-empty',emptyMessage));
  for(const it of items)box.append(recordCard(it));
  parent.append(box);return box;
 }
 function sectionHead(title,desc,kind){
  const header=el('div','master-section-heading'),col=el('div');
  col.append(el('h3','',title));if(desc)col.append(el('p','',desc));
  header.append(col);
  if(kind)header.append(btn('+ Novo registro',()=>edit(null,kind),'master-button'));
  return header;
 }
 function overview(host){
  const active=state.items.filter(i=>!i.archived);
  const counts=el('div','master-stats');
  counts.append(tile(active.filter(i=>i.kind==='jornada').length,'Jornadas','Arcos registrados'),
    tile(active.filter(i=>i.kind==='sessao').length,'Sessões','Memória das mesas'),
    tile(state.fauna.length||'—','Entradas do Bestiário','Espécies e relatos separados'),
    tile(pending(),'Pendências','Rascunhos internos'));
  host.append(counts);
  const box=el('div','master-dashboard-grid');
  const quick=el('section','master-surface');
  quick.append(sectionHead('Antes da próxima sessão','Mantenha o essencial pronto para mestrar.'));
  const actions=el('div','master-shortcuts');
  for(const [label,kind] of [['Planejar jornada','jornada'],['Registrar sessão','sessao'],['Criar NPC','npc'],['Guardar pista','pista'],['Preparar encontro','encontro'],['Anotação livre','nota']]){
   actions.append(btn(label,()=>edit(null,kind),'master-quick'));
  }
  quick.append(actions);box.append(quick);
  const recent=el('section','master-surface');
  recent.append(sectionHead('Atualizações recentes','Atividade privada desta campanha.'));
  collection(recent,active.slice(0,4),'Nenhum registro ainda. Use os atalhos ao lado para começar.');
  box.append(recent);host.append(box);
  const notice=el('p','master-note','Somente o mestre desta campanha pode ler ou editar este arquivo. Para mostrar algo aos jogadores, publique um Material separado; publicar no Bestiário não cria cânone.');
  host.append(notice);
 }
 function journeys(host){
  host.append(sectionHead('Jornadas e sessões','Planeje arcos e documente cada sessão como parte de uma jornada.','jornada'));
  const bar=el('div','master-toolbar');
  const filter=createFieldSelect('Exibir',[['all','Tudo'],['jornada','Jornadas'],['sessao','Sessões'],['cronologia','Linha do tempo']],state.journeyFilter);
  filter.input.addEventListener('change',()=>{state.journeyFilter=filter.input.value;drawResults()});
  bar.append(filter.root,searchBar('Buscar jornada, data, sessão…'),btn('+ Sessão',()=>edit(null,'sessao'),'master-button'));
  host.append(bar);
  const list=el('div','master-results');list.dataset.results='yes';host.append(list);
  drawListFor(host,'journey');
 }
 function world(host){
  host.append(sectionHead('Mundo, encontros e criaturas','O Bestiário é a referência; as notas registram como cada espécie apareceu na sua campanha.','criatura'));
  const bar=el('div','master-toolbar');
  const filter=createFieldSelect('Organizar por',[['all','Tudo'],['bestiary','Bestiário'],['criatura','Observações de criaturas'],['npc','NPCs'],['local','Locais'],['pista','Pistas'],['encontro','Encontros']],state.worldFilter);
  filter.input.addEventListener('change',()=>{state.worldFilter=filter.input.value;state.faunaPage=0;drawResults()});
  const faunaClass=createFieldSelect('Fauna',[['all','Todas'],['hostile','Risco de exploração'],['non_hostile','Não hostil'],['undetermined','Perigo indefinido'],['legend','Relatos não comprovados']],state.faunaClass);
  faunaClass.input.addEventListener('change',()=>{state.faunaClass=faunaClass.input.value;state.faunaPage=0;drawResults()});
  bar.append(filter.root,faunaClass.root,searchBar('Buscar espécie, região, código, NPC…'));
  host.append(bar);
  const list=el('div','master-results');list.dataset.results='yes';host.append(list);
  drawListFor(host,'world');
 }
 function history(host){
  host.append(sectionHead('Arquivo e decisões','Registros antigos permanecem preservados. A auditoria é somente leitura.','nota'));
  host.append(searchBar('Buscar notas, decisões ou história…'));
  const list=el('div','master-results');list.dataset.results='yes';host.append(list);
  drawListFor(host,'history');
 }
 async function readAnimal(animal){
  if(!isAlive())return;
  const dialog=el('dialog','master-dialog');
  const head=el('div','master-dialog-head');
  const close=btn('Fechar ✕',()=>dialog.close(),'master-dialog-close');
  head.append(el('p','master-eyebrow','HÆMA · DOSSIÊ DO BESTIÁRIO'),close);
  const body=el('div','master-dossier');
  body.append(el('p','master-dossier-loading','Consultando registro integral…'));
  dialog.append(head,body);
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
  dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  mount.append(dialog);dialog.showModal();
  const {data,error}=await client.rpc('haema_gm_bestiary_entry',{cid:campaign.id,entry_id:animal.id});
  if(!dialog.open||!isAlive())return;
  body.replaceChildren();
  if(error||!data||!Array.isArray(data.paragraphs)){
   body.append(el('p','master-feedback is-error',error?.message||'Registro indisponível. Confira o acesso do mestre.'));
   return;
  }
  body.append(el('p','master-dossier-state',BOOK_STATES[data.state]||'Registro'),
   el('h2','',data.title),el('p','master-dossier-subtitle',data.subtitle));
  if(data.state==='legend')body.append(el('p','master-dossier-warning','Relato canônico como tradição, mas a existência física não está comprovada. Este registro fica reservado ao mestre.'));
  else if(data.state!=='canon')body.append(el('p','master-dossier-warning','Texto em estudo. A publicação não significa aprovação de cânone.'));
  if(data.existence==='historical_survival_unknown')body.append(el('p','master-dossier-warning','Sua existência histórica é reconhecida; a sobrevivência atual permanece desconhecida.'));
  if(data.threat)body.append(el('p','master-dossier-classification',(FAUNA_THREAT[data.threat]||'Perigo indefinido')+(data.region?' · '+data.region:'')));
  for(let i=0;i<data.paragraphs.length;i++){
   const para=el('p','master-dossier-paragraph',data.paragraphs[i]);
   body.append(para);
  }
  const actions=el('div','master-record-actions');
  actions.append(btn('Registrar encontro com '+data.title,()=>{dialog.close();edit(null,'criatura',data.id)},'master-button'));
  actions.append(btn('Voltar ao arquivo',()=>dialog.close()));
  body.append(actions);
 }

 function animalCard(animal){
  const card=el('article','master-animal');
  const top=el('div','master-animal-head');
  top.append(el('strong','',animal.title),el('span','',BOOK_STATES[animal.state]||'Registro'));
  card.append(top,el('p','',animal.subtitle||''));
  const facets=[FAUNA_THREAT[animal.threat],animal.region&&animal.region.length<54?animal.region:null].filter(Boolean);
  if(facets.length)card.append(el('small','master-animal-facets',facets.join(' · ')));
  if(animal.state==='legend')card.append(el('p','master-animal-uncertain','Relato preservado · não comprova a existência de uma espécie.'));
  const row=el('div','master-record-actions');
  row.append(btn('Ler ficha completa',()=>void readAnimal(animal),'master-button'));
  row.append(btn('+ Anotar na campanha',()=>edit(null,'criatura',animal.id)));
  const count=state.items.filter(x=>x.bestiary_id===animal.id&&!x.archived).length;
  row.append(el('span','master-animal-count',count+' anotação(ões)'));
  card.append(row);return card;
 }
 function drawListFor(host,group){
  const results=host.querySelector('[data-results]');if(!results)return;
  results.replaceChildren();
  const relevant=state.items.filter(item=>
   (state.showArchived||!item.archived)&&matches(item)&&(
   group==='journey'?['jornada','sessao','cronologia'].includes(item.kind)&&(state.journeyFilter==='all'||item.kind===state.journeyFilter):
   group==='world'?['criatura','npc','local','pista','encontro'].includes(item.kind)&&(state.worldFilter==='all'||state.worldFilter==='bestiary'||state.worldFilter===item.kind):
   ['nota','recurso'].includes(item.kind)
  ));
  if(group==='world'&&['all','bestiary'].includes(state.worldFilter)){
   const intro=el('div','master-archive-label');
   const legends=state.fauna.filter(a=>a.state==='legend').length;
   intro.append(el('h4','','Bestiário · '+state.fauna.length+' registros'),
    el('p','','Espécies documentadas e '+legends+' relatos sem comprovação física. Ameaça, descoberta e estado canônico são classificações independentes.'));
   results.append(intro);
   if(state.faunaError)results.append(el('p','master-empty',state.faunaError));
   const matched=state.fauna.filter(a=>{
    if(state.faunaClass==='legend'&&a.state!=='legend')return false;
    if(state.faunaClass!=='all'&&state.faunaClass!=='legend'&&a.threat!==state.faunaClass)return false;
    return !state.query||[a.title,a.subtitle,a.state,a.region,a.source_code,FAUNA_THREAT[a.threat]].join(' ').toLocaleLowerCase('pt-BR').includes(state.query);
   });
   const perPage=18;
   const maxPage=Math.max(0,Math.ceil(matched.length/perPage)-1);
   state.faunaPage=Math.min(state.faunaPage,maxPage);
   const gallery=el('div','master-animal-grid');
   matched.slice(state.faunaPage*perPage,(state.faunaPage+1)*perPage).forEach(a=>gallery.append(animalCard(a)));
   if(!matched.length)gallery.append(el('p','master-empty','Nenhuma criatura corresponde à busca ou à sua permissão de acesso.'));
   results.append(gallery);
   if(matched.length>perPage){
    const pager=el('nav','master-fauna-pager');
    pager.setAttribute('aria-label','Páginas do Bestiário do mestre');
    const previous=btn('← Anteriores',()=>{state.faunaPage=Math.max(0,state.faunaPage-1);drawResults()});
    const next=btn('Próximos →',()=>{state.faunaPage=Math.min(maxPage,state.faunaPage+1);drawResults()});
    previous.disabled=state.faunaPage===0;
    next.disabled=state.faunaPage===maxPage;
    pager.append(previous,el('span','',String(state.faunaPage+1)+' / '+String(maxPage+1)+' · '+matched.length+' resultados'),next);
    results.append(pager);
   }
  }
  const h=el('div','master-archive-label');
  h.append(el('h4','',group==='world'?'Anotações da campanha':group==='journey'?'Diário de jornadas':'Anotações técnicas'));
  results.append(h);collection(results,relevant,'Não há registros correspondentes.');
  if(group==='history'){
   const legacy=oldRecords.filter(x=>!state.query||[x.title,x.content,x.category].join(' ').toLocaleLowerCase('pt-BR').includes(state.query));
   const leg=el('div','master-archive-label');leg.append(el('h4','','Caderno anterior · '+oldRecords.length+' registros'));
   results.append(leg);
   for(const record of legacy){
    const box=el('article','master-record');
    box.append(el('h3','',record.title),el('p','master-record-copy',snippet(record.content)),
      el('p','master-record-meta',(record.category||'').toUpperCase()+' · '+fmtTime(record.updated_at)),
      btn('Abrir caderno anterior',()=>onLegacyEdit?.(record)));
    results.append(box);
   }
   const auditHead=el('div','master-archive-label');auditHead.append(el('h4','','Auditoria e alterações'));
   results.append(auditHead);
   const auditBox=el('div','master-audit');
   for(const a of audit.slice(0,35)){
    const name=names[a.actor_id]||'Sistema';
    auditBox.append(el('p','',fmtTime(a.occurred_at)+' · '+name+' · '+a.entity_type+' · '+a.action));
   }
   if(!audit.length)auditBox.append(el('p','master-empty','Nenhuma alteração registrada.'));
   results.append(auditBox);
   const people=el('p','master-note','Integrantes da campanha: '+members.length+'. Gerencie permissões pela Central de Acessos, não por este arquivo.');
   results.append(people);
  }
 }
 function drawResults(){
  const host=mount.querySelector('.master-content');
  if(host)drawListFor(host,state.mode==='journeys'?'journey':state.mode==='world'?'world':'history');
 }
 function draw(){
  if(!isAlive())return;
  state.form=null;mount.replaceChildren(topbar(),tabs());
  const area=el('div','master-content');
  mount.append(area);
  switch(state.mode){
   case 'journeys':journeys(area);break;
   case 'world':world(area);break;
   case 'archive':history(area);break;
   default:overview(area);
  }
 }
 async function archiveItem(item){
  if(!isAlive())return;
  if(!window.confirm((item.archived?'Restaurar':'Arquivar')+' o registro "'+item.title+'"? Ele não será apagado.'))return;
  const {error}=await client.from('haema_gm_archive')
   .update({archived:!item.archived,updated_at:new Date().toISOString()})
   .eq('id',item.id).eq('campaign_id',campaign.id).eq('owner_id',user.id);
  if(error){message(error.message,true);return;}
  await refresh('Registro atualizado no arquivo.');
 }
 async function refresh(text){
  try{if(await readData()){draw();if(text)message(text);}}
  catch(error){message(error.message||'Erro ao carregar arquivo.',true)}
 }
 function edit(existing,preferred='nota',animalId=null){
  if(!isAlive())return;
  const kind=existing?.kind||preferred;
  mount.replaceChildren();
  const wrapper=el('div','master-editor');
  const heading=el('header','master-editor-heading');
  heading.append(btn('← Voltar ao arquivo',draw),el('h2','',existing?'Editar registro':'Novo registro técnico'),
   el('p','','Somente o mestre tem acesso. Estes campos não alteram o cânone nem publicam materiais aos jogadores.'));
  wrapper.append(heading);
  const form=el('form','master-form'),grid=el('div','master-form-grid');
  const kindField=createFieldSelect('Tipo de registro',Object.entries(KINDS),kind);
  const name=control('Título','text',existing?.title||'');name.input.required=true;name.input.maxLength=160;
  const status=createFieldSelect('Andamento',[['rascunho','Rascunho'],['ativo','Em andamento'],['concluido','Concluído'],['arquivado','Arquivado']],existing?.status||'rascunho');
  const priority=createFieldSelect('Prioridade',[['normal','Normal'],['alta','Alta'],['baixa','Baixa']],existing?.metadata?.priority||'normal');
  const tags=control('Marcadores separados por vírgula','text',(existing?.tags||[]).join(', '));tags.input.maxLength=500;
  const date=control('Data da sessão ou acontecimento','date',existing?.metadata?.date||'');
  const parent=createFieldSelect('Ligado a', [['','Sem relação'],...state.items
   .filter(i=>i.id!==existing?.id&&['jornada','sessao'].includes(i.kind))
   .map(x=>[x.id,kindLabel(x.kind)+' · '+x.title])],existing?.parent_id||'');
  const fauna=createFieldSelect('Referência do Bestiário',[['','Sem criatura vinculada'],...state.fauna.map(f=>[f.id,f.title])],existing?.bestiary_id||animalId||'');
  const content=control('Notas, acontecimentos, preparação e consequências','textarea',existing?.content||'');content.input.maxLength=40000;
  for(const f of [kindField,name,status,priority,tags,date,parent,fauna])grid.append(f.root);
  form.append(grid,content.root);
  const note=el('p','master-form-note','Os registros ficam privados nesta campanha. Para divulgar um documento, use Materiais e escolha o que compartilhar.');
  form.append(note);
  const actions=el('div','master-form-actions'),save=btn('Salvar registro',()=>{},'master-button');
  save.type='submit';actions.append(save,btn('Cancelar',draw));form.append(actions);
  form.addEventListener('submit',async e=>{
   e.preventDefault();
   const type=kindField.input.value;
   if(!KINDS[type]){message('Tipo inválido.',true);return;}
   const title=safeText(name.input.value,160);
   if(!title){message('Informe um título.',true);return;}
   const tagList=[...new Set(tags.input.value.split(',').map(x=>safeText(x,40)).filter(Boolean))].slice(0,24);
   const parentId=parent.input.value||null;
   if(parentId&&existing){
    let cursor=parentId;
    const seen=new Set();
    while(cursor&&!seen.has(cursor)){
     if(cursor===existing.id){message('Relação circular: um registro não pode ser ancestral de si mesmo.',true);return;}
     seen.add(cursor);cursor=state.items.find(x=>x.id===cursor)?.parent_id;
    }
   }
   const payload={
    kind:type,title,content:content.input.value,status:status.input.value,tags:tagList,
    parent_id:parentId,bestiary_id:fauna.input.value||null,
    metadata:{date:date.input.value||null,priority:priority.input.value},
    updated_at:new Date().toISOString()
   };
   save.disabled=true;
   const op=existing?client.from('haema_gm_archive').update(payload)
    .eq('id',existing.id).eq('campaign_id',campaign.id).eq('owner_id',user.id):
    client.from('haema_gm_archive').insert({...payload,campaign_id:campaign.id,owner_id:user.id});
   const result=await op;save.disabled=false;
   if(result.error){const report=el('p','master-feedback is-error',result.error.message);form.prepend(report);return;}
   await refresh('Registro salvo com segurança.');
  });
  wrapper.append(form);mount.append(wrapper);
  name.input.focus({preventScroll:true});
 }
 mount.append(el('div','master-loading','Consultando o arquivo privado…'));
 void refresh();
}
