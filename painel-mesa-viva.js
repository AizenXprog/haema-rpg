/* HÆMA · Mesa ao Vivo: controle operacional privado do Mestre.
 * Dados próprios da sessão, nunca sobrescreve a ficha, PE ou habilidades.
 * Site e Sistema criado por Vitor Monte.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HaemaMesaViva=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const FIELDS=[
  {id:'integridade',label:'Integridade',short:'INT',main:true},
  {id:'folego',label:'Fôlego',short:'FÔL',main:true},
  {id:'ferimentos',label:'Ferimentos',short:'FER'},
  {id:'metus',label:'Metus',short:'MET'},
  {id:'ignis',label:'Ignis',short:'IGN'},
  {id:'invicta',label:'Invicta',short:'INV'}
 ];
 const cap=(value,max=999)=>Number.isFinite(+value)?Math.min(max,Math.max(0,Math.trunc(+value))):0;
 const empty=()=>({round:0,index:0,order:[],characters:{},enemies:[]});
 const blankStats=()=>({integridade:null,folego:null,ferimentos:null,metus:null,ignis:null,invicta:null,reaction:true,condition:''});
 function sanitizeStats(raw){
  const stats=blankStats(),v=raw&&typeof raw==='object'?raw:{};
  for(const {id} of FIELDS)stats[id]=v[id]===null||v[id]===''||v[id]===undefined?null:cap(v[id]);
  stats.reaction=v.reaction!==false;
  stats.condition=String(v.condition||'').slice(0,160);
  return stats;
 }
 function reconcile(raw,characters){
  const snapshot=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},out=empty();
  out.round=cap(snapshot.round,9999);out.index=cap(snapshot.index,9999);
  const ids=new Set(characters.map(x=>x.id));
  const saved=snapshot.characters&&typeof snapshot.characters==='object'?snapshot.characters:{};
  for(const c of characters)out.characters[c.id]=sanitizeStats(saved[c.id]);
  out.enemies=Array.isArray(snapshot.enemies)?snapshot.enemies.slice(0,30).filter(x=>x&&typeof x.id==='string'&&x.id.startsWith('inimigo_')).map(x=>({id:x.id.slice(0,90),name:String(x.name||'Inimigo').slice(0,70),stats:sanitizeStats(x.stats)})):[];
  for(const e of out.enemies)ids.add(e.id);
  const provided=Array.isArray(snapshot.order)?snapshot.order.filter(x=>typeof x==='string'&&ids.has(x)):[];
  out.order=[...new Set([...provided,...characters.map(c=>c.id),...out.enemies.map(e=>e.id)])];
  out.index=out.order.length?Math.min(out.index,out.order.length-1):0;
  return out;
 }
 function create(host,notify=()=>{}){
  if(!host)throw Error('Mesa ao Vivo: área indisponível');
  let ctx=null,snapshot=empty(),characters=[],tree=[],timer=0,serial=0,savedSerial=0,working=false,destroyed=false,lastError='';
  const $=id=>host.closest('[data-panel="live"]').querySelector('#'+id);
  const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n};
  const lookup=id=>characters.find(c=>c.id===id)||snapshot.enemies.find(e=>e.id===id)||null;
  const statsFor=id=>snapshot.characters[id]||snapshot.enemies.find(e=>e.id===id)?.stats;
  const isEnemy=id=>id.startsWith('inimigo_');
  const display=id=>lookup(id)?.title||lookup(id)?.name||'Participante';
  const setStatus=(message,error=false)=>{const element=$('live-save-status');if(element){element.textContent=message;element.dataset.error=error?'true':'false'}};
  function draw(){
   const ready=!!ctx;
   $('live-round').textContent=snapshot.round?String(snapshot.round):'—';
   const active=snapshot.round?snapshot.order[snapshot.index]:null;
   $('live-current').textContent=active?display(active):'Nenhum turno iniciado';
   const begin=$('live-start');begin.disabled=!ready||!snapshot.order.length;begin.textContent=snapshot.round?'Reiniciar combate':'Iniciar combate';
   $('live-next').disabled=!ready||!snapshot.round||!snapshot.order.length;
   $('live-prev').disabled=!ready||!snapshot.round||!snapshot.order.length;
   $('live-finish').disabled=!ready||!snapshot.round;
   const order=$('live-order');order.replaceChildren();
   if(!snapshot.order.length)order.append(make('p','live-empty','Cadastre personagens na campanha ou inclua um inimigo.'));
   snapshot.order.forEach((id,pos)=>{
    const row=make('div','live-turn'+(active===id?' active':'')),name=make('button','live-turn-name',(pos+1)+' · '+display(id));name.type='button';name.disabled=!snapshot.round;
    name.title='Ir diretamente para este turno';name.addEventListener('click',()=>{snapshot.index=pos;dirty();draw()});row.append(name);
    if(isEnemy(id))row.append(make('span','live-tag','NPC'));
    const up=make('button','live-mini','↑'),down=make('button','live-mini','↓');up.type=down.type='button';up.title='Subir na ordem';down.title='Descer na ordem';up.disabled=pos===0;down.disabled=pos===snapshot.order.length-1;
    const move=direction=>{const currentId=snapshot.round?snapshot.order[snapshot.index]:null;const other=pos+direction;[snapshot.order[pos],snapshot.order[other]]=[snapshot.order[other],snapshot.order[pos]];if(currentId)snapshot.index=snapshot.order.indexOf(currentId);dirty();draw()};
    up.addEventListener('click',()=>move(-1));down.addEventListener('click',()=>move(1));row.append(up,down);order.append(row);
   });
   const roster=$('live-roster');roster.replaceChildren();
   if(!characters.length&&!snapshot.enemies.length)roster.append(make('p','live-empty','Nenhum personagem nesta campanha. Crie um perfil em Personagens para começar.'));
   for(const c of [...characters.map(x=>({id:x.id,title:x.title})),...snapshot.enemies.map(e=>({id:e.id,title:e.name}))]){
    const stats=statsFor(c.id)||blankStats(),card=make('article','live-fighter'+(active===c.id?' active':''));
    const head=make('header','live-fighter-head'),heading=make('div','live-fighter-name'),name=make('strong','',c.title);
    heading.append(name);
    if(!isEnemy(c.id)){const entry=tree.find(t=>t.character_id===c.id),pe=entry?.pe_available,parry=entry?.path?.includes('s1:1:4');heading.append(make('small','',`PE ${Number.isFinite(pe)?pe:'—'} · ${parry?'Parry aprendido':'Parry não aprendido'}`));}
    else heading.append(make('small','','Adversário / NPC'));
    head.append(heading);
    if(isEnemy(c.id)){const remove=make('button','live-mini','✕');remove.type='button';remove.title='Remover inimigo da mesa';remove.addEventListener('click',()=>{if(!confirm('Remover '+c.title+' da mesa?'))return;const current=snapshot.order[snapshot.index];snapshot.enemies=snapshot.enemies.filter(e=>e.id!==c.id);snapshot.order=snapshot.order.filter(x=>x!==c.id);snapshot.index=Math.max(0,snapshot.order.indexOf(current));dirty();draw()});head.append(remove)}
    card.append(head);
    const main=make('div','live-resource-primary');
    for(const field of FIELDS.filter(x=>x.main))main.append(counter(c.id,stats,field));
    card.append(main);
    const details=make('details','live-more'),summary=make('summary','','Condições e recursos');details.append(summary);
    const grid=make('div','live-resource-secondary');
    for(const field of FIELDS.filter(x=>!x.main))grid.append(counter(c.id,stats,field,true));
    details.append(grid);
    const reaction=make('label','live-reaction'),toggle=make('input');toggle.type='checkbox';toggle.checked=stats.reaction;toggle.addEventListener('change',()=>{stats.reaction=toggle.checked;dirty()});
    reaction.append(toggle,make('span','', 'Reação disponível nesta rodada'));details.append(reaction);
    const status=make('label','live-condition','Condições / observações do combate'),input=make('input');
    input.type='text';input.maxLength=160;input.placeholder='Ex.: caído, agarrado, ferido';input.value=stats.condition;
    input.addEventListener('change',()=>{stats.condition=input.value.trim().slice(0,160);dirty()});status.append(input);details.append(status);
    card.append(details);roster.append(card);
   }
  }
  function counter(id,stats,field,small=false){
   const box=make('div','live-counter'+(small?' secondary':'')),label=make('label','',field.label),row=make('div','live-counter-controls'),input=make('input');
   input.type='number';input.min=0;input.max=999;input.step=1;input.inputMode='numeric';input.setAttribute('aria-label',field.label+' de '+display(id));input.value=stats[field.id]??'';
   const change=(val)=>{stats[field.id]=val===null?null:cap(val);input.value=stats[field.id]??'';dirty()};
   const adjust=n=>{change(cap((stats[field.id]??0)+n));};
   if(!small){const minus=make('button','live-step','−');minus.type='button';minus.setAttribute('aria-label','Diminuir '+field.label+' de '+display(id));minus.addEventListener('click',()=>adjust(-1));row.append(minus)}
   input.addEventListener('change',()=>change(input.value.trim()===''?null:input.value));
   row.append(input);
   if(!small){const plus=make('button','live-step','+');plus.type='button';plus.setAttribute('aria-label','Aumentar '+field.label+' de '+display(id));plus.addEventListener('click',()=>adjust(1));row.append(plus)}
   label.append(row);box.append(label);return box;
  }
  function dirty(){if(!ctx||destroyed)return;serial++;setStatus('Alterações pendentes…');clearTimeout(timer);timer=setTimeout(()=>{void flush()},400)}
  async function flush(){
   clearTimeout(timer);if(!ctx||destroyed)return false;
   if(working){while(working)await new Promise(resolve=>setTimeout(resolve,20));if(serial!==savedSerial&&!lastError)return flush();return !lastError;}
   if(serial===savedSerial)return !lastError;
   working=true;const current=ctx,seq=serial,copy=JSON.parse(JSON.stringify(snapshot));
   setStatus('Salvando no Supabase…');
   try{
    const {error}=await current.db.from('haema_gm_live_state').upsert({campaign_id:current.campaignId,snapshot:copy,updated_by:current.userId,updated_at:new Date().toISOString()},{onConflict:'campaign_id'});
    if(error)throw error;
    savedSerial=seq;lastError='';if(ctx===current)setStatus(serial===seq?'Sessão salva':'Salvando novas alterações…');
   }catch(error){lastError=String(error?.message||'Erro ao salvar');if(ctx===current){setStatus('Não salvo: '+lastError,true);notify('A Mesa ao Vivo não foi salva: '+lastError,true)}}
   finally{working=false;if(ctx===current&&serial>savedSerial&&!lastError)timer=setTimeout(()=>void flush(),100)}
   return !lastError;
  }
  async function load({db,campaignId,userId,roster=[],progress=[]}){
   if(ctx&&serial!==savedSerial){const ok=await flush();if(!ok)throw Error('Salve as alterações da mesa antes de atualizar ou trocar de campanha.');}
   const token=Symbol();load.token=token;ctx={db,campaignId,userId};characters=roster.slice();tree=progress.slice();
   setStatus('Consultando a sessão…');
   try{
    const {data,error}=await db.from('haema_gm_live_state').select('snapshot,updated_at').eq('campaign_id',campaignId).maybeSingle();
    if(error)throw error;
    if(destroyed||load.token!==token||ctx.campaignId!==campaignId)return;
    snapshot=reconcile(data?.snapshot,characters);serial=0;savedSerial=0;lastError='';
    draw();setStatus(data?'Sessão sincronizada':'Sessão pronta · nenhum dado alterado');
   }catch(error){if(load.token!==token)return;snapshot=reconcile(null,characters);draw();setStatus('Não foi possível carregar a mesa',true);notify('Mesa ao Vivo: '+String(error?.message||error),true);throw error;}
  }
  function init(){
   $('live-start').addEventListener('click',()=>{
    if(!snapshot.order.length)return;
    if(snapshot.round&&!confirm('Reiniciar a contagem de turnos? Os recursos atuais serão preservados.'))return;
    snapshot.round=1;snapshot.index=0;for(const id of snapshot.order)statsFor(id).reaction=true;
    dirty();draw();
   });
   $('live-next').addEventListener('click',()=>{
    if(!snapshot.round||!snapshot.order.length)return;
    snapshot.index++;
    if(snapshot.index>=snapshot.order.length){snapshot.index=0;snapshot.round=Math.min(9999,snapshot.round+1);for(const id of snapshot.order)statsFor(id).reaction=true}
    dirty();draw();
   });
   $('live-prev').addEventListener('click',()=>{
    if(!snapshot.round||!snapshot.order.length)return;
    if(snapshot.index===0){snapshot.index=snapshot.order.length-1;snapshot.round=Math.max(1,snapshot.round-1)}
    else snapshot.index--;
    dirty();draw();
   });
   $('live-finish').addEventListener('click',()=>{if(!snapshot.round||!confirm('Encerrar combate? Os recursos continuam anotados e não serão apagados.'))return;snapshot.round=0;snapshot.index=0;dirty();draw()});
   $('live-add-enemy').addEventListener('submit',event=>{
    event.preventDefault();if(!ctx)return;
    const input=$('live-enemy-name'),name=input.value.trim().slice(0,70);if(!name)return;
    if(snapshot.enemies.length>=30)return notify('Limite de 30 adversários neste encontro.',true);
    const id='inimigo_'+(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2));
    snapshot.enemies.push({id,name,stats:blankStats()});snapshot.order.push(id);input.value='';dirty();draw();
   });
   $('live-save-now').addEventListener('click',()=>void flush());
  }
  init();draw();setStatus('Selecione uma campanha.');
  return {load,flush,destroy:()=>{destroyed=true;clearTimeout(timer)},getSnapshot:()=>JSON.parse(JSON.stringify(snapshot))};
 }
 return Object.freeze({create,reconcile,sanitizeStats});
});
