'use strict';
// Navigation and unobtrusive desktop-only cursor. No game logic or legacy storage is accessed here.
(()=>{
 const menu=document.querySelector('#menu-toggle'),nav=document.querySelector('#main-nav');
 if(menu&&nav){
  const close=()=>{nav.classList.remove('is-open');menu.setAttribute('aria-expanded','false');};
  menu.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(open))});
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  document.addEventListener('click',e=>{if(!e.target.closest('.header-inner'))close()});
 }
 if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion:reduce)').matches){
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.06});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
 }else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('is-visible'));
})();
(()=>{
 const mq=matchMedia('(hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference)');
 if(!mq.matches)return;
 const cursor=document.createElement('div');cursor.className='haema-pointer';cursor.setAttribute('aria-hidden','true');
 cursor.innerHTML='<span class="haema-pointer-outer"></span><span class="haema-pointer-star">✦</span>';
 document.body.appendChild(cursor);document.documentElement.classList.add('cursor-ready');
 let active=false,hover=false,hidden=false;
 document.addEventListener('pointermove',e=>{
  if(e.pointerType!=='mouse')return;
  cursor.style.transform=`translate3d(${e.clientX}px,${e.clientY}px,0)`;
  if(!active){active=true;cursor.classList.add('is-visible')}
  const target=e.target instanceof Element?e.target:null;
  const h=!!target?.closest('input,textarea,select,[contenteditable="true"]');
  const over=!!target?.closest('a,button,summary,[role="button"]');
  if(h!==hidden){hidden=h;cursor.classList.toggle('is-hidden',hidden)}
  if(over!==hover){hover=over;cursor.classList.toggle('is-hovering',hover)}
 },{passive:true});
 document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')cursor.classList.add('is-pressed')},{passive:true});
 document.addEventListener('pointerup',()=>cursor.classList.remove('is-pressed'),{passive:true});
 document.addEventListener('pointercancel',()=>cursor.classList.remove('is-pressed'),{passive:true});
 document.addEventListener('mouseout',e=>{if(!e.relatedTarget){active=false;cursor.classList.remove('is-visible')}},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){active=false;cursor.classList.remove('is-visible')}},{passive:true});
 mq.addEventListener('change',e=>{cursor.classList.toggle('cursor-off',!e.matches);document.documentElement.classList.toggle('cursor-ready',e.matches)});
})();
