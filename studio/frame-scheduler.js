// HÆMA Estúdio 0.5 LAB — bounded update cadence, no trailing-edge debounce.
export function createFrameScheduler(send,{intervalMs=85,clock=()=>performance.now(),
 schedule=(fn,ms)=>setTimeout(fn,ms),cancel=handle=>clearTimeout(handle)}={}){
 let timer=null,running=false,dirty=false,generation=0,stopped=false,lastStarted=-Infinity;
 const arm=(immediate=false)=>{
  if(stopped||running||timer!==null||!dirty)return;
  const delay=immediate?0:Math.max(0,intervalMs-(clock()-lastStarted));
  timer=schedule(()=>{timer=null;void flush();},delay);
 };
 async function flush(){
  if(stopped||running||!dirty)return;
  running=true;dirty=false;lastStarted=clock();
  const ticket=generation;
  try{await send(()=>!stopped&&ticket===generation);}
  finally{running=false;arm();}
 }
 return {
  request(immediate=false){if(stopped)return;dirty=true;arm(immediate);},
  reset(){generation++;dirty=false;if(timer!==null){cancel(timer);timer=null;}},
  dispose(){stopped=true;this.reset();}
 };
}
