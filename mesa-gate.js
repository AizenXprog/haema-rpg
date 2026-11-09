'use strict';
/** No ficha or rolador is sent to unauthenticated visitors. */
const root=document.getElementById('mesa-access');
function show(title,copy){if(!root)return;root.replaceChildren();const tag=document.createElement('p');tag.className='portal-overline';tag.textContent='MESA HÆMA · ACESSO RESTRITO';const h=document.createElement('h1');h.textContent=title;const p=document.createElement('p');p.textContent=copy;const a=document.createElement('a');a.href='portal.html';a.className='portal-action';a.textContent='Abrir Portal HÆMA';root.append(tag,h,p,a)}
(async()=>{
 try{
  const response=await fetch('/api/portal-config',{cache:'no-store'});
  const cfg=response.ok?await response.json():null;
  if(!cfg?.configured){show('Mesa privada.','O acesso Google ainda está sendo configurado. A Mesa permanecerá fechada até o mestre autorizar as contas.');return;}
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm');
  const client=createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user){show('Entre com Google.','A Mesa de Jogo não é pública. Entre no Portal e peça autorização ao mestre.');return;}
  const {data:{session}}=await client.auth.getSession();
  if(!session?.access_token){show('Sessão expirada.','Faça login novamente pelo Portal.');return;}
  const result=await fetch('/api/mesa',{headers:{Authorization:'Bearer '+session.access_token},cache:'no-store'});
  if(!result.ok){let reason='Acesso ainda não liberado. Peça autorização ao mestre.';try{const j=await result.json();reason=j.error||reason;}catch{}show('Mesa restrita.',reason);return;}
  const html=await result.text(),doc=new DOMParser().parseFromString(html,'text/html');
  const authorized=doc.querySelector('main#conteudo');
  if(!authorized||!authorized.querySelector('#attributes-v01'))throw Error('Conteúdo da Mesa não disponível.');
  document.querySelector('main#conteudo').replaceWith(document.importNode(authorized,true));
  if(typeof window.initHAEMA01==='function')window.initHAEMA01();
  if(typeof window.initExperience==='function')window.initExperience();
 }catch{show('Não foi possível abrir a Mesa.','Verifique sua conexão ou tente entrar novamente pelo Portal.');}
})();
