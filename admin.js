import {access, client, rpc, node, button, accessGate, authorizedFetch} from './auth.js';

const AREAS = [['library','Biblioteca de Lore'],['bestiary','Bestiário'],['portal','Campanhas e fichas online'],['mesa','Ficha local e dados'],['materials','Materiais da campanha'],['studio','HÆMA Estúdio — Mapmaker e mesa física']];
let generation=0;
const host=()=>document.getElementById('haema-admin');
async function initAdmin() {
  const root=host(),version=++generation;
  if(!root)return;
  root.replaceChildren(node('p','','Verificando acesso administrativo…'));
  try {
    const permissions=await access();
    if(version!==generation||root!==host())return;
    if(!permissions.admin) {accessGate(root,permissions,'Administração');return;}
    const db=await client();
    const result=await Promise.all([
      db.from('haema_access_accounts').select('*').order('created_at',{ascending:false}),
      db.from('haema_area_grants').select('user_id,area'),
      db.from('haema_campaigns').select('id,name'),
      db.from('haema_access_log').select('id,subject_id,action,details,created_at').order('id',{ascending:false}).limit(60)
    ]);
    for(const r of result)if(r.error)throw r.error;
    if(version!==generation||root!==host())return;
    const [accounts,grants,campaigns,logs]=result.map(r=>r.data);
    const tabs=node('nav','admin-tabs');tabs.setAttribute('aria-label','Administração');
    const panel=node('section','admin-panel');
    root.replaceChildren(tabs,panel);
    let tabVersion=0;
    function users() {
      tabVersion++;
      panel.replaceChildren(node('h2','','Pessoas e permissões'),
        node('p','',accounts.filter(a=>a.status==='pending').length+' solicitação(ões) aguardando análise.'));
      const names=Object.fromEntries(accounts.map(a=>[a.user_id,a.display_name]));
      for(const account of accounts) {
        const row=node('details','admin-user');
        const summary=node('summary','',account.display_name);
        const status={pending:'Aguardando aprovação',approved:'Aprovado',denied:'Negado',revoked:'Revogado'};
        summary.append(node('small','',account.user_id===permissions.user.id?'Administrador fundador':status[account.status]));
        row.append(summary);
        if(account.user_id===permissions.user.id){row.append(node('p','','Administrador fundador · acesso integral protegido.'));panel.append(row);continue;}
        const form=node('form','access-review');
        const choices=node('fieldset');choices.append(node('legend','','Áreas autorizadas'));
        for(const [area,label]of AREAS) {
          const wrap=node('label'),input=node('input');
          input.type='checkbox';input.name='area';input.value=area;
          input.checked=grants.some(g=>g.user_id===account.user_id&&g.area===area);
          wrap.append(input,document.createTextNode(label));choices.append(wrap);
        }
        const campaignLabel=node('label','','Adicionar à campanha');
        const campaign=node('select');campaign.name='campaign';campaign.append(new Option('Manter vínculos atuais',''));
        for(const item of campaigns)campaign.append(new Option(item.name,item.id));
        campaignLabel.append(campaign);
        const actions=node('div','admin-actions'),feedback=node('p','admin-feedback');
        feedback.setAttribute('role','status');
        for(const [state,label]of [['approved','Aprovar / salvar acessos'],['denied','Negar'],['revoked','Revogar todos os acessos']]) {
          actions.append(button(label,async()=>{
            actions.querySelectorAll('button').forEach(b=>b.disabled=true);
            try {
              const areas=[...choices.querySelectorAll('input:checked')].map(i=>i.value);
              await rpc('haema_review_access',{target:account.user_id,next_status:state,areas,campaign:campaign.value||null,expected_revision:account.revision});
              await initAdmin();
            }catch(error){feedback.textContent=error.message;actions.querySelectorAll('button').forEach(b=>b.disabled=false);}
          },state==='approved'?'archive-button':'archive-link-button'));
        }
        form.append(choices,campaignLabel,actions,feedback);row.append(form);panel.append(row);
      }
    }
    async function releases() {
      const tab=++tabVersion;
      panel.replaceChildren(node('h2','','Liberações do Bestiário'),node('p','','Para uma criatura aparecer no livro dos jogadores, escolha o registro, marque pelo menos um parágrafo e salve a liberação. O acesso à Biblioteca, sozinho, não publica os animais.'));
      try {
        const response=await authorizedFetch('/api/library'),items=await response.json();
        if(version!==generation||root!==host()||tab!==tabVersion)return;
        const releaseSummary=node('p','admin-release-summary');
        const countPublished=()=>items.filter(item=>item.released).length;
        const setSummary=()=>{releaseSummary.textContent=countPublished()+' de '+items.length+' registros com trechos liberados aos jogadores.';};
        setSummary();
        panel.append(releaseSummary);
        const select=node('select');select.setAttribute('aria-label','Registro do Bestiário');
        select.append(new Option('Escolha um registro',''));
        const categories={canon:'CANÔNICO',concept:'CONCEITO',proposal:'PROPOSTA',historical:'HISTÓRICO'};
        const priority={canon:0,concept:1,proposal:2,historical:3};
        const available=[...items].sort((a,b)=>(priority[a.state]??10)-(priority[b.state]??10)||a.ordinal-b.ordinal);
        const describe=item=>(categories[item.state]||'REGISTRO')+' · '+item.title+(item.released?' · PUBLICADO':' · PRIVADO');
        for(const item of available)select.append(new Option(describe(item),item.id));
        const editor=node('div');let selected=0;
        select.addEventListener('change',async()=>{
          const sequence=++selected;
          editor.replaceChildren();
          if(!select.value)return;
          editor.append(node('p','','Abrindo o registro reservado…'));
          try{
            const item=await (await authorizedFetch('/api/library?entry='+encodeURIComponent(select.value))).json();
            if(sequence!==selected||!editor.isConnected)return;
            editor.replaceChildren(node('h3','',item.title));
            const form=node('div','release-paragraphs');
            item.paragraphs.forEach((text,index)=>{
              const label=node('label'),checkbox=node('input');checkbox.type='checkbox';checkbox.value=index;
              checkbox.checked=item.released_indexes.includes(index);
              label.append(checkbox,node('span','',text));form.append(label);
            });
            const feedback=node('p');feedback.setAttribute('role','status');
            editor.append(form,button('Salvar liberação de trechos',async()=>{
              const indexes=[...form.querySelectorAll('input:checked')].map(x=>+x.value);
              try{
                await rpc('haema_release_entry',{entry_id:item.id,indexes,expected_revision:item.revision});
                item.revision++;
                item.released_indexes=indexes;
                const selectedItem=items.find(record=>record.id===item.id);
                if(selectedItem) {
                  selectedItem.released=indexes.length>0;
                  const opt=[...select.options].find(option=>option.value===item.id);
                  if(opt)opt.textContent=describe(selectedItem);
                }
                setSummary();
                feedback.textContent=indexes.length
                  ?'Publicado: '+indexes.length+' trecho(s). Os jogadores verão a criatura no índice.'
                  :'Nenhum trecho publicado. A criatura não aparece para os jogadores.';
              }catch(error){feedback.textContent=error.message;}
            }),feedback);
          }catch(error){editor.replaceChildren(node('p','',error.message));}
        });
        panel.append(select,editor);
      }catch(error){if(tab===tabVersion&&root===host())panel.append(node('p','',error.message));}
    }
    async function volumes() {
      const tab=++tabVersion;
      panel.replaceChildren(node('h2','','Volumes e publicação'),node('p','','Os textos completos permanecem privados até a liberação explícita. Um volume liberado só pode ser lido por contas aprovadas com acesso à Biblioteca. O Bestiário mantém suas liberações independentes.'));
      try {
        const items=await rpc('haema_volume_catalog');
        if(version!==generation||root!==host()||tab!==tabVersion)return;
        for(const item of items) {
          const row=node('article','admin-user');
          row.append(node('h3','',item.title),node('p','',item.released?'Liberado para leitores autorizados da Biblioteca.':'Privado · revisão exclusiva da administração.'));
          const review=node('a','archive-link-button','Revisar na Biblioteca ↗');review.href='biblioteca.html#manuscritos-title';row.append(review);
          const label=node('label'),confirm=node('input');confirm.type='checkbox';
          label.append(confirm,document.createTextNode(item.released?'Confirmo retirar este volume da leitura dos jogadores.':'Revisei o texto e autorizo a leitura para contas aprovadas com Biblioteca.'));
          const feedback=node('p');feedback.setAttribute('role','status');
          const save=button(item.released?'Recolher volume':'Liberar volume',async()=>{
            if(!confirm.checked)return;
            try{await rpc('haema_volume_release',{volume_id:item.id,release:!item.released,expected_revision:item.revision});await volumes();}
            catch(error){feedback.textContent=error.message;}
          });save.disabled=true;confirm.addEventListener('change',()=>{save.disabled=!confirm.checked});
          row.append(label,save,feedback);panel.append(row);
        }
      }catch(error){if(tab===tabVersion&&root===host())panel.append(node('p','',error.message));}
    }
    function audit() {
      tabVersion++;
      panel.replaceChildren(node('h2','','Histórico de acessos e liberações'));
      const names=Object.fromEntries(accounts.map(a=>[a.user_id,a.display_name]));
      for(const log of logs) {
        const row=node('article','audit-row');
        row.append(node('time','',new Date(log.created_at).toLocaleString('pt-BR')),
          node('strong','',log.action==='access.review'?'Permissões revisadas':log.action==='volume.release'?'Publicação de volume revisada':'Trechos do Bestiário revisados'),
          node('p','',log.subject_id?(names[log.subject_id]||'Conta cadastrada')+' · '+log.details.before+' → '+log.details.after:log.action==='volume.release'?log.details.volume+' · '+(log.details.after?'Liberado':'Privado'):log.details.entry));
        panel.append(row);
      }
      if(!logs.length)panel.append(node('p','','As revisões de acesso e as liberações aparecerão aqui.'));
    }
    tabs.append(button('Pessoas',users),button('Liberações',releases),button('Volumes',volumes),button('Auditoria',audit),button('Atualizar',initAdmin));
    users();
  } catch(error) {
    if(version!==generation||root!==host())return;
    root.replaceChildren(node('h2','','Administração indisponível'),node('p','',error.message),button('Tentar novamente',initAdmin));
  }
}
document.addEventListener('haema:navigated',initAdmin);
document.addEventListener('haema:auth',initAdmin);
initAdmin();
