import {renderReservedAdmin} from './reserved-admin.js';
import {renderAccessCenter} from './access-center.js';
import {renderActivityAdmin} from './activity-admin.js';
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
    const tabs=node('nav','admin-tabs');tabs.setAttribute('aria-label','Administração');
    const panel=node('section','admin-panel');
    root.replaceChildren(tabs,panel);
    let tabVersion=0;
    async function users() {
      const tab=++tabVersion;
      await renderAccessCenter(panel,()=>version===generation&&root===host()&&tab===tabVersion);
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
    async function audit(){
      const tab=++tabVersion;
      await renderActivityAdmin(panel,()=>version===generation&&root===host()&&tab===tabVersion);
    }
    tabs.append(button('Central de acessos',users),button('Liberações do Bestiário',releases),button('Volumes',volumes),button('Textos reservados',()=>{tabVersion++;void renderReservedAdmin(panel)}),button('Atividades e Auditoria',audit),button('Atualizar',initAdmin));
    users();
  } catch(error) {
    if(version!==generation||root!==host())return;
    root.replaceChildren(node('h2','','Administração indisponível'),node('p','',error.message),button('Tentar novamente',initAdmin));
  }
}
document.addEventListener('haema:navigated',initAdmin);
document.addEventListener('haema:auth',initAdmin);
initAdmin();
