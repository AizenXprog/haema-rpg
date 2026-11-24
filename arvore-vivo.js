/* HÆMA · Constelação Viva 2026-11-24
 * A autorização de escrita e continuidade é validada no Supabase.
 * A experiência projetada é operável pelo Mestre, mas nunca autoriza compra no cliente.
 * Site e Sistema criado por Vitor Monte.
 */
(()=>{
 'use strict';
 const SVG='http://www.w3.org/2000/svg';
 let lifecycle=0,dispose=()=>{};
 function init(){
  const root=document.getElementById('haema-tree-app');
  if(!root||root.dataset.liveReady==='yes')return;
  root.dataset.liveReady='yes';const epoch=++lifecycle;
  const data=window.HaemaSkillTree;
  if(!data){document.getElementById('tree-private-message').textContent='O catálogo de habilidades não foi carregado.';return}
  const $=id=>document.getElementById(id);
  const map=$('tree-map'),edges=$('tree-edges'),points=$('tree-nodes'),gate=$('tree-private-gate');
  const state={db:null,user:null,admin:false,owned:new Set(),characters:[],character:null,progress:null,plan:[],archived:new Map(),showArchived:false,hoverNode:null,overrides:new Map(),selected:'origem',projection:false,fullscreenUsed:false,zoom:.56,cx:0,cy:0,drag:null,suppressClick:false,busy:false,editing:null,confirming:null,request:0};
  const defaults=new Map(data.nodes.map(n=>[n.id,{name:n.name,effect:n.effect,trigger:n.trigger||'',limit:n.limit||'',example:n.example||'',status:n.status||'draft',kind:n.kind||''}]));
  const svg=(tag,attrs={})=>{const e=document.createElementNS(SVG,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));return e};
  const safe=(v,max=280)=>String(v??'').slice(0,max);
  const selectedPath=()=>Array.isArray(state.progress?.path)?state.progress.path:[];
  const frontier=()=>new Set(data.nextNodes(selectedPath()).map(x=>x.id));
  const hasOwner=()=>state.character&&state.admin&&state.owned.has(state.character.campaign_id);
  const isArchived=()=>!!(state.character&&state.archived.get(state.character.id));
  const ancestors=n=>{const path=[];let cur=n;while(cur&&cur.id!=='origem'){path.push(cur.id);cur=data.map.get(cur.parent)}return cur?path.reverse():null};
  const routeValid=n=>{const route=ancestors(n),earned=selectedPath();return !!(state.character&&hasOwner()&&!isArchived()&&route&&earned.every((id,i)=>route[i]===id)&&route.length>earned.length) };
  const nextPlanned=()=>state.plan[selectedPath().length]||null;
  const canBuy=n=>!!(n&&n.id!=='origem'&&state.character&&hasOwner()&&state.progress&&!isArchived()&&n.status==='ready'&&frontier().has(n.id)&&state.progress.pe_available>=n.cost&&(!n.lockedByAwakening||state.progress.awakened)&&!state.busy);
  function notice(msg,error=false){const el=$('tree-account-status');el.textContent=msg;el.dataset.error=error?'yes':'no'}
  function switchOption(option){$('tree-character').value=option;$('tree-projector-character').value=option}
  function panelTitle(n){const s=data.sectors[n.sectorIndex];return (s?.name||'Núcleo')+(n.phase?' · '+n.phase:'')}
  function nodeState(n,earned,available){
   if(n.id==='origem')return 'O ponto de partida. Escolha uma direção no mapa.';
   if(isArchived())return 'Perfil removido da árvore. Restaure-o para continuar.';
   if(earned)return 'Já conquistada. Sua decisão foi registrada permanentemente no personagem.';
   if(n.status!=='ready')return 'Em construção. O mestre pode editar este espaço e publicá-lo quando estiver pronto.';
   if(!state.character)return 'Selecione um personagem antes de registrar uma escolha.';
   if(!available&&state.plan.includes(n.id))return 'Habilidade planejada. Compre primeiro as etapas anteriores, uma por vez, para chegar até aqui.';
   if(!available)return 'Caminho não conectado à última conquista deste personagem.';
   if(n.lockedByAwakening&&!state.progress?.awakened)return 'O Despertar precisa estar registrado pelo mestre.';
   if((state.progress?.pe_available||0)<n.cost)return `São necessários ${n.cost} PE; este personagem tem ${state.progress?.pe_available||0}.`;
   return 'Pronta para aquisição. O mestre ainda precisa confirmar a escolha permanente.';
  }
  function buttonLabel(n,earned,available){
   if(earned)return 'JÁ CONQUISTADA';if(n.status!=='ready')return 'HABILIDADE EM CONSTRUÇÃO';
   if(!available)return 'CAMINHO NÃO CONECTADO';
   return canBuy(n)?`CONQUISTAR · ${n.cost} PE`:'AQUISIÇÃO BLOQUEADA';
  }
  function statusColor(n){return n.status==='ready'?'#dac48f':'#a48a96'}
  function display(){
   const n=data.map.get(state.selected)||data.map.get('origem'),sec=data.sectors[n.sectorIndex];
   const earned=selectedPath().includes(n.id),available=frontier().has(n.id),possible=canBuy(n),planned=state.plan.includes(n.id);
   $('tree-detail-name').textContent=n.name;
   $('tree-detail-path').textContent=panelTitle(n);
   $('tree-detail-body').textContent=n.effect;
   $('tree-detail-trigger').textContent=n.trigger||'Exige estudo e preparação.';
   $('tree-detail-limit').textContent=n.limit||'O mestre define limites para esta Descoberta.';
   $('tree-detail-example').textContent=n.example||'Um exemplo poderá ser escrito no editor.';
   $('tree-detail-glyph').textContent=sec?.symbol||'Æ';$('tree-detail-glyph').style.color=sec?.color||'#dec18a';
   $('tree-detail-type').textContent=n.type==='apex'?'ÁPICE':n.type==='keystone'?'MARCO':n.type==='origin'?'NÚCLEO':n.type==='notable'?'TÉCNICA':'PASSIVA / TÉCNICA';
   $('tree-editorial-state').textContent=earned?'CONQUISTADA':n.status==='ready'?'HABILIDADE ESCRITA':'CAMINHO EM CONSTRUÇÃO';
   $('tree-editorial-state').dataset.status=earned?'earned':n.status;
   $('tree-detail-cost').textContent=n.id==='origem'?'—':`${n.cost} PE`;
   $('tree-detail-rank').textContent=`${n.rank} / 24`;
   $('tree-detail-state').textContent=nodeState(n,earned,available);
   const buy=$('tree-unlock');buy.disabled=!possible;buy.textContent=buttonLabel(n,earned,available);
   $('tree-edit').disabled=n.id==='origem'||state.busy;
   $('tree-projector-glyph').textContent=sec?.symbol||'Æ';$('tree-projector-glyph').style.color=sec?.color||'#e7c88b';
   $('tree-projector-type').textContent=n.status==='ready'?`${n.type==='apex'?'ÁPICE':n.type==='keystone'?'MARCO':n.type==='notable'?'TÉCNICA':'HABILIDADE'} · ${n.cost} PE`:'CAMINHO EM CRIAÇÃO';
   $('tree-projector-title').textContent=n.name;
   $('tree-projector-effect').textContent=n.effect;
   $('tree-projector-trigger').textContent=n.trigger||'A definir';
   $('tree-projector-limit').textContent=n.limit||'A definir';
   $('tree-projector-state').textContent=nodeState(n,earned,available);
   $('tree-projector-unlock').disabled=!possible;
   $('tree-projector-unlock').textContent=buttonLabel(n,earned,available);
   $('tree-projector-pe').textContent=state.character?String(state.progress?.pe_available??0):'—';
   $('tree-projector-count').textContent=String(selectedPath().length);
   const routeLength=Math.max(0,state.plan.length-selectedPath().length);
   const future=state.plan.slice(selectedPath().length),futureCost=data.formatCost(future);
   const planText=!state.character?'Escolha um personagem para começar.':isArchived()?'Perfil arquivado. Restaure para continuar.':routeLength?`${routeLength} etapas planejadas · ${futureCost} PE previstos · nenhum PE gasto ainda.`:'Toque num nó distante da sua trilha para marcar a rota automaticamente.';
   $('tree-plan-status').textContent=planText;$('tree-projector-plan').textContent=planText;
   const planOk=n.id!=='origem'&&routeValid(n)&&!state.busy;
   $('tree-plan-route').disabled=!planOk;$('tree-projector-plan-route').disabled=!planOk;
   $('tree-plan-next').disabled=!nextPlanned()||state.busy;$('tree-projector-next-plan').disabled=!nextPlanned()||state.busy;
   $('tree-plan-clear').disabled=!state.character||routeLength===0||state.busy||isArchived();
   $('tree-archive-profile').disabled=!hasOwner()||state.busy;
   $('tree-archive-profile').textContent=isArchived()?'Restaurar perfil da árvore':'Remover perfil da árvore';
   $('tree-reset-profile').disabled=!hasOwner()||state.busy||isArchived();
   $('tree-remove-pe').disabled=!hasOwner()||state.busy||isArchived();
   const quick=$('tree-quick-action'),balance=state.progress?.pe_available??0,route=ancestors(n),remaining=route?.slice(selectedPath().length)||[];
   const routeCost=data.formatCost(remaining),isPlanned=state.plan.at(-1)===n.id&&state.plan.length>selectedPath().length;
   $('tree-quick-pe').textContent=state.character?String(balance):'—';
   $('tree-quick-title').textContent=n.id==='origem'?'O Primeiro Passo':n.name;
   $('tree-quick-status').textContent=earned?'CONQUISTADA':possible?'PRONTA PARA CONQUISTAR':planned?'ROTA PLANEJADA':n.status!=='ready'?'EM CRIAÇÃO':available?'PRÓXIMA ETAPA':'EXPLORAR A CONSTELAÇÃO';
   $('tree-quick-hint').textContent=n.id==='origem'?'Escolha uma direção para começar.':possible?n.cost+' PE · saldo após a compra: '+(balance-n.cost):earned?'Habilidade registrada na trilha.':isPlanned?remaining.length+' etapas · '+routeCost+' PE apenas no plano.':routeValid(n)?remaining.length+' etapas até aqui · previsão '+routeCost+' PE.':nodeState(n,earned,available);
   const mode=possible?'buy':isPlanned?'next':routeValid(n)&&!state.busy?'plan':'none';
   quick.dataset.action=mode;$('tree-quickbar').dataset.action=mode;quick.disabled=mode==='none';
   quick.textContent=mode==='buy'?'CONQUISTAR · '+n.cost+' PE':mode==='next'?'IR AO PRÓXIMO PASSO':mode==='plan'?'TRAÇAR ROTA · '+routeCost+' PE':(state.character&&available&&n.status==='ready'&&balance<n.cost?'PE INSUFICIENTES':n.status!=='ready'?'EM CONSTRUÇÃO':'SELECIONE UM CAMINHO');
  }
  function paint(){
   const acquired=new Set(selectedPath()),next=frontier(),planned=new Set(state.plan);
   for(const el of edges.children){const id=el.dataset.id;el.setAttribute('class','tree-edge'+(acquired.has(id)?' unlocked':planned.has(id)?' planned':next.has(id)?' available':'')+(state.celebrating===id?' tree-celebrate':''));}
   for(const el of points.children){const id=el.dataset.id,n=data.map.get(id);if(!n)continue;
    const classes=['tree-node',n.type];if(acquired.has(id)||id==='origem')classes.push('unlocked');else if(planned.has(id))classes.push('planned');else if(next.has(id))classes.push('available');
    if(n.status!=='ready')classes.push('draft');if(next.has(id)&&n.status==='ready'&&state.character&&state.progress?.pe_available<n.cost)classes.push('no-pe');if(next.has(id)&&n.lockedByAwakening&&!state.progress?.awakened)classes.push('unawakened');if(id===state.selected)classes.push('current');if(state.celebrating===id)classes.push('tree-celebrate');el.setAttribute('class',classes.join(' '));
    el.setAttribute('aria-label',`${n.name}: ${acquired.has(id)?'adquirida':n.status!=='ready'?'em construção':next.has(id)?'próxima escolha':'rota não conectada'}. ${n.effect}`);

   }
   $('tree-pe').textContent=state.character?String(state.progress?.pe_available??0):'—';$('tree-pe-spent').textContent=String(state.progress?.pe_spent??0);$('tree-count').textContent=String(acquired.size);
   $('tree-draft-total').textContent=String(data.nodes.filter(n=>n.status==='draft').length);
   display();
  }
  function size(){const r=map.getBoundingClientRect();return{w:Math.max(320,r.width),h:Math.max(350,r.height)}}
  function view(){const {w,h}=size();map.setAttribute('viewBox',`${state.cx-w/state.zoom/2} ${state.cy-h/state.zoom/2} ${w/state.zoom} ${h/state.zoom}`)}
  function focus(n,level){if(!n)return;state.cx=n.x;state.cy=n.y;if(level)state.zoom=level;view()}
  function zoom(f){state.zoom=Math.max(.16,Math.min(2.8,state.zoom*f));view()}
  function choose(id,focusMap=false){const n=data.map.get(id);if(!n)return;state.selected=id;paint();if(focusMap)focus(n,Math.max(state.zoom,.76))}
  function draw(){
   const fragment=document.createDocumentFragment();
   for(const e of data.edges){const from=data.map.get(e.from),to=data.map.get(e.to);const midx=(from.x+to.x)/2,midy=(from.y+to.y)/2;
    const path=svg('path',{d:`M${from.x} ${from.y} Q${midx} ${midy} ${to.x} ${to.y}`,'data-id':e.to,class:'tree-edge'});fragment.append(path);
   }edges.replaceChildren(fragment);
   const content=document.createDocumentFragment();
   for(const n of data.nodes){const grp=svg('g',{class:`tree-node ${n.type}`,transform:`translate(${n.x} ${n.y})`,tabindex:'0',role:'button','data-id':n.id});
    grp.append(svg('circle',{class:'node-aura',r:n.type==='origin'?78:n.type==='apex'?43:32}),svg('circle',{class:'core',r:n.type==='origin'?53:n.type==='apex'?29:n.type==='keystone'?24:n.type==='notable'?18:13}));
    if(n.type!=='minor'){const sym=svg('text',{class:'node-symbol',x:0,y:2});sym.textContent=n.status==='draft'?'⋯':n.type==='origin'?'Æ':data.sectors[n.sectorIndex]?.symbol||'✧';grp.append(sym)}
    grp.append(svg('circle',{class:'node-touch',r:n.type==='origin'?72:36}));
    grp.setAttribute('aria-describedby','tree-hover-card');
    grp.addEventListener('pointerenter',e=>showTooltip(n,e));
    grp.addEventListener('pointermove',e=>{if(state.hoverNode===n.id)positionTooltip(e)});
    grp.addEventListener('pointerleave',()=>hideTooltip(n.id));
    grp.addEventListener('focus',()=>showTooltip(n,null));
    grp.addEventListener('blur',()=>hideTooltip(n.id));
    grp.addEventListener('click',()=>{if(state.suppressClick)return;choose(n.id);if(canBuy(n))openPurchase();else if(routeValid(n)&&!frontier().has(n.id)&&state.plan.at(-1)!==n.id)markRoute()});
    grp.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();choose(n.id);if(canBuy(n))openPurchase();else if(routeValid(n)&&!frontier().has(n.id)&&state.plan.at(-1)!==n.id)markRoute()}});
    content.append(grp);
   }points.replaceChildren(content);
   $('tree-total').textContent=String(data.nodes.length);
   const legend=$('tree-legend-items');legend.replaceChildren();
   for(const s of data.sectors){const b=document.createElement('button');b.type='button';
    const i=document.createElement('i');i.style.background=s.color;i.setAttribute('aria-hidden','true');
    const span=document.createElement('span');span.textContent=s.name;b.append(i,span);b.addEventListener('click',()=>{
     const n=data.map.get(data.key(data.sectors.indexOf(s),'',3));choose(n.id,true)});legend.append(b);
   }
   const ambient=$('tree-ambient');ambient.replaceChildren();
   for(let i=0;i<24;i++){const mote=document.createElement('span');mote.className='tree-mote';mote.style.setProperty('--mx',`${(i*37+13)%95}%`);mote.style.setProperty('--my',`${(i*61+7)%91}%`);mote.style.setProperty('--delay',`${(i*7)%23*-1}s`);mote.style.setProperty('--duration',`${12+(i%8)*3}s`);ambient.append(mote)}
  }
  function options(){
   for(const id of ['tree-character','tree-projector-character']){const select=$(id);select.replaceChildren(new Option('Explorar sem personagem',''));
    for(const c of state.characters){if(state.archived.get(c.id)&&!state.showArchived)continue;
     select.append(new Option(c.title+(state.archived.get(c.id)?' · REMOVIDO':''),c.id));}
   }
   $('tree-show-archived').checked=state.showArchived;
   if(state.character)switchOption(state.character.id);
  }
  function applyEdit(r){const n=data.map.get(r.node_id);if(!n)return;
   n.name=r.title||'Em construção';n.trigger=r.trigger_text||'A definir';n.effect=r.effect||'A ser definido pelo mestre';n.limit=r.limit_text||'A definir';n.example=r.example||'A definir';n.status=r.status;
   if(n.type!=='minor'){const grp=[...points.children].find(e=>e.dataset.id===n.id);const symbol=grp?.querySelector('.node-symbol');if(symbol)symbol.textContent=n.status==='draft'?'⋯':n.type==='apex'?'✦':data.sectors[n.sectorIndex]?.symbol||'✧'}
  }
  async function getEdits(){const {data:rows,error}=await state.db.from('haema_tree_node_edits').select('node_id,title,trigger_text,effect,limit_text,example,status,updated_at').limit(1000);
   if(error)throw error;
   state.overrides=new Map((rows||[]).map(r=>[r.node_id,r]));for(const row of rows||[])applyEdit(row);
  }
  async function getCharacters(){const {data:items,error}=await state.db.from('haema_characters').select('id,title,campaign_id,user_id').order('updated_at',{ascending:false});if(error)throw error;
   state.characters=items||[];const {data:campaigns,error:ce}=await state.db.from('haema_campaigns').select('id').eq('gm_id',state.user.id);if(ce)throw ce;
   state.owned=new Set((campaigns||[]).map(c=>c.id));
   const {data:profiles,error:pe}=await state.db.from('haema_tree_profile_settings').select('character_id,archived');if(pe)throw pe;
   state.archived=new Map((profiles||[]).map(p=>[p.character_id,p.archived]));options();
   notice(state.characters.length?'Escolha um personagem para ver seu caminho. Os demais nós podem ser explorados sem gastar PE.':'Nenhum personagem cadastrado. Crie perfis pelo Painel do Mestre.');
  }
  async function pickCharacter(id){const request=++state.request;
   state.character=state.characters.find(c=>c.id===id)||null;state.progress=null;state.plan=[];switchOption(state.character?.id||'');$('tree-gm-tools').hidden=true;paint();
   if(!state.character)return;
   notice('Sincronizando conquistas…');
   try{const [result,planned]=await Promise.all([
    state.db.from('haema_tree_progress').select('character_id,pe_available,pe_spent,path,awakened,updated_at').eq('character_id',state.character.id).maybeSingle(),
    state.db.from('haema_tree_plans').select('planned_path').eq('character_id',state.character.id).maybeSingle()
   ]);
    if(result.error)throw result.error;if(planned.error)throw planned.error;if(request!==state.request)return;
    state.progress=result.data||{character_id:state.character.id,pe_available:0,pe_spent:0,path:[],awakened:false};
    state.plan=Array.isArray(planned.data?.planned_path)?planned.data.planned_path:[];
    $('tree-gm-tools').hidden=!hasOwner();$('tree-regency-button').textContent=state.progress.awakened?'Revogar acesso experimental às Regências':'Liberar Regências';
    paint();const tip=selectedPath().at(-1);if(tip)focus(data.map.get(tip),Math.max(.61,state.zoom));notice(`Personagem ${state.character.title} sincronizado. ${isArchived()?'Este perfil está removido. Você pode restaurá-lo.':'Você pode marcar uma rota antes de comprar habilidades.'}`);
   }catch(e){if(request!==state.request)return;notice('Não foi possível carregar o caminho: '+safe(e.message),true)}
  }
  async function refreshProgress(){if(!state.character)return;const saved=state.character.id;await pickCharacter(saved)}
  function openPurchase(){const n=data.map.get(state.selected);if(!canBuy(n))return;
   state.confirming={id:n.id,character:state.character.id};$('tree-confirm-title').textContent=n.name;
   $('tree-confirm-message').textContent=`Personagem: ${state.character.title}. Investimento: ${n.cost} PE. Este nó ficará permanentemente registrado e fechará outras alternativas da bifurcação.\n\n${n.effect}\n\nLimite: ${n.limit}`;
   $('tree-confirm-status').textContent='';$('tree-confirm-modal').hidden=false;$('tree-confirm-cancel').focus();
  }
  function closePurchase(){state.confirming=null;$('tree-confirm-modal').hidden=true}
  async function confirmPurchase(){const selection=state.confirming;if(!selection||state.busy||!state.character||state.character.id!==selection.character)return;
   const n=data.map.get(selection.id);if(!canBuy(n)){closePurchase();notice('A compra deixou de estar disponível. Confira o saldo e as condições.',true);return;}
   state.busy=true;$('tree-confirm-accept').disabled=true;$('tree-confirm-status').textContent='Registrando conquista…';
   const plannedBefore=state.plan.slice(),acquiredCount=selectedPath().length;
   try{const {error}=await state.db.rpc('haema_tree_unlock',{p_character:selection.character,p_node:selection.id});if(error)throw error;
    closePurchase();await refreshProgress();
    if(plannedBefore.length>acquiredCount&&plannedBefore[acquiredCount]!==selection.id){
     const revised=selectedPath().slice();
     const {error:planError}=await state.db.rpc('haema_tree_save_plan',{p_character:selection.character,p_path:revised});
     if(!planError)state.plan=revised;
    }
    choose(selection.id,true);notice(`Conquistada: ${n.name}. O progresso do personagem foi salvo.`);
    const pulse=points.querySelector(`[data-id="${selection.id}"]`);pulse?.classList.add('tree-celebrate');setTimeout(()=>pulse?.classList.remove('tree-celebrate'),1700);
   }catch(e){$('tree-confirm-status').textContent='Não foi possível registrar: '+safe(e.message);notice(safe(e.message),true)}
   finally{state.busy=false;$('tree-confirm-accept').disabled=false;paint()}
  }
  async function grantPE(){if(!hasOwner()||isArchived()||state.busy)return;
   const amount=Number($('tree-grant-pe').value);if(!Number.isInteger(amount)||amount<1||amount>50){notice('Informe de 1 a 50 PE por concessão.',true);return}
   if(!confirm(`Conceder ${amount} PE a ${state.character.title}?`))return;
   state.busy=true;try{const {error}=await state.db.rpc('haema_tree_grant_pe',{p_character:state.character.id,p_amount:amount});if(error)throw error;await refreshProgress();notice(`${amount} PE registrados para ${state.character.title}.`)}
   catch(e){notice(safe(e.message),true)}finally{state.busy=false;paint()}
  }
  async function toggleAwakening(){if(!hasOwner()||isArchived()||state.busy)return;
   const enabled=!state.progress?.awakened;if(!confirm(`${enabled?'Liberar':'Revogar'} acesso ao ramo de Regências para ${state.character.title}?`))return;
   state.busy=true;try{const {error}=await state.db.rpc('haema_tree_set_awakened',{p_character:state.character.id,p_enabled:enabled});if(error)throw error;await refreshProgress();notice('Despertar atualizado pelo mestre.')}
   catch(e){notice(safe(e.message),true)}finally{state.busy=false;paint()}
  }
  function openEditor(){const n=data.map.get(state.selected);if(!n||n.id==='origem')return;
   state.editing=n.id;$('tree-editor-title').textContent=`Criar / revisar · ${panelTitle(n)}`;
   const original=state.overrides.get(n.id);const baseline=defaults.get(n.id);
   $('tree-edit-title').value=original?.title??baseline?.name??n.name;
   $('tree-edit-trigger').value=original?.trigger_text??baseline?.trigger??'';
   $('tree-edit-effect').value=original?.effect??baseline?.effect??'';
   $('tree-edit-limit').value=original?.limit_text??baseline?.limit??'';
   $('tree-edit-example').value=original?.example??baseline?.example??'';
   $('tree-editor-feedback').textContent='';$('tree-editor-modal').hidden=false;$('tree-edit-title').focus();
  }
  function closeEditor(){state.editing=null;$('tree-editor-modal').hidden=true}
  async function saveEditorial(status){if(!state.admin||!state.user||!state.db||!state.editing||state.busy)return;
   const nodeId=state.editing;
   const draft={node_id:nodeId,title:$('tree-edit-title').value.trim(),trigger_text:$('tree-edit-trigger').value.trim(),effect:$('tree-edit-effect').value.trim(),limit_text:$('tree-edit-limit').value.trim(),example:$('tree-edit-example').value.trim(),status,updated_by:state.user.id,updated_at:new Date().toISOString()};
   if(!draft.title)draft.title='Em criação';
   if(status==='ready'&&(draft.title.length<3||draft.trigger_text.length<12||draft.effect.length<20||draft.limit_text.length<12||draft.example.length<12)){
    $('tree-editor-feedback').textContent='Antes de publicar, preencha nome, gatilho, efeito, limites e exemplo com informações completas.';return;
   }
   state.busy=true;$('tree-editor-feedback').textContent='Salvando no arquivo da campanha…';
   try{const {data:row,error}=await state.db.from('haema_tree_node_edits').upsert(draft,{onConflict:'node_id'}).select('node_id,title,trigger_text,effect,limit_text,example,status,updated_at').single();if(error)throw error;
    state.overrides.set(nodeId,row);applyEdit(row);closeEditor();paint();notice(status==='ready'?'Habilidade publicada! O nó agora pode ser conquistado, respeitando o caminho.':'Caminho salvo como em construção. Nenhum personagem poderá comprá-lo ainda.');
   }catch(e){$('tree-editor-feedback').textContent='Falha ao salvar: '+safe(e.message)}finally{state.busy=false}
  }

  async function savePlan(path){
   if(!hasOwner()||isArchived()||state.busy)return false;
   state.busy=true;try{
    const {error}=await state.db.rpc('haema_tree_save_plan',{p_character:state.character.id,p_path:path});
    if(error)throw error;state.plan=path.slice();paint();
    notice(path.length>selectedPath().length?'Trajeto salvo. A linha dourada mostra o planejamento, sem gastar PE.':'Planejamento limpo. Conquistas compradas foram preservadas.');
    return true;
   }catch(e){notice('Não foi possível marcar a linha: '+safe(e.message),true);return false}
   finally{state.busy=false;paint()}
  }
  function markRoute(){const n=data.map.get(state.selected);if(!n||!routeValid(n)){notice('Escolha um nó descendente da última conquista. Não é permitido atravessar outro ramo.',true);return}
   const route=ancestors(n);void savePlan(route);
  }
  function focusNextPlanned(){const next=data.map.get(nextPlanned());if(next){choose(next.id,true);notice('Próximo passo planejado em destaque. Para comprar, confirme a conquista separadamente.')}
   else notice('Você ainda não marcou um caminho futuro.',true);
  }
  function clearPlan(){if(!state.character||!hasOwner()||isArchived())return;void savePlan(selectedPath().slice())}
  async function correctPE(){
   if(!hasOwner()||isArchived()||state.busy)return;
   const amount=Number($('tree-grant-pe').value),reason=$('tree-pe-reason').value.trim();
   if(!Number.isInteger(amount)||amount<1||amount>50){notice('Informe uma correção entre 1 e 50 PE.',true);return}
   if(reason.length<5){notice('Descreva o motivo da correção de PE.',true);return}
   if(amount>(state.progress?.pe_available||0)){notice('Você só pode retirar PE disponíveis. Gastos em habilidades não são revertidos.',true);return}
   if(!confirm('Retirar '+amount+' PE de '+state.character.title+'?\nSaldo atual: '+state.progress.pe_available+' PE.\nMotivo: '+reason))return;
   state.busy=true;try{
    const {error}=await state.db.rpc('haema_tree_adjust_pe',{p_character:state.character.id,p_delta:-amount,p_reason:reason});
    if(error)throw error;await refreshProgress();notice('Correção registrada no histórico. '+amount+' PE retirados sem desfazer conquistas.');
   }catch(e){notice('Falha ao retirar PE: '+safe(e.message),true)}finally{state.busy=false;paint()}
  }
  async function archiveProfile(){
   if(!hasOwner()||state.busy)return;
   const character=state.character,archived=!isArchived();
   if(!confirm((archived?'Remover':'Restaurar')+' o perfil “'+character.title+'” '+(archived?'da lista da árvore?\nA ficha, as conquistas e os PE serão preservados. O perfil poderá ser restaurado.':'na árvore?')))return;
   state.busy=true;try{
    const {error}=await state.db.rpc('haema_tree_archive_profile',{p_character:character.id,p_archived:archived});
    if(error)throw error;
    await getCharacters();
    state.showArchived=archived?false:true;options();
    await pickCharacter(archived?'':character.id);
    notice(archived?'Perfil removido da lista da árvore. Para restaurar, marque “Exibir perfis removidos”.':'Perfil restaurado com as conquistas anteriores.');
   }catch(e){notice('Não foi possível atualizar perfil: '+safe(e.message),true)}finally{state.busy=false;paint()}
  }
  async function resetProfile(){
   if(!hasOwner()||isArchived()||state.busy)return;
   const name=state.character.title;
   const typed=prompt('ATENÇÃO: reiniciar a árvore de '+name+' apaga a progressão ativa e zera o saldo, mas mantém o histórico de auditoria.\n\nDigite o nome EXATO do personagem para confirmar:');
   if(typed!==name){if(typed!==null)notice('Reinício cancelado: o nome não corresponde.',true);return}
   const reason=prompt('Informe o motivo do reinício (será guardado na auditoria):');
   if(!reason||reason.trim().length<5){notice('Reinício cancelado: motivo obrigatório.',true);return}
   if(!confirm('ÚLTIMA CONFIRMAÇÃO: zerar PE, Despertar e todas as conquistas de '+name+'?'))return;
   state.busy=true;try{
    const {error}=await state.db.rpc('haema_tree_reset_profile',{p_character:state.character.id,p_reason:reason.trim()});
    if(error)throw error;await refreshProgress();choose('origem',true);
    notice('Árvore reiniciada. O evento de reinício preserva uma cópia do progresso anterior para auditoria.');
   }catch(e){notice('Falha ao reiniciar: '+safe(e.message),true)}finally{state.busy=false;paint()}
  }
  function showTooltip(n,event){
   if(!n||state.drag)return;
   state.hoverNode=n.id;
   const card=$('tree-hover-card');card.hidden=false;
   $('tree-hover-title').textContent=n.name;
   $('tree-hover-status').textContent=selectedPath().includes(n.id)?'CONQUISTADA':state.plan.includes(n.id)?'PLANEJADA':n.status!=='ready'?'EM CONSTRUÇÃO':frontier().has(n.id)?'PRÓXIMA COMPRA':'AINDA NÃO CONECTADA';
   $('tree-hover-effect').textContent=n.effect||'Esta habilidade ainda está sendo escrita pelo mestre.';
   $('tree-hover-trigger').textContent=n.trigger||'Requer condições a definir.';
   $('tree-hover-limit').textContent=n.limit||'A definir pelo mestre.';
   $('tree-hover-example').textContent=n.example||'Exemplo ainda não disponível.';
   $('tree-hover-cost').textContent=n.id==='origem'?'PONTO DE PARTIDA':n.cost+' PE para comprar · Etapa '+n.rank+' de 24';
   positionTooltip(event);
  }
  function positionTooltip(event){
   const card=$('tree-hover-card'),rect=$('tree-viewport').getBoundingClientRect();
   let x=event?.clientX!=null?event.clientX-rect.left+20:rect.width-375;
   let y=event?.clientY!=null?event.clientY-rect.top+15:60;
   const width=Math.min(365,Math.max(190,rect.width-24));
   x=Math.max(12,Math.min(rect.width-width-12,x));const height=Math.min(card.offsetHeight||350,rect.height-24);
   y=Math.max(12,Math.min(rect.height-height-12,y));
   card.style.left=x+'px';card.style.top=y+'px';
  }
  function hideTooltip(id){if(!id||state.hoverNode===id){state.hoverNode=null;$('tree-hover-card').hidden=true}}

  function search(){const q=$('tree-search').value.trim().toLocaleLowerCase('pt-BR'),box=$('tree-search-results');box.replaceChildren();
   if(q.length<2)return;let matches=data.nodes.filter(n=>n.id!=='origem'&&(`${n.name} ${n.chapter} ${n.sector} ${n.effect}`).toLocaleLowerCase('pt-BR').includes(q));
   matches.sort((a,b)=>(a.status===b.status?0:a.status==='ready'?-1:1)||a.rank-b.rank);matches=matches.slice(0,12);
   if(!matches.length){const p=document.createElement('p');p.textContent='Nenhuma habilidade encontrada. Experimente outra palavra.';box.append(p);return}
   for(const n of matches){const b=document.createElement('button');b.type='button';b.textContent=`${n.name} · ${data.sectors[n.sectorIndex].name} · ${n.status==='ready'?'escrita':'em criação'}`;
    b.addEventListener('click',()=>{choose(n.id,true);box.replaceChildren();$('tree-search').value=n.name});box.append(b)}
  }
  function findDraft(){const chosen=data.nodes.find(n=>n.status==='draft'&&n.parent===selectedPath().at(-1))||data.nodes.find(n=>n.status==='draft');if(chosen)choose(chosen.id,true)}
  function setProjection(active){state.projection=active;document.body.classList.toggle('tree-projection',active);$('tree-projector-hud').hidden=!active;
   $('tree-projection').textContent=active?'SAIR DA PROJEÇÃO':'⛶ PROJEÇÃO';paint();requestAnimationFrame(view);
  }
  async function enterProjection(){setProjection(true);
   if(document.fullscreenEnabled&&!document.fullscreenElement){try{await document.documentElement.requestFullscreen();state.fullscreenUsed=true}catch{state.fullscreenUsed=false}}
  }
  async function exitProjection(){setProjection(false);if(document.fullscreenElement){try{await document.exitFullscreen()}catch{}}state.fullscreenUsed=false}
  async function authorize(){try{
    const auth=await import('./auth.js');const info=await auth.access();if(epoch!==lifecycle||!root.isConnected)return;
    if(!info.user){$('tree-private-message').textContent='Entre com sua conta administrativa para acessar as habilidades.';const btn=$('tree-private-login');btn.hidden=false;btn.onclick=()=>auth.login();return}
    if(!info.admin){$('tree-private-message').textContent='Apenas a conta administradora do HÆMA pode acessar a constelação.';return}
    state.user=info.user;state.admin=true;state.db=await auth.client();await getEdits();await getCharacters();if(epoch!==lifecycle||!root.isConnected)return;
    gate.hidden=true;root.hidden=false;draw();bind();paint();view();
    const fromUrl=new URLSearchParams(location.search).get('character');if(fromUrl&&state.characters.some(x=>x.id===fromUrl))await pickCharacter(fromUrl);
   }catch(e){if(epoch!==lifecycle)return;$('tree-private-message').textContent='Não foi possível liberar o acesso. '+safe(e.message)}
  }
  function bind(){
   $('tree-character').addEventListener('change',e=>void pickCharacter(e.target.value));
   $('tree-projector-character').addEventListener('change',e=>void pickCharacter(e.target.value));
   $('tree-unlock').addEventListener('click',openPurchase);$('tree-projector-unlock').addEventListener('click',openPurchase);
   $('tree-quick-action').addEventListener('click',()=>{const mode=$('tree-quick-action').dataset.action;if(mode==='buy')openPurchase();else if(mode==='plan')markRoute();else if(mode==='next')focusNextPlanned()});
   $('tree-confirm-cancel').addEventListener('click',closePurchase);$('tree-confirm-accept').addEventListener('click',()=>void confirmPurchase());
   $('tree-grant-button').addEventListener('click',()=>void grantPE());$('tree-remove-pe').addEventListener('click',()=>void correctPE());$('tree-regency-button').addEventListener('click',()=>void toggleAwakening());
   $('tree-archive-profile').addEventListener('click',()=>void archiveProfile());$('tree-reset-profile').addEventListener('click',()=>void resetProfile());
   $('tree-show-archived').addEventListener('change',e=>{state.showArchived=e.target.checked;if(state.character&&state.archived.get(state.character.id)&&!state.showArchived)void pickCharacter('');options();});
   $('tree-plan-route').addEventListener('click',markRoute);$('tree-projector-plan-route').addEventListener('click',markRoute);
   $('tree-plan-next').addEventListener('click',focusNextPlanned);$('tree-projector-next-plan').addEventListener('click',focusNextPlanned);
   $('tree-plan-clear').addEventListener('click',clearPlan);
   $('tree-edit').addEventListener('click',openEditor);$('tree-editor-close').addEventListener('click',closeEditor);
   $('tree-editor-form').addEventListener('submit',e=>{e.preventDefault();void saveEditorial('ready')});$('tree-edit-save-draft').addEventListener('click',()=>void saveEditorial('draft'));
   $('tree-search').addEventListener('input',search);$('tree-find-draft').addEventListener('click',findDraft);
   $('tree-focus-frontier').addEventListener('click',()=>{const arr=data.nextNodes(selectedPath());if(arr.length){choose(arr[0].id,true)}});
   $('tree-focus-last').addEventListener('click',()=>{const id=selectedPath().at(-1)||'origem';choose(id,true)});
   $('tree-zoom-in').addEventListener('click',()=>zoom(1.3));$('tree-zoom-out').addEventListener('click',()=>zoom(1/1.3));
   $('tree-center').addEventListener('click',()=>focus(data.map.get('origem'),.56));
   $('tree-projection').addEventListener('click',()=>state.projection?void exitProjection():void enterProjection());
   $('tree-projector-exit').addEventListener('click',()=>void exitProjection());
   const key=e=>{if(e.key!=='Escape')return;if(!$('tree-editor-modal').hidden)closeEditor();else if(!$('tree-confirm-modal').hidden)closePurchase();else if(state.projection)void exitProjection()};
   const resize=()=>view();const hidden=()=>document.body.classList.toggle('tree-sleep',document.hidden);
   const fullscreen=()=>{if(state.fullscreenUsed&&!document.fullscreenElement){state.fullscreenUsed=false;setProjection(false)}};
   document.addEventListener('keydown',key);window.addEventListener('resize',resize);document.addEventListener('visibilitychange',hidden);document.addEventListener('fullscreenchange',fullscreen);
   const wheel=e=>{e.preventDefault();zoom(e.deltaY<0?1.11:1/1.11)};map.addEventListener('wheel',wheel,{passive:false});
   const down=e=>{hideTooltip();if(e.button!==0&&e.pointerType==='mouse')return;state.drag={x:e.clientX,y:e.clientY,cx:state.cx,cy:state.cy,moved:false};map.setPointerCapture(e.pointerId)};
   const move=e=>{if(!state.drag)return;const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;if(Math.abs(dx)+Math.abs(dy)>5)state.drag.moved=true;state.cx=state.drag.cx-dx/state.zoom;state.cy=state.drag.cy-dy/state.zoom;view()};
   const up=e=>{if(!state.drag)return;const moved=state.drag.moved;state.drag=null;if(moved){state.suppressClick=true;setTimeout(()=>state.suppressClick=false,0)}};
   map.addEventListener('pointerdown',down);map.addEventListener('pointermove',move);map.addEventListener('pointerup',up);map.addEventListener('pointercancel',up);
   dispose=()=>{document.removeEventListener('keydown',key);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',hidden);document.removeEventListener('fullscreenchange',fullscreen);if(state.projection)void exitProjection();lifecycle++};
  }
  authorize();
 }
 document.addEventListener('haema:navigated',init);
 document.addEventListener('haema:leaving',()=>{dispose();dispose=()=>{}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();