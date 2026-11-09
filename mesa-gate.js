import {authorizedFetch,access,accessGate,node} from './auth.js';
let epoch=0;
async function initMesa(){
 const initial=document.getElementById('mesa-access'),main=document.querySelector('main#conteudo');
 const request=++epoch;
 if(document.body.dataset.page!=='mesa'||!main)return;
 const root=initial||node('div','portal-setup');
 if(!initial){main.replaceChildren(root);}
 try{
  const permission=await access();
  if(request!==epoch||!main.isConnected)return;
  if(!permission.areas.includes('mesa')){accessGate(root,permission,'Mesa de Jogo');return;}
  const response=await authorizedFetch('/api/mesa');
  const doc=new DOMParser().parseFromString(await response.text(),'text/html');
  const content=doc.querySelector('main#conteudo');
  if(request!==epoch||!main.isConnected)return;
  if(!content?.querySelector('#attributes-v01'))throw Error('Mesa indisponível.');
  main.replaceWith(document.importNode(content,true));
  window.initHAEMA01?.();window.initExperience?.();
 }catch(error){if(request===epoch&&root.isConnected)root.replaceChildren(node('p','',error.message));}
}
document.addEventListener('haema:navigated',initMesa);
document.addEventListener('haema:auth',initMesa);
initMesa();
