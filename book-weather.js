// One bounded simulation per open volume. No narrative data, network or storage.
export function createBookWeather(root,theme){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),small=matchMedia('(max-width:720px)');
 const connection=navigator.connection;
 let disposed=false,frame=0,last=0,time=0,width=1,height=1,gust=0,chapter=0,intensity=1,target=1,slow=0,samples=0;
 let quiet=small.matches||connection?.saveData||navigator.deviceMemory<4||navigator.hardwareConcurrency<=4;
 const canvases=[...root.querySelectorAll('canvas')],contexts=canvases.map(c=>c.getContext('2d'));
 if(contexts.some(c=>!c)){root.classList.add('weather-still');return {turn(index){root.dataset.chapter=String(index)},dispose(){}};}
 const particles=[];const fragments=[];const random=(a,b)=>a+Math.random()*(b-a);
 const count=()=>reduced.matches?36:quiet?95:230;
 const newParticle=()=>({x:random(0,width),y:random(-height*.2,height),z:random(.15,1),phase:random(0,Math.PI*2),speed:random(.7,1.4),crystal:Math.random()<.15});
 let paperRect={left:0,right:0,top:0,bottom:0};
 function resize(){
  width=root.clientWidth;height=root.clientHeight;const dpr=Math.min(devicePixelRatio||1,quiet?1.25:1.75);
  canvases.forEach((c,i)=>{c.width=Math.round(width*dpr);c.height=Math.round(height*dpr);contexts[i].setTransform(dpr,0,0,dpr,0,0)});
  const r=root.getBoundingClientRect(),p=root.querySelector('.volume-sheet')?.getBoundingClientRect();
  if(p)paperRect={left:p.left-r.left+16,right:p.right-r.left-16,top:p.top-r.top+16,bottom:p.bottom-r.top-16};
  particles.length=0;for(let i=0;i<count();i++)particles.push(newParticle());draw(0);
 }
 function draw(dt){
  time+=dt;gust*=Math.exp(-dt*1.7);intensity+=(target-intensity)*Math.min(1,dt*.7);
  const storm=Math.pow(Math.max(0,Math.sin(time*.13+.7)),10),wind=Math.sin(time*.27)*12+Math.sin(time*.071)*25+gust*130+storm*65;
  contexts.forEach(c=>c.clearRect(0,0,width,height));
  for(const p of particles){
   const near=p.z>.55,ctx=contexts[near?1:0],depth=.35+p.z;
   if(theme==='frikten'){
    p.x+=(wind+Math.sin(time*.8+p.phase)*17)*depth*dt*intensity;
    p.y+=(10+p.z*34)*p.speed*dt*intensity;
   }else{
    const vortex=Math.sin(time*.33+p.phase)*storm;
    p.x+=(32+wind+p.z*55+vortex*60)*dt*p.speed;
    p.y+=(Math.sin(time*.6+p.phase)*10-vortex*36-gust*14)*dt*depth;
   }
   if(p.y>height+12)p.y=-12;if(p.y< -30)p.y=height+10;
   if(p.x>width+20)p.x=-20;if(p.x< -25)p.x=width+15;
   // Near particles surround the physical sheet, never cover its text or controls.
   if(near&&p.x>paperRect.left&&p.x<paperRect.right&&p.y>paperRect.top&&p.y<paperRect.bottom)continue;
   ctx.globalAlpha=(theme==='frikten'?.22:.16)+p.z*.42;
   ctx.fillStyle=theme==='frikten'?'#dfedf0':['#cfa45f','#aa6842','#e2c58b','#8e4d2e'][Math.floor(p.phase)%4];
   const radius=theme==='frikten'?.45+p.z*2.1:.3+p.z*.9;
   ctx.beginPath();ctx.ellipse(p.x,p.y,radius,radius*(theme==='frikten'?.8:.45),p.phase,0,Math.PI*2);ctx.fill();
   if(theme==='frikten'&&p.crystal&&near){ctx.strokeStyle='#cee6ea';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(p.x-3,p.y);ctx.lineTo(p.x+3,p.y);ctx.moveTo(p.x,p.y-3);ctx.lineTo(p.x,p.y+3);ctx.stroke();}
  }
  for(let i=fragments.length-1;i>=0;i--){
   const p=fragments[i];p.life-=dt;if(p.life<=0){fragments.splice(i,1);continue;}
   p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=12*dt;
   if(p.x>paperRect.left&&p.x<paperRect.right&&p.y>paperRect.top&&p.y<paperRect.bottom)continue;
   const c=contexts[1];c.globalAlpha=Math.min(.7,p.life);c.fillStyle=theme==='frikten'?'#d6edf2':'#d6ad6f';
   c.save();c.translate(p.x,p.y);c.rotate(p.life*2);c.fillRect(-1,-2,2,4);c.restore();
  }
  root.style.setProperty('--weather-force',String(Math.min(.7,.13+storm*.25+Math.abs(gust)*.2)));
  root.dataset.weatherQuality=quiet?'quiet':'full';
 }
 function tick(now){
  frame=0;if(disposed||document.hidden||reduced.matches)return;
  const elapsed=last?now-last:16.7;
  if(quiet&&elapsed<30){frame=requestAnimationFrame(tick);return;}
  last=now;if(elapsed>45)slow++;samples++;
  if(samples===120){if(slow>30){quiet=true;particles.splice(95);}samples=0;slow=0;}
  draw(Math.min(.05,elapsed/1000));frame=requestAnimationFrame(tick);
 }
 function resume(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;root.classList.toggle('weather-still',reduced.matches||document.hidden);if(!disposed&&!reduced.matches&&!document.hidden)frame=requestAnimationFrame(tick);else draw(0);}
 const observer=new ResizeObserver(resize);observer.observe(root);observer.observe(root.querySelector('.volume-sheet'));
 const onVisibility=()=>resume();document.addEventListener('visibilitychange',onVisibility);
 const preference=()=>{quiet=small.matches||connection?.saveData||navigator.deviceMemory<4||navigator.hardwareConcurrency<=4;resize();resume();};
 reduced.addEventListener('change',preference);small.addEventListener('change',preference);
 resize();resume();
 return {turn(index,direction=1){chapter=index;target=theme==='frikten'?(chapter===2?1.9:chapter===3?.65:1):1;root.dataset.chapter=String(chapter);gust=direction*(reduced.matches?0:1);if(!reduced.matches){for(let i=0;i<18;i++)fragments.push({x:i%2?paperRect.left-5:paperRect.right+5,y:random(paperRect.top,paperRect.bottom),vx:(i%2?-1:1)*random(15,60),vy:random(-40,10),life:random(.5,1.6)});if(fragments.length>54)fragments.splice(0,fragments.length-54);}},dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',onVisibility);reduced.removeEventListener('change',preference);small.removeEventListener('change',preference);particles.length=0;fragments.length=0;contexts.forEach(c=>c.clearRect(0,0,width,height));}};
}
