/* Visual atmospheres for the reserved HÆMA reading rooms.
 * Decorations only: no lore, no hidden answers, no networking or storage. */
export function createReservedAtmosphere(dialog, theme) {
  const quiet = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 720px)');
  const canvas = document.createElement('canvas');
  canvas.className = 'reserved-ambient-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  dialog.append(canvas);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return {turn() {}, dispose() {canvas.remove();}};
  const abort = new AbortController();
  let active = true, raf = 0, width = 1, height = 1, dpr = 1, particles = [], chapter = 0;
  const count = () => quiet.matches ? 0 : mobile.matches ? 22 : 56;
  const random = (min,max) => min + Math.random()*(max-min);
  function reset() {
    return {
      x: random(0,width), y: random(0,height),
      speed: random(.12,.64), drift: random(-.34,.34),
      r: random(.45,2.2), opacity: random(.2,.75),
      phase: random(0,Math.PI*2),
      angle: random(0,Math.PI*2),
      spin: random(-.005,.005)
    };
  }
  function size() {
    const rect=dialog.getBoundingClientRect();
    width=Math.max(1,rect.width);height=Math.max(1,rect.height);
    dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    particles=Array.from({length:count()},reset);
  }
  function stroke(x,y,r,alpha) {
    ctx.globalAlpha=alpha;
    ctx.strokeStyle=theme==='regencies'?'#c7ac99':theme==='crown'?'#d2a467':'#c7ad81';
    ctx.lineWidth=.65;
    ctx.beginPath();
    if(theme==='regencies') {
      ctx.moveTo(x-r,y-r);ctx.lineTo(x+r,y-r);ctx.lineTo(x+r,y+r);ctx.closePath();
    } else if(theme==='crown') {
      ctx.moveTo(x-r*2,y);ctx.lineTo(x+r*2,y);
    } else {
      ctx.moveTo(x-r/2,y-r*2);ctx.lineTo(x+r/2,y+r*2);
    }
    ctx.stroke();
  }
  function frame(t){
    if(!active)return;
    if(quiet.matches||document.hidden){raf=0;return;}
    ctx.clearRect(0,0,width,height);
    // Restrained light on the manuscript edges, rather than on top of body text.
    const pulse=(Math.sin(t*.00045+chapter*.6)+1)/2;
    const ambient=ctx.createRadialGradient(theme==='crown'?width*.8:width*.24,height*.19,0,width*.45,height*.4,width*.7);
    ambient.addColorStop(0,theme==='archive'?'rgba(219,164,99,.07)':theme==='crown'?'rgba(216,159,89,.045)':'rgba(182,153,170,.045)');
    ambient.addColorStop(1,'rgba(0,0,0,0)');
    ctx.globalAlpha=.45+.25*pulse;ctx.fillStyle=ambient;ctx.fillRect(0,0,width,height);
    if(theme==='regencies'){
      const cx=width*.5, cy=height*.53, radius=Math.min(width,height)*.42;
      ctx.globalAlpha=.07;ctx.strokeStyle='#c3b1aa';ctx.lineWidth=.65;
      ctx.beginPath();ctx.ellipse(cx,cy,radius,radius*.65,t*.00002,0,Math.PI*2);ctx.stroke();
    }
    for(let i=0;i<particles.length;i++){
      const p=particles[i];p.phase+=.008;p.angle+=p.spin;
      if(theme==='regencies'){
        const cx=width*.5,cy=height*.53,spin=t*.000028+(i/particles.length)*Math.PI*2;
        const radius=Math.min(width,height)*(.25+(i%5)*.036);
        p.x=cx+Math.cos(spin)*radius*1.55; p.y=cy+Math.sin(spin)*radius*.94;
        stroke(p.x,p.y,p.r*2,.06*p.opacity);
        if(i%7===0){ctx.globalAlpha=.11*p.opacity;ctx.strokeStyle='#b6aabd';ctx.beginPath();ctx.arc(p.x,p.y,p.r*2,0,Math.PI*2);ctx.stroke();}
      }else{
        p.y-=theme==='archive'?p.speed*.31:p.speed*.55;
        p.x+=Math.sin(p.phase)*.11+p.drift*.17;
        if(p.y< -20||p.x < -25||p.x>width+25){const next=reset();Object.assign(p,next,{y:height+10});}
        const alpha=(theme==='archive'?.16:.2)*p.opacity*(.75+.25*Math.sin(p.phase));
        stroke(p.x,p.y,p.r,alpha);
        if(i%6===0){
          ctx.globalAlpha=alpha*.5;ctx.fillStyle=theme==='crown'?'#b68e6f':'#d4bb8c';
          ctx.beginPath();ctx.arc(p.x,p.y,p.r*.65,0,Math.PI*2);ctx.fill();
        }
      }
    }
    ctx.globalAlpha=1;
    raf=requestAnimationFrame(frame);
  }
  function restart(){
    cancelAnimationFrame(raf);raf=0;ctx.clearRect(0,0,width,height);
    if(!quiet.matches&&!document.hidden)raf=requestAnimationFrame(frame);
  }
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(size):null;
  observer?.observe(dialog);
  window.addEventListener('resize',size,{signal:abort.signal});
  document.addEventListener('visibilitychange',restart,{signal:abort.signal});
  quiet.addEventListener('change',()=>{size();restart();},{signal:abort.signal});
  mobile.addEventListener('change',()=>{size();restart();},{signal:abort.signal});
  size();restart();
  return {
    turn(index){chapter=index;},
    dispose(){if(!active)return;active=false;abort.abort();observer?.disconnect();cancelAnimationFrame(raf);ctx.clearRect(0,0,width,height);canvas.remove();}
  };
}
