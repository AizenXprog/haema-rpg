'use strict';
// Two-trailer gallery. The YouTube iframe is created only after a visitor's click.
// One player at a time; leave/reselect/close destroys playback immediately.
(()=>{
 const CATALOG={
  '1jqIK68bmbo':{number:'01',title:'O primeiro olhar'},
  '3TnG60ywgFQ':{number:'02',title:'O segundo registro'}
 };
 let dispose=()=>{};
 const emit=active=>document.dispatchEvent(new CustomEvent('haema:video-activity',{detail:{active}}));
 const init=()=>{
  dispose();
  const gallery=document.querySelector('[data-trailer-gallery]');
  if(!gallery)return;
  const stage=gallery.querySelector('[data-trailer-stage]');
  const caption=gallery.querySelector('[data-trailer-caption]');
  const external=gallery.querySelector('[data-trailer-external]');
  const feedback=gallery.querySelector('[data-trailer-feedback]');
  if(!stage||!caption||!external||!feedback)return;
  const controller=new AbortController();
  let selected='1jqIK68bmbo',playing=false;
  const buttons=[...gallery.querySelectorAll('[data-trailer-choice]')];
  const draw=()=>{
   const item=CATALOG[selected];
   stage.replaceChildren();
   const poster=document.createElement('div');
   poster.className='haema-cinema__poster';
   poster.style.setProperty('--poster', "url('https://i.ytimg.com/vi/"+selected+"/hqdefault.jpg')");
   const shade=document.createElement('div');shade.className='haema-cinema__shade';
   const reel=document.createElement('span');reel.className='haema-cinema__reel';reel.textContent='TRAILER OFICIAL · '+item.number;
   const play=document.createElement('button');play.type='button';play.className='haema-cinema__play';
   play.setAttribute('data-trailer-start','');play.setAttribute('aria-label','Reproduzir trailer '+item.number);
   play.innerHTML='<span aria-hidden="true">▶</span> REPRODUZIR';
   const notice=document.createElement('span');notice.className='haema-cinema__poster-note';notice.textContent='O vídeo só inicia depois do seu comando';
   shade.append(reel,play,notice);poster.append(shade);stage.append(poster);
   caption.replaceChildren(document.createTextNode('TRAILER '+item.number+' '));
   const title=document.createElement('strong');title.textContent='· '+item.title.toUpperCase();caption.append(title);
   external.href='https://www.youtube.com/watch?v='+selected;
   external.setAttribute('aria-label','Assistir trailer '+item.number+' no YouTube em nova aba');
   buttons.forEach(button=>{
    const active=button.dataset.trailerChoice===selected;
    button.classList.toggle('is-selected',active);
    button.setAttribute('aria-pressed',String(active));
    const state=button.querySelector('.haema-cinema__choice-text em');if(state)state.textContent=active?'Selecionado':'Selecionar';
   });
  };
  const close=()=>{
   if(playing){playing=false;emit(false);}
   draw();
   feedback.textContent='Player fechado. Você pode selecionar outro trailer.';
  };
  const start=()=>{
   if(playing)return;
   const item=CATALOG[selected];
   if(!item)return;
   // Suspend HÆMA's music BEFORE loading any YouTube player.
   playing=true;emit(true);
   const frame=document.createElement('iframe');
   frame.title='Trailer '+item.number+' — HÆMA no YouTube';
   frame.setAttribute('allow','accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share');
   frame.setAttribute('allowfullscreen','');
   frame.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
   frame.src='https://www.youtube-nocookie.com/embed/'+selected+'?autoplay=1&playsinline=1&rel=0';
   const closeButton=document.createElement('button');closeButton.className='haema-cinema__close';
   closeButton.type='button';closeButton.textContent='FECHAR PLAYER ×';closeButton.setAttribute('data-trailer-close','');
   stage.replaceChildren(frame,closeButton);
   feedback.textContent='Trailer '+item.number+' aberto. Feche o player para retomar a música ambiente.';
  };
  gallery.addEventListener('click',event=>{
   const control=event.target.closest('[data-trailer-choice],[data-trailer-start],[data-trailer-close]');
   if(!control||!gallery.contains(control))return;
   if(control.hasAttribute('data-trailer-choice')){
    const choice=control.dataset.trailerChoice;
    if(!(choice in CATALOG))return;
    if(playing){playing=false;emit(false);}
    selected=choice;draw();
    feedback.textContent='Trailer '+CATALOG[selected].number+' selecionado. Pressione reproduzir.';
   }else if(control.hasAttribute('data-trailer-start'))start();
   else if(control.hasAttribute('data-trailer-close'))close();
  },{signal:controller.signal});
  dispose=()=>{controller.abort();if(playing){playing=false;emit(false);}dispose=()=>{};};
  // The initial poster exists in server HTML for static rendering.
 };
 document.addEventListener('haema:navigated',init);
 document.addEventListener('haema:leaving',()=>dispose());
 window.addEventListener('pagehide',()=>dispose());
 init();
})();
