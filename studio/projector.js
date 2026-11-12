// Read-only projection. No authenticated project data, controls or master state are transferred.
const screen=document.getElementById('projection-canvas'),ctx=screen.getContext('2d'),idle=document.getElementById('projection-idle');
const token=location.hash.slice(1),valid=/^[a-f0-9]{40}$/i.test(token);
let image=null,last=0,ready=false;
function render(){
 const dpr=Math.min(devicePixelRatio||1,2),w=innerWidth,h=innerHeight;
 screen.width=Math.max(1,Math.round(w*dpr));screen.height=Math.max(1,Math.round(h*dpr));
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#050607';ctx.fillRect(0,0,w,h);
 if(!image)return;
 const scale=Math.min(w/image.naturalWidth,h/image.naturalHeight),width=image.naturalWidth*scale,height=image.naturalHeight*scale;
 ctx.drawImage(image,(w-width)/2,(h-height)/2,width,height);
}
window.addEventListener('resize',render);
document.getElementById('projection-fullscreen').addEventListener('click',()=>{
 if(document.fullscreenElement)document.exitFullscreen();
 else document.documentElement.requestFullscreen?.();
});
if(valid&&'BroadcastChannel' in window){
 const channel=new BroadcastChannel('haema-studio-'+token);
 const greet=()=>{if(!ready)channel.postMessage({type:'ready'});};
 channel.onmessage=event=>{
  const data=event.data;
  if(data?.type==='blackout'){image=null;idle.hidden=false;idle.querySelector('h1').textContent='Cena ocultada pelo mestre';render();return;}
  if(data?.type!=='frame'||typeof data.image!=='string'||!/^data:image\/webp;base64,/.test(data.image)||data.image.length>15000000)return;
  const index=++last,img=new Image();
  img.onload=()=>{if(index!==last)return;image=img;ready=true;idle.hidden=true;render();};
  img.src=data.image;
 };
 greet();
 setInterval(greet,1200);
 window.addEventListener('pagehide',()=>channel.close());
}else{
 idle.querySelector('h1').textContent='Projeção indisponível';
 idle.querySelector('p').textContent='Abra esta tela usando o botão dentro do Estúdio.';
}
render();