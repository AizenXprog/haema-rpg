/* HÆMA · Console privado do Mestre. Sem dados confidenciais em código ou armazenamento local.
 * Toda leitura e escrita depende das permissões verificadas pelo Supabase.
 * Site e Sistema criado por Vitor Monte.
 */
(()=>{'use strict';
 const tabs={live:'Mesa ao Vivo',overview:'Visão da sessão',tree:'Evolução',characters:'Personagens',notes:'Campanha',tools:'Ferramentas',reference:'Regras rápidas',archive:'HÆMA Archive'};
 let currentEpoch=0,currentLive=null;
 const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
 const limited=(v,n=2000)=>String(v??'').slice(0,n);
 const fmt=s=>{const d=new Date(s);return Number.isFinite(d.valueOf())?d.toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}):''};
 const appendText=(p,tag,text)=>p.append(el(tag,'',text));
 function init(){
  const gate=document.getElementById('command-gate'),app=document.getElementById('command-workspace');
  if(!gate||!app||app.dataset.ready==='yes')return;
  app.dataset.ready='yes';const thisEpoch=++currentEpoch;
  const $=id=>document.getElementById(id);
  const state={db:null,user:null,campaigns:[],campaign:null,members:[],names:new Map(),characters:[],notes:[],tree:[],archivedTree:new Set(),tab:'live',busy:false};
  const alive=()=>thisEpoch===currentEpoch&&gate.isConnected&&app.isConnected;
  const alert=(message,error=false)=>{if(!alive())return;const n=$('command-feedback');n.textContent=message||'';n.dataset.error=error?'true':'false'};
  const query=async promise=>{const {data,error}=await promise;if(error)throw error;return data||[]};
  const gateInfo=(message,action)=>{if(!alive())return;$('command-gate-message').textContent=message;const target=$('command-gate-actions');target.replaceChildren();if(action){const b=el('button','command-btn primary',action.text);b.type='button';b.addEventListener('click',action.run);target.append(b)}};
  async function authorize(){
   try{
    const auth=await import('./auth.js');const info=await auth.access();if(!alive())return;
    if(!info.user){gateInfo('Esta área exige login na conta do administrador do HÆMA.',{text:'Entrar com Google',run:auth.login});return}
    if(!info.admin){gateInfo('Acesso negado. Apenas a conta administradora pode abrir este console.',{text:'Voltar ao Portal',run:()=>location.assign('portal.html')});return}
    state.db=await auth.client();state.user=info.user;
    const campaigns=await query(state.db.from('haema_campaigns').select('id,name,description,gm_id').eq('gm_id',info.user.id).order('created_at',{ascending:false}));
    if(!alive())return;
    state.campaigns=campaigns;gate.hidden=true;app.hidden=false;
    const choice=$('command-campaign');choice.replaceChildren();
    if(!campaigns.length){choice.append(new Option('Nenhuma campanha',''));alert('Você ainda não possui campanhas. Crie uma pelo arquivo técnico.',true);renderAll();return}
    for(const c of campaigns)choice.append(new Option(c.name,c.id));
    state.campaign=campaigns[0];choice.value=state.campaign.id;await loadCampaign();
   }catch(e){gateInfo('Não foi possível validar seu acesso. '+limited(e.message,220),{text:'Tentar novamente',run:authorize})}
  }
  async function loadCampaign(){
   if(!state.db||!state.campaign||!alive())return;
   const campaign=state.campaign.id;
   alert('Atualizando registros privados da campanha…');
   try{
    const [members,characters,notes]=await Promise.all([
     query(state.db.from('haema_members').select('user_id,role').eq('campaign_id',campaign)),
     query(state.db.from('haema_characters').select('id,title,user_id,campaign_id,rules_version,updated_at').eq('campaign_id',campaign).order('updated_at',{ascending:false})),
     query(state.db.from('haema_gm_archive').select('id,kind,title,content,status,created_at,updated_at,tags,metadata').eq('campaign_id',campaign).eq('archived',false).order('updated_at',{ascending:false}).limit(200))
    ]);
    if(!alive()||state.campaign?.id!==campaign)return;
    state.members=members;state.characters=characters;state.notes=notes;
    const ids=members.map(m=>m.user_id);state.names=new Map();
    if(ids.length){const profiles=await query(state.db.from('haema_profiles').select('id,display_name').in('id',ids));for(const p of profiles)state.names.set(p.id,p.display_name)}
    const charIds=characters.map(c=>c.id);
    state.tree=charIds.length?await query(state.db.from('haema_tree_progress').select('character_id,path,pe_available,pe_spent,awakened').in('character_id',charIds)):[];
    const removed=charIds.length?await query(state.db.from('haema_tree_profile_settings').select('character_id,archived').in('character_id',charIds)):[];
    state.archivedTree=new Set(removed.filter(x=>x.archived).map(x=>x.character_id));
    if(!alive()||state.campaign?.id!==campaign)return;
    renderAll();
    if(currentLive)await currentLive.load({db:state.db,campaignId:campaign,userId:state.user.id,roster:state.characters,progress:state.tree});
    alert('Campanha sincronizada. A Mesa ao Vivo possui salvamento próprio.');
   }catch(e){alert('Erro ao carregar a campanha: '+limited(e.message,250),true)}
  }
  function openTab(tab){if(!tabs[tab])return;state.tab=tab;
   for(const button of app.querySelectorAll('[data-view]')){const active=button.dataset.view===tab;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1}
   for(const section of app.querySelectorAll('[data-panel]'))section.hidden=section.dataset.panel!==tab;
   $('command-title').textContent=tabs[tab];
   if(tab==='tree')mountTree();
   if(tab==='archive'){const host=$('command-archive-host');if(host&&!host.querySelector('iframe')){const f=el('iframe');f.title='HÆMA Archive — acervo administrativo';f.src='haema-archive.html';f.referrerPolicy='same-origin';host.append(f)}}
  }
  function mountTree(characterId){const host=$('command-tree-host');if(!host)return;
   const url=new URL('arvore.html',location.href);url.searchParams.set('embed','1');if(characterId)url.searchParams.set('character',characterId);
   const existing=host.querySelector('iframe');if(existing&&!characterId)return;
   host.replaceChildren();const f=el('iframe');f.title='Árvore experimental de habilidades, acesso exclusivo do mestre';f.loading='eager';f.referrerPolicy='same-origin';f.allowFullscreen=true;f.setAttribute('allow','fullscreen');f.src=url.pathname+url.search;host.append(f)
  }
  function characterCard(c){const item=el('div','command-character-tile');const tree=state.tree.find(t=>t.character_id===c.id);const owner=state.names.get(c.user_id)|| (c.user_id===state.user.id?'Mestre':'Jogador');
   appendText(item,'h3',c.title);appendText(item,'p',owner);
   item.append(el('strong','',state.archivedTree.has(c.id)?'Perfil removido da árvore · Pode ser restaurado':`${tree?.path?.length||0} nós conquistados · ${tree?.pe_available||0} PE da árvore`));
   const btn=el('button','command-text-button','Abrir sua árvore');btn.type='button';btn.addEventListener('click',()=>{openTab('tree');mountTree(c.id)});item.append(btn);return item
  }
  function renderOverview(){
   $('command-character-count').textContent=String(state.characters.length);
   $('command-notes-count').textContent=String(state.notes.length);
   $('command-member-count').textContent=String(state.members.length);
   const roster=$('command-overview-characters');roster.replaceChildren();
   if(!state.characters.length)roster.append(el('p','','Nenhum personagem cadastrado. Abra a seção Personagens para criar o primeiro perfil.'));
   else for(const c of state.characters)roster.append(characterCard(c));
   const recent=$('command-recent-notes');recent.replaceChildren();
   if(!state.notes.length)recent.append(el('p','','O arquivo da campanha ainda não tem registros.'));
   else for(const n of state.notes.slice(0,5)){
    const box=el('div','command-recent-item');appendText(box,'b',n.title);appendText(box,'small',`${n.kind} · ${fmt(n.updated_at)}`);
    appendText(box,'p',limited(n.content,240));recent.append(box)
   }
  }
  function ownerOptions(select,current){select.replaceChildren();for(const m of state.members){const txt=state.names.get(m.user_id)||(m.user_id===state.user.id?'Mestre':'Jogador autorizado');select.append(new Option(txt,m.user_id))}if(current)select.value=current;else select.value=state.user.id}
  function renderCharacters(){
   const owner=$('command-character-owner');ownerOptions(owner,state.user.id);
   const list=$('command-character-list');list.replaceChildren();
   if(!state.characters.length){list.append(el('p','','Nenhum personagem. Crie o primeiro perfil no formulário ao lado.'));return}
   for(const c of state.characters){
    const div=el('article','command-list-item');appendText(div,'strong',c.title);
    appendText(div,'p',`Responsável: ${state.names.get(c.user_id)||(c.user_id===state.user.id?'Mestre':'Integrante')} · ${c.rules_version}`);
    const t=state.tree.find(x=>x.character_id===c.id);appendText(div,'small',state.archivedTree.has(c.id)?'Perfil removido da árvore (ficha preservada)':`${t?.path?.length||0} escolhas · ${t?.pe_available||0} PE para a árvore`);
    const footer=el('footer');const open=el('button','','Abrir árvore');open.type='button';open.addEventListener('click',()=>{openTab('tree');mountTree(c.id)});footer.append(open);
    const archived=state.archivedTree.has(c.id),archive=el('button','',archived?'Restaurar na árvore':'Remover da árvore');archive.type='button';
    archive.addEventListener('click',async()=>{
     if(!confirm((archived?'Restaurar':'Remover')+' o perfil '+c.title+' '+(archived?'na árvore?':'da lista da árvore? A ficha e todas as conquistas permanecerão guardadas.')))return;
     archive.disabled=true;
     try{await query(state.db.rpc('haema_tree_archive_profile',{p_character:c.id,p_archived:!archived}));
      const iframe=$('command-tree-host').querySelector('iframe');iframe?.remove();
      await loadCampaign();alert(archived?'Perfil restaurado.':'Perfil removido da árvore; ficha preservada.');
     }catch(e){alert('Falha ao atualizar perfil: '+limited(e.message,240),true)}
     finally{archive.disabled=false}
    });footer.append(archive);
    if(state.members.length>1){const select=el('select');select.setAttribute('aria-label','Responsável pelo personagem '+c.title);ownerOptions(select,c.user_id);
     select.addEventListener('change',async()=>{if(select.value===c.user_id)return;if(!confirm('Alterar o responsável por este personagem? As escolhas da árvore serão preservadas.')){select.value=c.user_id;return}
      try{await query(state.db.rpc('haema_master_assign_character',{p_character:c.id,p_user:select.value}));await loadCampaign()}catch(e){alert('Não foi possível alterar: '+limited(e.message,230),true);select.value=c.user_id}});
     footer.append(select)
    }
    div.append(footer);list.append(div)
   }
  }
  function renderNotes(){
   const list=$('command-notes-list');list.replaceChildren();
   if(!state.notes.length){list.append(el('p','','Nenhum registro nesta campanha.'));return}
   for(const n of state.notes){const item=el('article','command-list-item');appendText(item,'strong',n.title);
    appendText(item,'small',`${n.kind} · ${fmt(n.updated_at)} · ${n.status}`);
    appendText(item,'p',limited(n.content,1200));list.append(item)}
  }
  function renderAll(){
   $('command-session-label').textContent=state.campaign?.name||'Sem campanha';
   renderOverview();renderCharacters();renderNotes();
  }
  function attach(){
   if(window.HaemaMesaViva){currentLive=window.HaemaMesaViva.create($('command-live-root'),alert);}
   else alert('Módulo Mesa ao Vivo indisponível; as outras áreas continuam acessíveis.',true);
   app.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>openTab(button.dataset.view)));
   app.querySelectorAll('[data-switch]').forEach(button=>button.addEventListener('click',()=>openTab(button.dataset.switch)));
   $('command-campaign').addEventListener('change',()=>{state.campaign=state.campaigns.find(c=>c.id===$('command-campaign').value)||null;
    const iframe=$('command-tree-host').querySelector('iframe');iframe?.remove();void loadCampaign()});
   $('command-refresh').addEventListener('click',()=>void loadCampaign());
   $('command-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await app.requestFullscreen()}catch(e){alert('Tela cheia indisponível: '+limited(e.message,100),true)}});
   $('command-roll').addEventListener('click',()=>{
    const a=Number($('command-die-a').value),b=Number($('command-die-b').value),dt=Number($('command-dt').value);
    if(![4,6,8,10,12].includes(a)||![4,6,8,10,12].includes(b)||!Number.isInteger(dt)||dt<2||dt>30){alert('Dados ou DT inválidos.',true);return}
    const rand=(faces)=>{if(window.crypto?.getRandomValues){const arr=new Uint32Array(1);const limit=Math.floor(4294967296/faces)*faces;do{crypto.getRandomValues(arr)}while(arr[0]>=limit);return arr[0]%faces+1}return Math.floor(Math.random()*faces)+1};
    const r1=rand(a),r2=rand(b),total=r1+r2;
    $('command-roll-result').textContent=`${r1} + ${r2} = ${total} · ${total>=dt?'SUCESSO':'FALHA'} (DT ${dt})`;
   });
   $('command-character-form').addEventListener('submit',async event=>{event.preventDefault();if(state.busy||!state.campaign)return;
    const title=$('command-new-character').value.trim(),owner=$('command-character-owner').value||state.user.id;
    if(title.length<1||title.length>80)return alert('O nome deve ter até 80 caracteres.',true);
    state.busy=true;const button=event.target.querySelector('[type=submit]');button.disabled=true;
    try{await query(state.db.rpc('haema_master_create_character',{p_campaign:state.campaign.id,p_user:owner,p_title:title}));
     $('command-new-character').value='';await loadCampaign();alert('Perfil criado. Agora você pode usar a árvore com ele.')}
    catch(e){alert('Falha ao criar perfil: '+limited(e.message,250),true)}finally{state.busy=false;button.disabled=false}
   });
   $('command-note-form').addEventListener('submit',async event=>{event.preventDefault();if(state.busy||!state.campaign)return;
    const title=$('command-note-title').value.trim(),content=$('command-note-body').value.trim();
    if(!title||!content)return alert('Preencha título e conteúdo.',true);
    state.busy=true;const button=event.target.querySelector('[type=submit]');button.disabled=true;
    try{await query(state.db.from('haema_gm_archive').insert({campaign_id:state.campaign.id,owner_id:state.user.id,kind:'nota',title,content,status:'rascunho',tags:['painel-sessao'],metadata:{origin:'painel-mestre'}}));
     $('command-note-title').value='';$('command-note-body').value='';await loadCampaign();alert('Anotação salva no arquivo privado.')}
    catch(e){alert('Falha ao salvar nota: '+limited(e.message,250),true)}finally{state.busy=false;button.disabled=false}
   });
  }
  attach();authorize();
 }
 document.addEventListener('haema:navigated',init);
 document.addEventListener('haema:leaving',()=>{currentEpoch++;const previous=currentLive;currentLive=null;if(previous)void previous.flush().finally(()=>previous.destroy())});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();