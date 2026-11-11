'use strict';
/** HÆMA seamless navigation. The Media Vita audio element remains alive while the
 * main content changes; old pages remain directly accessible to browsers/crawlers.
 */
(()=>{
 const routes=new Set(['','index.html','manual.html','portal.html','sistema.html','biblioteca.html','administracao.html','mesa.html','atualizacoes.html','campanha.html']);
 const main=document.querySelector('main#conteudo');
 if(!main||!window.fetch||!window.history?.pushState)return;
 let pending=null,sequence=0,viewTransition=null,revealObserver=null;
 const cache=new Map();
 history.scrollRestoration='manual';
 const currentKey=()=>location.pathname.split('/').pop()||'index.html';
 const canon=url=>url.pathname.split('/').pop()||'index.html';
 const allowed=url=>url.origin===location.origin&&routes.has(canon(url));
 const applyReveals=()=>{
  revealObserver?.disconnect();
  const els=document.querySelectorAll('main .reveal');
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion:reduce)').matches){
   els.forEach(el=>el.classList.add('is-visible'));return;
  }
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}
  },{threshold:.06});
  revealObserver=observer;
  els.forEach(el=>observer.observe(el));
 };
 const updateHeader=key=>{
  document.querySelectorAll('.nav a').forEach(link=>{
   const target=canon(new URL(link.href,location.href));
   const active=target===key||(['manual.html','mesa.html','atualizacoes.html'].includes(key)&&target==='sistema.html');
   if(active)link.setAttribute('aria-current','page');
   else link.removeAttribute('aria-current');
  });
  document.querySelectorAll('.section-nav a').forEach(link=>{
   const dest=new URL(link.href,location.href);
   if(canon(dest)===key&&dest.search===location.search&&!dest.hash)link.setAttribute('aria-current','page');
   else link.removeAttribute('aria-current');
  });
  const account=document.querySelector('.top-action');
  if(account){if(['portal.html','administracao.html','campanha.html'].includes(key))account.setAttribute('aria-current','page');else account.removeAttribute('aria-current');}
  const menu=document.getElementById('menu-toggle');
  const nav=document.getElementById('main-nav');
  if(menu)menu.setAttribute('aria-expanded','false');
  nav?.classList.remove('is-open');
 };
 const scrollToTarget=hash=>{
  if(!hash){window.scrollTo({top:0,left:0,behavior:'instant'});return;}
  let target=null;
  try{target=document.getElementById(decodeURIComponent(hash.slice(1)));}catch{}
  if(target){for(let el=target;el;el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;target.scrollIntoView({block:'start',behavior:'instant'});}
  else window.scrollTo({top:0,left:0,behavior:'instant'});
 };
 // Fetch-only navigation replaces <main> without reloading <head>. Synchronize
 // route-specific styles before showing the next page (notably portal.css).
 const styles=new Map();
 const syncPageStyles=async parsed=>{
  const links=[...parsed.querySelectorAll('head link[rel="stylesheet"][href]')];
  await Promise.all(links.map(source=>{
   const href=new URL(source.getAttribute('href'),location.href).href;
   if(new URL(href).origin!==location.origin)return;
   if(styles.has(href))return styles.get(href);
   if([...document.querySelectorAll('link[rel="stylesheet"]')].some(link=>link.href===href&&link.sheet))return;
   const link=document.createElement('link');link.rel='stylesheet';link.href=href;
   const promise=new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>fail(),8000);
    const fail=()=>{clearTimeout(timeout);styles.delete(href);link.remove();reject(Error('Stylesheet unavailable'));};
    link.onload=()=>{clearTimeout(timeout);resolve();};link.onerror=fail;
   });
   styles.set(href,promise);document.head.append(link);return promise;
  }));
  // Scoped styles remain loaded: an older navigation cannot remove a newer route's CSS.
 };
 const fetchPage=async(url,signal)=>{
  const key=url.pathname;
  if(cache.has(key))return cache.get(key);
  const response=await fetch(url.pathname,{signal,credentials:'same-origin',headers:{'X-Haema-Navigation':'1'}});
  if(!response.ok)throw new Error('Navigation HTTP '+response.status);
  const markup=await response.text();
  const next=new DOMParser().parseFromString(markup,'text/html');
  if(!next.querySelector('main#conteudo'))throw new Error('No HÆMA content');
  cache.set(key,markup);
  return markup;
 };
 async function navigate(url,changeHistory=true,scrollTarget=null){
  if(!allowed(url)){location.assign(url.href);return;}
  const request=++sequence;
  viewTransition?.skipTransition();
  if(pending)pending.abort();
  pending=new AbortController();
  let markup;
  try{markup=await fetchPage(url,pending.signal)}
  catch(error){
   if(request!==sequence)return;
   if(error.name==='AbortError')return;
   location.assign(url.href);return;
  }
  if(request!==sequence)return;
  const parsed=new DOMParser().parseFromString(markup,'text/html');
  const nextMain=parsed.querySelector('main#conteudo');
  if(!nextMain){location.assign(url.href);return;}
  try{await syncPageStyles(parsed)}catch{if(request===sequence)location.assign(url.href);return;}
  if(request!==sequence)return;
  const commit=()=>{
   if(request!==sequence)return;
  if(changeHistory){
   history.replaceState({...history.state,scrollY:window.scrollY},'',location.href);
   history.pushState({haema:true,scrollY:0},'',url.href);
  }

  // Preserve header, sound toggle, and the ORIGINAL <audio> instance.
  document.dispatchEvent(new Event('haema:leaving'));
  const existing=document.querySelector('main#conteudo');
  existing.replaceWith(document.importNode(nextMain,true));
  document.body.dataset.page=parsed.body.dataset.page||'';
  document.title=parsed.title||document.title;
  const description=parsed.querySelector('meta[name="description"]')?.content;
  if(description){const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=description;}
  updateHeader(canon(url));
  const heading=document.querySelector('main h1');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  document.dispatchEvent(new CustomEvent('haema:navigated',{detail:{path:canon(url)}}));
  applyReveals();
  if(request===sequence){
   if(scrollTarget!=null&&scrollTarget!==undefined&&scrollTarget!=='')window.scrollTo({top:scrollTarget,left:0,behavior:'instant'});
   else scrollToTarget(url.hash);
  }
  };
  if(document.startViewTransition&&!document.hidden&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
   viewTransition=document.startViewTransition(commit);
   await viewTransition.updateCallbackDone.catch(()=>{});
  }else commit();
 }
 document.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const target=event.target instanceof Element?event.target:null;
  const link=target?.closest('a[href]');
  if(!link||link.hasAttribute('download')||link.target&&link.target!=='_self')return;
  let url;try{url=new URL(link.href,location.href);}catch{return;}
  if(!allowed(url))return;
  if(url.pathname===location.pathname&&url.search===location.search&&url.hash){return;} // native anchor
  event.preventDefault();
  void navigate(url);
 });
 window.addEventListener('popstate',event=>{
  const url=new URL(location.href);
  void navigate(url,false,Number.isFinite(event.state?.scrollY)?event.state.scrollY:null);
 });
 updateHeader(currentKey());
})();
