/* HÆMA — Constelação das Escolhas (prévia experimental)
 * O banco valida a compra; o navegador nunca decide autorização ou PE.
 * Site e Sistema criado por Vitor Monte.
 */
(function(){
 'use strict';
 const NS='http://www.w3.org/2000/svg';
 let epoch=0,cleanup=()=>{};
 function init(){
  const root=document.querySelector('#haema-tree-app');if(!root||root.dataset.treeInit==='yes')return;
  root.dataset.treeInit='yes';const token=++epoch;
  const tree=window.HaemaSkillTree;if(!tree){root.textContent='Não foi possível carregar o catálogo da árvore.';return;}
  const $=id=>root.querySelector('#'+id),nodeById=tree.map;
  const map=$('tree-map'),world=$('tree-universe'),edges=$('tree-edges'),points=$('tree-nodes');
  const state={db:null,user:null,characters:[],owners:new Set(),character:null,progress:null,selection:'origem',zoom:0.56,cx:0,cy:0,busy:false,projecting:false,drag:null,blockClick:false};
  const svg=(name,attrs={})=>{const e=document.createElementNS(NS,name);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,String(v));return e};
  const safeString=(s)=>String(s??'').slice(0,400);
  const emit=(message,error=false)=>{const p=$('tree-account-status');p.textContent=message;p.dataset.error=error?'yes':'no'};
  const selectable=()=>state.progress?.path||[];
  const frontier=()=>new Set(tree.nextNodes(selectable()).map(n=>n.id));
  const canBuy=node=>state.character&&state.user&&state.user.id===state.character.user_id&&state.progress&&node&&node.id!=='origem'&&frontier().has(node.id)&&state.progress.pe_available>=node.cost&&(!node.lockedByAwakening||state.progress.awakened)&&!state.projecting;
  const connect=()=>{
   const selected=new Set(selectable()),available=frontier();
   [...edges.children].forEach(line=>{
    const id=line.dataset.id,cls=selected.has(id)?'tree-edge unlocked':available.has(id)?'tree-edge available':'tree-edge';line.setAttribute('class',cls);
   });
   [...points.children].forEach(el=>{
    const id=el.dataset.id,node=nodeById.get(id);if(!node)return;
    const parts=['tree-node',node.type];if(selected.has(id)||id==='origem')parts.push('unlocked');
    else if(available.has(id))parts.push('available');
    if(id===state.selection)parts.push('current');el.setAttribute('class',parts.join(' '));
    el.setAttribute('aria-label',`${node.name}. ${selected.has(id)?'Adquirido':available.has(id)?'Disponível':'Bloqueado'}`);
   });
   $('tree-pe').textContent=state.character?String(state.progress?.pe_available??0):'—';
   $('tree-count').textContent=String(selected.size);
   displayDetails();
  };
  const draw=()=>{
   for(const e of tree.edges){const from=nodeById.get(e.from),to=nodeById.get(e.to);if(!from||!to)continue;
    const line=svg('path',{d:`M${from.x} ${from.y} Q${(from.x+to.x)/2} ${(from.y+to.y)/2} ${to.x} ${to.y}`,'data-id':e.to,class:'tree-edge'});edges.append(line);
   }
   for(const n of tree.nodes){
    const group=svg('g',{class:`tree-node ${n.type}`,transform:`translate(${n.x} ${n.y})`,tabindex:'0',role:'button','data-id':n.id});
    group.append(svg('circle',{class:'node-aura',r:n.type==='origin'?78:n.type==='apex'?43:32}),svg('circle',{class:'core',r:n.type==='origin'?53:n.type==='apex'?29:n.type==='keystone'?24:n.type==='notable'?18:13}));
    if(n.type!=='minor'){const txt=svg('text',{class:'node-symbol',x:0,y:2});txt.textContent=n.type==='origin'?'Æ':tree.sectors[n.sectorIndex]?.symbol||'✧';group.append(txt)}
    group.append(svg('circle',{class:'node-touch',r:n.type==='origin'?70:33}));
    group.addEventListener('click',()=>{if(!state.blockClick)choose(n.id)});
    group.addEventListener('keydown',evt=>{if(evt.key==='Enter'||evt.key===' '){evt.preventDefault();choose(n.id)}});
    const title=svg('title');title.textContent=`${n.name} · ${n.cost} PE`;group.append(title);
    points.append(group);
   }
   document.getElementById('tree-total').textContent=String(tree.nodes.length);
   const legends=$('tree-legend-items');legends.replaceChildren();
   tree.sectors.forEach((s,i)=>{
    const b=document.createElement('button');b.type='button';b.innerHTML=`<i aria-hidden="true"></i><span></span>`;
    b.firstChild.style.background=s.color;b.lastChild.textContent=s.name;
    b.addEventListener('click',()=>{const n=nodeById.get(tree.key(i,'',3));if(n){choose(n.id);focus(n,0.72)}});
    legends.append(b);
   });
  };
  function size(){const r=map.getBoundingClientRect();return{w:Math.max(320,r.width),h:Math.max(360,r.height)}}
  function view(){const {w,h}=size(),ww=w/state.zoom,hh=h/state.zoom;map.setAttribute('viewBox',`${state.cx-ww/2} ${state.cy-hh/2} ${ww} ${hh}`)}
  function focus(n,zoom){state.cx=n.x;state.cy=n.y;if(zoom)state.zoom=zoom;view()}
  function zoom(delta){const next=Math.max(.15,Math.min(2.7,state.zoom*delta));state.zoom=next;view()}
  const choose=id=>{state.selection=id;connect()};
  function displayDetails(){
   const n=nodeById.get(state.selection)||nodeById.get('origem'),sector=tree.sectors[n.sectorIndex],earned=selectable().includes(n.id),available=frontier().has(n.id);
   $('tree-detail-name').textContent=n.name;$('tree-detail-path').textContent=(sector?.name||'Origem')+(n.phase?' / '+n.phase:'');
   $('tree-detail-body').textContent=n.effect;$('tree-detail-glyph').textContent=sector?.symbol||'Æ';
   $('tree-detail-glyph').style.color=sector?.color||'#e4be84';
   $('tree-detail-type').textContent=n.type==='apex'?'ÁPICE':n.type==='keystone'?'NÓ MARCO':n.type==='origin'?'NÚCLEO':n.type==='notable'?'DESTAQUE':'PASSO';
   $('tree-detail-cost').textContent=n.id==='origem'?'—':`${n.cost} PE`;
   $('tree-detail-rank').textContent=n.id==='origem'?'0 / 24':`${n.rank} / 24`;
   let status='A escolha de outro caminho torna esta rota inacessível para o personagem.';
   if(n.id==='origem')status='Ponto inicial: selecione o primeiro nó de um dos sete caminhos.';
   else if(earned)status='Habilidade conquistada e registrada no personagem.';
   else if(available&&!state.character)status='Esta é uma continuação possível. Selecione um personagem para gravar.';
   else if(available&&n.lockedByAwakening&&!state.progress?.awakened)status='Requer um Despertar registrado pelo mestre para este personagem.';
   else if(available&&state.character&&state.progress?.pe_available<n.cost)status=`Precisará de ${n.cost} PE. Disponível: ${state.progress?.pe_available??0} PE.`;
   else if(available)status='Próximo passo possível. Escolha permanente e registrada após confirmação.';
   $('tree-detail-state').textContent=status;
   const btn=$('tree-unlock');btn.disabled=!canBuy(n)||state.busy;
   btn.textContent=earned?'Já conquistado':canBuy(n)?`Conquistar por ${n.cost} PE`:available?'Ainda não disponível':'Caminho fechado';
  }
  async function fetchProgress(){
   if(!state.character||!state.db)return;
   const {data,error}=await state.db.from('haema_tree_progress').select('character_id,pe_available,pe_spent,path,awakened,updated_at').eq('character_id',state.character.id).maybeSingle();
   if(error)throw error;
   state.progress=data||{character_id:state.character.id,pe_available:0,pe_spent:0,path:[],awakened:false};
   const gm=state.owners.has(state.character.campaign_id);$('tree-gm-tools').hidden=!gm;
   $('tree-regency-button').textContent=state.progress.awakened?'Revogar acesso experimental de Regências':'Liberar acesso ao ramo de Regências';
   connect();
  }
  async function fetchCharacters(){
   const {data,error}=await state.db.from('haema_characters').select('id,title,campaign_id,user_id').order('updated_at',{ascending:false});
   if(error)throw error;
   state.characters=data||[];
   const {data:owned, error:ownerError}=await state.db.from('haema_campaigns').select('id').eq('gm_id',state.user.id);
   if(ownerError)throw ownerError;
   state.owners=new Set((owned||[]).map(x=>x.id));
   const select=$('tree-character');select.replaceChildren(new Option('Visualização da constelação',''));
   for(const c of state.characters) select.append(new Option(`${c.title}${c.user_id===state.user.id?' · Meu personagem':' · Mestre'}`,c.id));
   if(!state.characters.length)emit('Sua conta não tem personagens autorizados. Cadastre uma ficha no Portal para salvar sua trilha.');
   else emit('Selecione um personagem. Todos os caminhos podem ser explorados sem gastar PE.');
  }
  async function loadAccount(){
   try{
    const {client}=await import('./auth.js');const db=await client();if(token!==epoch||!root.isConnected)return;
    state.db=db;const {data:{user},error}=await db.auth.getUser();if(error)throw error;if(!user){emit('Visualização pública. Entre pelo Portal com sua conta Google para salvar habilidades.');return}
    state.user=user;await fetchCharacters();
   }catch(e){if(token===epoch)emit('A árvore está disponível para explorar. Para salvar, configure ou acesse o Portal e a migração experimental do Supabase. '+safeString(e.message),true)}
  }
  function waitFeedback(text,error=false){$('tree-detail-state').textContent=text;emit(text,error)}
  async function unlock(){
   const n=nodeById.get(state.selection);if(!canBuy(n)||state.busy)return;
   if(!confirm(`Conquistar “${n.name}” por ${n.cost} PE?\nEsta escolha é permanente e impedirá seguir outros desvios da constelação.`))return;
   state.busy=true;displayDetails();
   try{
    const {error}=await state.db.rpc('haema_tree_unlock',{p_character:state.character.id,p_node:n.id});if(error)throw error;
    await fetchProgress();waitFeedback('Habilidade registrada permanentemente no personagem.');
   }catch(e){waitFeedback('Não foi possível salvar. Nenhuma escolha foi confirmada. '+safeString(e.message),true)}
   finally{state.busy=false;displayDetails()}
  }
  async function grantPE(){
   if(!state.character||!state.owners.has(state.character.campaign_id)||state.busy)return;
   const amount=Number($('tree-grant-pe').value);if(!Number.isInteger(amount)||amount<1||amount>50){emit('Escolha de 1 a 50 PE por concessão.',true);return}
   if(!confirm(`Conceder ${amount} PE a ${state.character.title}?`))return;
   state.busy=true;try{const {error}=await state.db.rpc('haema_tree_grant_pe',{p_character:state.character.id,p_amount:amount});if(error)throw error;await fetchProgress();emit('PE concedidos e registrados pelo mestre.')}catch(e){emit(safeString(e.message),true)}finally{state.busy=false}
  }
  async function toggleAwakening(){
   if(!state.character||!state.owners.has(state.character.campaign_id)||state.busy)return;
   const enabled=!state.progress?.awakened;
   if(!confirm(`${enabled?'Liberar':'Revogar'} acesso experimental ao ramo de Regências para ${state.character.title}?`))return;
   state.busy=true;try{const {error}=await state.db.rpc('haema_tree_set_awakened',{p_character:state.character.id,p_enabled:enabled});if(error)throw error;await fetchProgress();emit('Situação de Despertar registrada pelo mestre.')}catch(e){emit(safeString(e.message),true)}finally{state.busy=false}
  }
  function bind(){
   $('tree-character').addEventListener('change',async e=>{
    state.character=state.characters.find(c=>c.id===e.target.value)||null;state.progress=null;$('tree-gm-tools').hidden=true;
    connect();if(!state.character)return;
    try{await fetchProgress();emit('Trilha sincronizada com a campanha.')}catch(err){emit('Falha ao ler progresso: '+safeString(err.message),true)}
   });
   $('tree-unlock').addEventListener('click',unlock);
   $('tree-grant-button').addEventListener('click',grantPE);
   $('tree-regency-button').addEventListener('click',toggleAwakening);
   $('tree-zoom-in').addEventListener('click',()=>zoom(1.28));
   $('tree-zoom-out').addEventListener('click',()=>zoom(1/1.28));
   $('tree-center').addEventListener('click',()=>focus(nodeById.get('origem'),.56));
   $('tree-projection').addEventListener('click',()=>{
    state.projecting=!state.projecting;document.body.classList.toggle('tree-projection',state.projecting);
    $('tree-projection').textContent=state.projecting?'Sair da projeção':'Projeção';
    setTimeout(view,30);
   });
   const onKey=e=>{if(e.key==='Escape'&&state.projecting){state.projecting=false;document.body.classList.remove('tree-projection');$('tree-projection').textContent='Projeção';view()}};
   document.addEventListener('keydown',onKey);
   const onResize=()=>view();window.addEventListener('resize',onResize);
   const onWheel=e=>{e.preventDefault();zoom(e.deltaY<0?1.12:1/1.12)};map.addEventListener('wheel',onWheel,{passive:false});
   map.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;state.drag={x:e.clientX,y:e.clientY,cx:state.cx,cy:state.cy,moved:false};map.setPointerCapture(e.pointerId)});
   map.addEventListener('pointermove',e=>{if(!state.drag)return;const dx=e.clientX-state.drag.x,dy=e.clientY-state.drag.y;if(Math.abs(dx)+Math.abs(dy)>5)state.drag.moved=true;state.cx=state.drag.cx-dx/state.zoom;state.cy=state.drag.cy-dy/state.zoom;view()});
   map.addEventListener('pointerup',e=>{if(!state.drag)return;const wasMoved=state.drag.moved;state.drag=null;if(wasMoved){state.blockClick=true;setTimeout(()=>state.blockClick=false,0)}});
   map.addEventListener('pointercancel',()=>{state.drag=null});
   cleanup=()=>{document.removeEventListener('keydown',onKey);window.removeEventListener('resize',onResize);state.projecting=false;document.body.classList.remove('tree-projection');epoch++};
  }
  draw();bind();view();connect();loadAccount();
 }
 document.addEventListener('haema:navigated',init);
 document.addEventListener('haema:leaving',()=>{cleanup();cleanup=()=>{}});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();