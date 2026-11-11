'use strict';
/* Presentation controller: no authentication, storage, random rolls or content requests. */
(()=>{
 const doc=document.documentElement;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const pointer=matchMedia('(hover: hover) and (pointer: fine)');
 const narrow=matchMedia('(max-width:760px)');
 let dispose=()=>{},quality=null,sampleFrame=0,sampleCount=0,slow=0,last=0;
 const constrained=()=>reduced.matches||narrow.matches||navigator.connection?.saveData||
  (navigator.deviceMemory&&navigator.deviceMemory<4)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=4);
 function setQuality(){
  quality=constrained()?'quiet':'full';
  doc.dataset.cinemaQuality=quality;
 }
 function sample(now){
  if(document.hidden){sampleFrame=0;return;}
  if(last&&now-last>40)slow++;
  last=now;
  if(++sampleCount<24)sampleFrame=requestAnimationFrame(sample);
  else{sampleFrame=0;if(slow>8){quality='quiet';doc.dataset.cinemaQuality=quality;}}
 }
 function init(){
  dispose();
  const main=document.getElementById('conteudo');if(!main)return;
  const controller=new AbortController(),signal=controller.signal,animations=new Set();
  const observers=[];let pointerFrame=0,coords=null;
  const play=(element,frames,options={})=>{
   if(reduced.matches||!element?.animate||document.hidden)return;
   const animation=element.animate(frames,{duration:500,easing:'cubic-bezier(.2,.75,.2,1)',...options});
   animations.add(animation);
   animation.finished.catch(()=>{}).finally(()=>animations.delete(animation));
  };
  const heading=main.querySelector('h1');
  if(heading)play(heading,[{transform:'translateY(15px)',clipPath:'inset(0 0 90%)'},{transform:'none',clipPath:'inset(0)'}],{duration:650});
  const hero=main.querySelector('.home-hero');
  if(hero&&pointer.matches&&!constrained()){
   hero.addEventListener('pointermove',event=>{
    if(quality!=='full'||event.pointerType!=='mouse')return;
    const rect=hero.getBoundingClientRect();
    coords={x:(event.clientX-rect.left-rect.width/2)*.012,y:(event.clientY-rect.top-Math.min(rect.height,900)/2)*.009};
    if(!pointerFrame)pointerFrame=requestAnimationFrame(()=>{
     pointerFrame=0;if(!coords||!hero.isConnected||quality!=='full')return;
     hero.style.setProperty('--light-x',Math.max(-9,Math.min(9,coords.x))+'px');
     hero.style.setProperty('--light-y',Math.max(-6,Math.min(6,coords.y))+'px');
    });
   },{signal,passive:true});
   hero.addEventListener('pointerleave',()=>{coords=null;hero.style.setProperty('--light-x','0px');hero.style.setProperty('--light-y','0px');},{signal,passive:true});
  }
  // A chapter selector also exposes the full index on small screens, without copying rules.
  const chapters=[...main.querySelectorAll('.manual-chapter[id]')];
  const search=main.querySelector('.manual-search-bar');
  if(chapters.length&&search){
   const toolbar=document.createElement('div');toolbar.className='cinema-reader-tools';
   const label=document.createElement('label');label.htmlFor='cinema-chapter';label.textContent='IR PARA UM CAPÍTULO';
   const select=document.createElement('select');select.id='cinema-chapter';
   const first=new Option('Escolha no índice…','');select.append(first);
   for(const chapter of chapters){
    const title=chapter.querySelector('summary')?.textContent.replace(/^(\d{2})(?=\S)/,'$1 · ').replace(/\s+/g,' ').replace(/\+\s*$/,'').trim()||chapter.id;
    select.append(new Option(title,chapter.id));
   }
   toolbar.append(label,select);search.after(toolbar);
   select.addEventListener('change',()=>{
    const target=document.getElementById(select.value);if(!target)return;
    target.open=true;target.scrollIntoView({block:'start',behavior:reduced.matches?'instant':'smooth'});
    const summary=target.querySelector('summary');summary?.focus({preventScroll:true});
   },{signal});
   const line=document.createElement('div');line.className='cinema-reading-line';line.setAttribute('aria-hidden','true');line.append(document.createElement('span'));main.append(line);
   if('IntersectionObserver' in window){
    const visible=new Set();
    const io=new IntersectionObserver(entries=>{
     for(const entry of entries){if(entry.isIntersecting)visible.add(entry.target);else visible.delete(entry.target);}
     const ordered=chapters.filter(ch=>visible.has(ch));if(!ordered.length)return;
     const current=ordered[0],index=chapters.indexOf(current);
     line.style.setProperty('--chapter-progress',String((index+1)/chapters.length));
     for(const link of main.querySelectorAll('.manual-index-link')){
      if(link.hash==='#'+current.id)link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
     }
    },{rootMargin:'-15% 0px -55% 0px',threshold:0});
    chapters.forEach(ch=>io.observe(ch));observers.push(io);
   }
  }
  main.addEventListener('click',event=>{
   const a=event.target.closest?.('a[href]');if(!a)return;
   const url=new URL(a.href,location.href);
   if(url.pathname!==location.pathname||!url.hash)return;
   let target;try{target=document.getElementById(decodeURIComponent(url.hash.slice(1)));}catch{return;}
   for(let el=target;el&&el!==main;el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;
  },{signal});
  // These animations consume the existing demonstration output; results remain untouched.
  document.addEventListener('haema:demonstrate',event=>{
   const stageId={test:'visual-lab-test',combat:'visual-lab-combat',metus:'visual-lab-metus',latebra:'visual-lab-latebra'}[event.detail?.kind];
   const stage=stageId&&document.getElementById(stageId);if(!stage)return;
   const dice=[...stage.querySelectorAll('.visual-die-shell')];
   dice.forEach((die,i)=>play(die,[{transform:'translateY(-10px) rotate(-8deg) scale(.92)'},{transform:'translateY(2px) rotate(2deg) scale(1.02)',offset:.7},{transform:'none'}],{duration:440,delay:quality==='quiet'?0:i*55}));
   play(stage,[{boxShadow:'inset 3px 0 #c7a67d',backgroundColor:'#77304930'},{boxShadow:'inset 0px 0 transparent',backgroundColor:'#08070b66'}],{duration:650});
  },{signal});
  main.addEventListener('change',event=>{
   if(!event.target.matches('input,select,textarea')||event.target.closest('.book-reader'))return;
   play(event.target,[{outline:'1px solid #d0ae80',outlineOffset:'1px'},{outline:'1px solid transparent',outlineOffset:'5px'}],{duration:420});
  },{signal});
  dispose=()=>{
   controller.abort();if(pointerFrame)cancelAnimationFrame(pointerFrame);
   observers.forEach(o=>o.disconnect());animations.forEach(a=>a.cancel());animations.clear();
   main.querySelector('.cinema-reader-tools')?.remove();main.querySelector('.cinema-reading-line')?.remove();
  };
 }
 setQuality();
 if(quality==='full')sampleFrame=requestAnimationFrame(sample);
 document.addEventListener('haema:leaving',()=>dispose());
 document.addEventListener('haema:navigated',init);
 const preferenceChanged=()=>{setQuality();init();};
 reduced.addEventListener('change',preferenceChanged);
 pointer.addEventListener('change',preferenceChanged);
 narrow.addEventListener('change',preferenceChanged);
 navigator.connection?.addEventListener?.('change',preferenceChanged);
 document.addEventListener('visibilitychange',()=>{
  doc.toggleAttribute('data-cinema-paused',document.hidden);
  if(document.hidden&&sampleFrame){cancelAnimationFrame(sampleFrame);sampleFrame=0;}
 });
 window.addEventListener('pagehide',()=>{dispose();if(sampleFrame)cancelAnimationFrame(sampleFrame);});
 window.addEventListener('pageshow',event=>{if(event.persisted)init();});
 init();
})();
