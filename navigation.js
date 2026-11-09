'use strict';
/** HÆMA seamless navigation. The Media Vita audio element remains alive while the
 * main content changes; old pages remain directly accessible to browsers/crawlers.
 */
(()=>{
 const routes=new Set(['','index.html','manual.html','portal.html']);
 const main=document.querySelector('main#conteudo');
 if(!main||!window.fetch||!window.history?.pushState)return;
 let pending=null,sequence=0;
 const cache=new Map();
 const currentKey=()=>location.pathname.split('/').pop()||'index.html';
 const canon=url=>url.pathname.split('/').pop()||'index.html';
 const allowed=url=>url.origin===location.origin&&routes.has(canon(url));
 const applyReveals=()=>{
  const els=document.querySelectorAll('main .reveal');
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion:reduce)').matches){
   els.forEach(el=>el.classList.add('is-visible'));return;
  }
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}
  },{threshold:.06});
  els.forEach(el=>observer.observe(el));
 };
 const updateHeader=key=>{
  document.querySelectorAll('.nav a').forEach(link=>{
   const active=canon(new URL(link.href,location.href))===key;
   if(active)link.setAttribute('aria-current','page');
   else link.removeAttribute('aria-current');
  });
  const menu=document.getElementById('menu-toggle');
  const nav=document.getElementById('main-nav');
  if(menu)menu.setAttribute('aria-expanded','false');
  nav?.classList.remove('is-open');
 };
 const scrollToTarget=hash=>{
  if(!hash){window.scrollTo({top:0,left:0,behavior:'instant'});return;}
  let target=null;
  try{target=document.getElementById(decodeURIComponent(hash.slice(1)));}catch{}
  if(target){if(target.tagName==='DETAILS')target.open=true;target.scrollIntoView({block:'start',behavior:'instant'});}
  else window.scrollTo({top:0,left:0,behavior:'instant'});
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
  if(changeHistory){
   history.replaceState({...history.state,scrollY:window.scrollY},'',location.href);
   history.pushState({haema:true,scrollY:0},'',url.href);
  }
  // Preserve header, sound toggle, and the ORIGINAL <audio> instance.
  const existing=document.querySelector('main#conteudo');
  existing.replaceWith(document.importNode(nextMain,true));
  document.body.dataset.page=parsed.body.dataset.page||'';
  document.title=parsed.title||document.title;
  const description=parsed.querySelector('meta[name="description"]')?.content;
  if(description){const meta=document.querySelector('meta[name="description"]');if(meta)meta.content=description;}
  updateHeader(canon(url));
  document.dispatchEvent(new CustomEvent('haema:navigated',{detail:{path:canon(url)}}));
  applyReveals();
  requestAnimationFrame(()=>{
   if(request!==sequence)return;
   if(scrollTarget!=null&&scrollTarget!==undefined&&scrollTarget!=='')window.scrollTo({top:scrollTarget,left:0,behavior:'instant'});
   else scrollToTarget(url.hash);
  });
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
})();