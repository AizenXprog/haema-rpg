'use strict';
/** Media Vita — soundtrack shared by HÆMA's separate HTML pages.
 * Silent by default: the visitor alone chooses when music begins.
 * Keep the chosen playback alive across seamless in-site navigation.
 */
(()=>{
 const button=document.getElementById('haema-sound-toggle');
 if(!button)return;
 const label=document.getElementById('haema-sound-label');
 const source=document.documentElement.dataset.soundtrack||'';
 const audio=source?new Audio(source):null;
 // Every fresh page load begins silent. Only a direct click on the sound
 // control may opt the visitor in; navigation retains this live audio instance.
 const PLAYBACK='haema-music-playback-v1';
 const GAP_MS=30000;
 const VOLUME=.25;
 const read=(area,key)=>{try{return area.getItem(key)}catch{return null}};
 const write=(area,key,value)=>{try{area.setItem(key,value)}catch{}};
 let wanted=false;
 let position=0,gapUntil=0,seekDone=false,blocked=false,playing=false,suspendedByTrailer=false;
 let retryTimer=0,notificationTimer=0,lastCheckpoint=0,pending=null;
 let playAttempt=0,autoplayNoticeShown=false;
 let notice=null;

 if(audio){
  audio.loop=false;
  audio.volume=VOLUME;
  audio.preload='none';
  audio.autoplay=false;
  audio.playsInline=true;
 }
 const persist=(forcePosition)=>{
  if(!audio)return;
  const current=Number.isFinite(audio.currentTime)?audio.currentTime:0;
  const at=forcePosition===undefined?(gapUntil?0:Math.max(current,position)):forcePosition;
  write(sessionStorage,PLAYBACK,JSON.stringify({source,position:at,gapUntil,savedAt:Date.now()}));
 };
 const note=message=>{
  if(!notice){
   notice=document.createElement('div');
   notice.id='haema-audio-note';
   notice.className='audio-message';
   notice.setAttribute('role','status');
   document.body.append(notice);
  }
  notice.textContent=message;
  notice.hidden=false;
  if(notificationTimer)clearTimeout(notificationTimer);
  notificationTimer=setTimeout(()=>{notice.hidden=true},3800);
 };
 const paint=()=>{
  if(!label)return;
  const audible=!!audio&&wanted&&playing&&!suspendedByTrailer;
  label.textContent=!audio?'SOM INDISPONÍVEL':!wanted?'SOM DESLIGADO':suspendedByTrailer?'SOM PAUSADO':blocked?'TOQUE PARA OUVIR':audible||gapUntil>Date.now()?'DESLIGAR SOM':'SOM LIGADO';
  button.setAttribute('aria-pressed',String(wanted));
  const description=!audio?'Trilha sonora indisponível':
    !wanted?'Ativar música ambiente':
    suspendedByTrailer?'Música pausada durante o trailer':
    audible?'Desligar música ambiente':
    gapUntil>Date.now()?'Desligar música ambiente (pausa entre reproduções)':blocked?'Música ativa, mas o navegador exige uma interação para liberar o áudio':'Música ambiente ativada; desligar';
  button.setAttribute('aria-label',description);
  button.title=description;
  button.classList.toggle('sound-active',wanted);
 };
 const restore=()=>{
  if(!audio||seekDone||audio.readyState<1)return;
  seekDone=true;
  if(gapUntil>Date.now())return;
  if(Number.isFinite(audio.duration)&&position>=audio.duration-.3){
   position=0;
   gapUntil=Date.now()+GAP_MS;
   persist(0);
   return;
  }
  if(position>.1){
   try{audio.currentTime=position}catch{}
  }
 };
 const clearRestart=()=>{if(retryTimer)clearTimeout(retryTimer);retryTimer=0};
 const schedule=()=>{
  clearRestart();
  if(!wanted||!audio||gapUntil<=0)return;
  const delay=gapUntil-Date.now();
  if(delay<=0){gapUntil=0;position=0;persist(0);void start();return;}
  retryTimer=setTimeout(()=>{retryTimer=0;gapUntil=0;position=0;persist(0);void start()},delay);
  paint();
 };
 async function start(fromGesture=false){
  if(!audio||!wanted||suspendedByTrailer)return;
  if(gapUntil>Date.now()){schedule();return;}
  if(gapUntil){gapUntil=0;position=0;persist(0);}
  if(pending&&!fromGesture)return pending;
  restore();
  const attempt=++playAttempt;
  // play() is invoked synchronously within the interaction handler when
  // fromGesture is true. This is important for browser autoplay permissions.
  let playPromise;
  try{playPromise=audio.play();}
  catch(error){playPromise=Promise.reject(error);}
  const task=(async()=>{
   try{
    await playPromise;
    if(attempt!==playAttempt)return;
    if(!wanted){audio.pause();return;}
    playing=true;blocked=false;
    persist();paint();
   }catch{
    if(attempt!==playAttempt)return;
    playing=false;blocked=true;paint();
    if(!autoplayNoticeShown){
     autoplayNoticeShown=true;
     note('Seu navegador bloqueou o início automático. Toque em qualquer área do site para liberar a música.');
    }
   }finally{if(attempt===playAttempt)pending=null;}
  })();
  pending=task;
  return task;
 }
 const disable=()=>{
  wanted=false;blocked=false;playing=false;position=0;gapUntil=0;suspendedByTrailer=false;
  clearRestart();
  if(audio){audio.pause();try{audio.currentTime=0}catch{}}
   persist(0);
  paint();
 };
 document.addEventListener('haema:trailer-play',()=>{
  if(suspendedByTrailer)return;
  suspendedByTrailer=true;
  if(audio&&wanted){position=audio.currentTime;audio.pause();persist();}
  paint();
 });
 document.addEventListener('haema:trailer-stop',()=>{
  if(!suspendedByTrailer)return;
  suspendedByTrailer=false;
  paint();
  if(wanted&&!playing)void start();
 });
 button.addEventListener('click',()=>{
  if(!audio){note('A faixa de áudio não está disponível.');return;}
  if(wanted&&(playing||gapUntil>Date.now()||suspendedByTrailer)){
   disable();note('Música desligada.');return;
  }
  wanted=true;
   void start(true).then(()=>{
   if(playing)note('Música ativada. Use o botão no topo para desligar.');
   else if(wanted)note('Seu navegador exige uma interação para liberar o áudio.');
  });
 });
 if(audio){
  audio.addEventListener('loadedmetadata',restore);
  audio.addEventListener('playing',()=>{playing=true;blocked=false;paint()});
  audio.addEventListener('pause',()=>{playing=false;paint()});
  audio.addEventListener('timeupdate',()=>{
   if(!wanted||gapUntil)return;
   if(Date.now()-lastCheckpoint<1000)return;
   lastCheckpoint=Date.now();
   position=audio.currentTime;
   persist();
  });
  audio.addEventListener('ended',()=>{
   if(!wanted)return;
   playing=false;blocked=false;position=0;
   gapUntil=Date.now()+GAP_MS;
   persist(0);schedule();
  });
  audio.addEventListener('error',()=>{playing=false;blocked=true;paint();note('Não foi possível carregar a música ambiente.')});
  // Persist immediately before a regular full-page navigation.
  window.addEventListener('pagehide',()=>{if(wanted)persist()});
  // Resume when a tab or page comes back from the back/forward cache.
  window.addEventListener('pageshow',e=>{if(e.persisted&&wanted&&!playing)void start()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&wanted&&!playing&&!pending)void start()});
  // Browsers may block unmuted autoplay. Try again on any permitted user
  // gesture rather than requiring a click on the music control itself.
  const unlock=event=>{
   if(!wanted||!blocked||!audio.paused)return;
   const target=event.target;
   if(target instanceof Element&&target.closest('#haema-sound-toggle'))return;
   void start(true);
  };
  document.addEventListener('pointerdown',unlock,{passive:true,capture:true});
  document.addEventListener('touchstart',unlock,{passive:true,capture:true});
  document.addEventListener('click',unlock,{capture:true});
  document.addEventListener('keydown',unlock,{capture:true});
 }
 paint(); // No automatic play attempt. The listener above is the sole opt-in entry.
})();
