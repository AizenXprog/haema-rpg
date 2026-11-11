'use strict';
/* Galeria do lobby: um único player por vez. Funciona também após navegação suave. */
(() => {
  const trailers = {
    '1': {id:'1jqIK68bmbo',title:'Trailer I',index:'01'},
    '2': {id:'3TnG60ywgFQ',title:'Trailer II',index:'02'}
  };
  let currentPlayer = null;
  let playerElement = null;
  let youtubeLoader = null;
  let generation = 0;
  const emit = (name) => document.dispatchEvent(new Event(name));
  const root = () => document.querySelector('[data-trailer-gallery]');
  const loadYT = () => {
    if(window.YT && window.YT.Player)return Promise.resolve();
    if(youtubeLoader)return youtubeLoader;
    youtubeLoader = new Promise(resolve => {
      const prior=window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady=()=>{if(typeof prior==='function')prior();resolve();};
      const script=document.createElement('script');
      script.src='https://www.youtube.com/iframe_api';
      script.async=true;
      script.onerror=()=>resolve();
      document.head.appendChild(script);
    });
    return youtubeLoader;
  };
  const stop = () => {
    generation++;
    if(currentPlayer){try{currentPlayer.destroy()}catch{}}
    currentPlayer=null;
    if(playerElement){try{playerElement.remove()}catch{}}
    playerElement=null;
    emit('haema:trailer-stop');
    const close=root()?.querySelector('[data-trailer-close]');
    if(close)close.hidden=true;
  };
  const choose = (choice) => {
    const gallery=root();
    const t=trailers[choice];
    if(!gallery||!t)return;
    stop();
    gallery.dataset.active=choice;
    gallery.querySelectorAll('[data-trailer-select]').forEach(btn=>{
      const active=btn.dataset.trailerSelect===choice;
      btn.classList.toggle('is-selected',active);
      btn.setAttribute('aria-pressed',String(active));
    });
    const screen=gallery.querySelector('[data-trailer-screen]');
    if(!screen)return;
    const poster=document.createElement('div');
    poster.className='haema-trailer__poster';
    const img=document.createElement('img');
    img.src='https://i.ytimg.com/vi/'+t.id+'/hqdefault.jpg';
    img.alt='';
    img.loading='lazy';
    const inner=document.createElement('div');
    inner.className='haema-trailer__poster-content';
    const marker=document.createElement('span');
    marker.textContent='HÆMA · REGISTRO '+t.index;
    const button=document.createElement('button');
    button.type='button';
    button.className='haema-trailer__play';
    button.setAttribute('data-trailer-play','');
    button.setAttribute('aria-label','Reproduzir '+t.title);
    button.textContent='▶  REPRODUZIR TRAILER';
    const hint=document.createElement('small');
    hint.textContent='O PLAYER SERÁ ABERTO APÓS O CLIQUE';
    inner.append(marker,button,hint);
    poster.append(img,inner);
    screen.replaceChildren(poster);
    const external=document.querySelector('[data-trailer-youtube]');
    if(external)external.href='https://www.youtube.com/watch?v='+t.id;
    const caption=gallery.querySelector('[data-trailer-caption]');
    if(caption)caption.textContent=t.title.toUpperCase()+' · '+t.index+' / 02';
  };
  const play = () => {
    const gallery=root();
    if(!gallery)return;
    const t=trailers[gallery.dataset.active];
    if(!t)return;
    stop();
    emit('haema:trailer-play');
    const token=++generation;
    const screen=gallery.querySelector('[data-trailer-screen]');
    const frame=document.createElement('iframe');
    frame.title='HÆMA — '+t.title+' no YouTube';
    frame.src='https://www.youtube-nocookie.com/embed/'+t.id+'?rel=0&playsinline=1&autoplay=1&enablejsapi=1&origin='+encodeURIComponent(location.origin);
    frame.referrerPolicy='strict-origin-when-cross-origin';
    frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen=true;
    playerElement=frame;
    screen.replaceChildren(frame);
    const close=gallery.querySelector('[data-trailer-close]');
    if(close)close.hidden=false;
    void loadYT().then(()=>{
      if(token!==generation||!frame.isConnected||!window.YT?.Player)return;
      try{
        currentPlayer=new window.YT.Player(frame,{events:{
          onStateChange:event=>{
            if(token!==generation)return;
            if(event.data===window.YT.PlayerState.PLAYING)emit('haema:trailer-play');
            if(event.data===window.YT.PlayerState.PAUSED||event.data===window.YT.PlayerState.ENDED)emit('haema:trailer-stop');
          }
        }});
      }catch{}
    });
  };
  document.addEventListener('click',event=>{
    const el=event.target instanceof Element?event.target:null;
    const selected=el?.closest('[data-trailer-select]');
    if(selected){choose(selected.dataset.trailerSelect);return;}
    if(el?.closest('[data-trailer-play]')){play();return;}
    if(el?.closest('[data-trailer-close]')){const active=root()?.dataset.active||'1';choose(active);}
  });
  document.addEventListener('haema:leaving',stop);
  document.addEventListener('haema:navigated',()=>{if(root())choose(root().dataset.active||'1');else stop();});
  window.addEventListener('pagehide',stop);
})();
