/* Navegação identificada, sem conteúdo digitado. Sinais do cliente não constituem prova de segurança. */
import {client} from './auth.js';
const ROUTES=new Set(['index.html','biblioteca.html','sistema.html','manual.html','portal.html',
 'administracao.html','campanha.html','mesa.html','estudio.html','atualizacoes.html','privacidade.html','arquivo.html','ficha.html','dados.html','projecao.html']);
const path=()=>location.pathname.split('/').pop()||'index.html';
let pending=false,connected=false,lastRoute='';
async function signal(action,target){
 try{
  const db=await client();
  const {data:{session}}=await db.auth.getSession();
  if(!session){connected=false;return;}
  await db.rpc('haema_activity_signal',{p_action:action,p_target:target});
 }catch{/* Monitoramento não pode bloquear leitura, fichas ou navegação. */}
}
function navigation(){
 const route=path();
 if(!ROUTES.has(route)||pending||document.hidden)return;
 pending=true;
 queueMicrotask(()=>{pending=false;const next=path();if(ROUTES.has(next)){lastRoute=next;void signal('page.view',next);}});
}
function session(){
 if(!connected){connected=true;void signal('session.connected','portal');}
 navigation();
}
document.addEventListener('haema:navigated',navigation);
document.addEventListener('haema:auth',session);
document.addEventListener('DOMContentLoaded',session,{once:true});
if(document.readyState!=='loading')session();
