import {access, accessGate, node, button, logout} from './auth.js';
let generation=0;
async function init(){
 const root=document.getElementById('haema-account-hub'),version=++generation;
 if(!root)return;
 try{
  const info=await access();
  if(version!==generation||!root.isConnected)return;
  if(!info.user){accessGate(root,info,'Portal');root.querySelector('h2').textContent='Entre na sua conta.';return;}
  root.replaceChildren(node('p','archive-kicker','CONTA CONECTADA'),node('h2','',info.user.user_metadata?.full_name||'Sua conta'));
  root.append(node('p','',info.admin?'Administração do HÆMA. Organize pessoas, acessos e conteúdo.':info.status==='approved'?'Seus espaços disponíveis estão reunidos abaixo.':'Sua conta está registrada. Aguarde a revisão do administrador.'));
  const list=node('div','instrument-list');
  function link(href,title,description){
   const a=node('a');a.href=href;const body=node('div');body.append(node('h3','',title),node('p','',description));a.append(body,node('b','','↗'));list.append(a);
  }
  if(info.admin)link('administracao.html','Pessoas, permissões e liberações','Aprovações de contas, acesso individual, trechos do Bestiário e histórico de revisões.');
  if(info.areas.includes('portal'))link('campanha.html','Campanhas e registros','Materiais, recursos, fichas online, conversas e registros disponíveis para sua conta.');
  if(info.areas.includes('library'))link('biblioteca.html','Biblioteca','Abra o acervo liberado para você.');
  if(info.admin||info.areas.includes('studio'))link('estudio.html','HÆMA Estúdio · privado','Mapmaker e tela de projeção para mesas físicas. Acesso autorizado individualmente.');
  link('sistema.html','Sistema e ferramentas','Manual Vivo, simuladores, fichas e dados.');
  root.append(list,button('Atualizar acessos',init),button('Sair da conta',logout,'archive-link-button'));
 }catch(error){
  if(version!==generation||!root.isConnected)return;
  root.replaceChildren(node('h2','','Não foi possível consultar sua conta'),node('p','',error.message),button('Tentar novamente',init));
 }
}
document.addEventListener('haema:navigated',init);
document.addEventListener('haema:auth',init);
init();
