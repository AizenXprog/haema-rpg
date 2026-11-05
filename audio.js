'use strict';
/** Media Vita — soundtrack shared by HÆMA's separate HTML pages.
 * Autoplay is attempted, but a browser may require the first user gesture.
 * We restore the playhead and the 30-second replay gap across navigation.
 */
(()=>{
 const button=document.getElementById('haema-sound-toggle');
 if(!button)return;
 const label=document.getElementById('haema-sound-label');
 const source=document.documentElement.dataset.soundtrack||'';
 const audio=source?new Audio(source):null;
 const PREFERENCE='haema-music-enabled';
 const PLAYBACK='haema-music-playback-v1';
 const GAP_MS=30000;
 const VOLUME=.25;
 const read=(area,key)=>{try{return area.getItem(key)}catch{return null}};
 const write=(area,key,value)=>{try{area.setItem(key,value)}catch{}};
 let wanted=read(localStorage,PREFERENCE)!=='false';
 let position=0,gapUntil=0,seekDone=false,blocked=false,playing=false;
 let retryTimer=0,notificationTimer=0,lastCheckpoint=0,pending=null;
 let notice=null;
 try{
  const saved=JSON.parse(read(sessionStorage,PLAYBACK)||'null');
  if(saved&&saved.source===source){
   position=Math.max(0,Number(saved.position)||0);
   gapUntil=Math.max(0,Number(saved.gapUntil)||0);
  }
 }catch{}
 if(audio){
  audio.loop=false;
  audio.volume=VOLUME;
  audio.preload='metadata';
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
  const audible=!!audio&&wanted&&playing;
  label.textContent=!audio?'SOM INDISPONÍVEL':!wanted?'SOM DESLIGADO':audible||gapUntil>Date.now()?'DESLIGAR SOM':'ATIVAR SOM';
  button.setAttribute('aria-pressed',String(audible));
  const description=!audio?'Trilha sonora indisponível':
    !wanted?'Ativar música ambiente':
    audible?'Desligar música ambiente':
    gapUntil>Date.now()?'Desligar música ambiente (pausa entre reproduções)':'Ativar música ambiente';
  button.setAttribute('aria-label',description);
  button.title=description;
  button.classList.toggle('sound-active',audible);
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
 async function start(){
  if(!audio||!wanted)return;
  if(gapUntil>Date.now()){schedule();return;}
  if(gapUntil){gapUntil=0;position=0;persist(0);}
  if(pending)return pending;
  restore();
  pending=(async()=>{
   try{
    await audio.play();
    if(!wanted){audio.pause();return;}
    playing=true;blocked=false;
    persist();
    paint();
   }catch{
    playing=false;blocked=true;
    paint(); // A click or key press will be needed when autoplay is blocked.
   }finally{pending=null;}
  })();
  return pending;
 }
 const disable=()=>{
  wanted=false;blocked=false;playing=false;position=0;gapUntil=0;
  clearRestart();
  if(audio){audio.pause();try{audio.currentTime=0}catch{}}
  write(localStorage,PREFERENCE,'false');
  persist(0);
  paint();
 };
 button.addEventListener('click',()=>{
  if(!audio){note('A faixa de áudio não está disponível.');return;}
  if(wanted&&(playing||gapUntil>Date.now())){
   disable();note('Música desligada.');return;
  }
  wanted=true;
  write(localStorage,PREFERENCE,'true');
  void start().then(()=>{
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
  // Chrome/Safari/Firefox may block unmuted autoplay until a user gesture.
  // Ignore the toggle itself, which has explicit click handling.
  const unlock=event=>{
   if(!wanted||!blocked||!audio.paused)return;
   const target=event.target;
   if(target instanceof Element&&target.closest('#haema-sound-toggle'))return;
   void start();
  };
  document.addEventListener('pointerdown',unlock,{passive:true,capture:true});
  document.addEventListener('keydown',unlock,{capture:true});
 }
 paint();
 if(wanted&&audio){
  if(gapUntil>Date.now())schedule();
  else void start(); // Attempt automatically as requested; gracefully fall back.
 }
})();
