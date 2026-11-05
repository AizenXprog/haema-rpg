'use strict';
/** User-controlled soundtrack: Media Vita, audio optimized from the file provided by the project creator. */
(()=>{
 const button=document.getElementById('haema-sound-toggle');if(!button)return;
 const label=document.getElementById('haema-sound-label');
 const SOURCE=document.documentElement.dataset.soundtrack||'';
 const audio=SOURCE?new Audio(SOURCE):null;
 let enabled=false,interval=null,noteTimer=null;
 const LOW_VOLUME=.25,REPEAT_GAP_MS=30000;
 if(audio){audio.loop=false;audio.preload='none';audio.volume=LOW_VOLUME;}
 const notify=message=>{
  let note=document.getElementById('haema-audio-note');
  if(!note){note=document.createElement('div');note.id='haema-audio-note';note.className='audio-message';note.setAttribute('role','status');document.body.append(note)}
  note.textContent=message;note.hidden=false;if(noteTimer)clearTimeout(noteTimer);noteTimer=setTimeout(()=>{note.hidden=true},3800);
 };
 const paint=()=>{
  label.textContent=enabled?'DESLIGAR SOM':'SOM DESLIGADO';
  button.setAttribute('aria-pressed',String(enabled));
  button.setAttribute('aria-label',enabled?'Desligar música ambiente':'Ativar música ambiente');
  button.title=enabled?'Desligar música ambiente':'Ativar música ambiente';
  button.classList.toggle('sound-active',enabled);
 };
 const stop=()=>{enabled=false;if(interval)clearTimeout(interval);interval=null;if(audio){audio.pause();audio.currentTime=0}try{localStorage.setItem('haema-music-enabled','false')}catch{}paint()};
 button.addEventListener('click',async()=>{
  if(enabled){stop();notify('Música desligada.');return;}
  if(!audio){notify('A faixa de música ainda não foi enviada para o HÆMA.');return;}
  try{
   // The playback request is made inside a direct user gesture (autoplay policies).
   await audio.play();enabled=true;try{localStorage.setItem('haema-music-enabled','true')}catch{}
   paint();notify('Música ativada. Use o botão no topo para desligar.');
  }catch{enabled=false;paint();notify('Toque em Ativar som para permitir a reprodução neste navegador.');}
 });
 if(audio){
  audio.addEventListener('ended',()=>{
   if(!enabled)return;
   if(interval)clearTimeout(interval);
   label.textContent='PAUSA · 30S';
   interval=setTimeout(async()=>{interval=null;if(!enabled)return;audio.currentTime=0;try{await audio.play();paint()}catch{stop();notify('O navegador precisa de um novo toque para reproduzir o áudio.')}},REPEAT_GAP_MS);
  });
  audio.addEventListener('error',()=>{stop();notify('Não foi possível abrir a faixa de áudio.');});
 }
 paint();
})();
