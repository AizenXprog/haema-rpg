import {access, client, accessGate, node, button, logout} from './auth.js';
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
  // The campaign's actual GM can open the private archive, not just platform administrators.
  let isCampaignMaster=!!info.admin;
  if(!isCampaignMaster&&info.areas.includes('portal')){
   const db=await client();
   const {data,error}=await db.from('haema_campaigns').select('id').eq('gm_id',info.user.id).limit(1);
   if(error)throw error;
   isCampaignMaster=Array.isArray(data)&&data.length>0;
  }
  if(version!==generation||!root.isConnected)return;
  // This replaces the old "Campanhas e registros" destination in the Portal.
  if(isCampaignMaster)link('campanha.html','Campanhas e registros · Área do Mestre','Arquivo técnico privado: jornadas, sessões, NPCs, Bestiário, encontros, pistas e anotações.');
  if(info.areas.includes('portal')){link('fichas.html?secao=characters','Fichas e mesa','Personagens, materiais liberados e conversa da campanha, separados do arquivo técnico.');
   link('arvore.html','Árvore de Habilidades · Experimental','Uma trilha conectada e permanente por personagem. Explore o mapa e acompanhe suas conquistas.');}
  if(info.admin)link('administracao.html','Central de Acessos','Visibilidade por pessoa e por livro, aprovação de contas e histórico de alterações.');
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
