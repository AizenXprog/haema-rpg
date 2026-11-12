const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync('book-weather.js','utf8').replace('export function','function');let checks=0;
for(const small of [false,true])for(const reduced of [false,true]){
 const queue=new Map(),listeners=new Map();let id=0,draws=0,disconnected=0;
 const mq={matches:reduced,addEventListener(k,f){listeners.set('motion',f)},removeEventListener(){listeners.delete('motion')}};
 const sm={matches:small,addEventListener(k,f){listeners.set('small',f)},removeEventListener(){listeners.delete('small')}};
 const ctx=new Proxy({},{get:(_,p)=>p==='ellipse'?()=>draws++:()=>{},set:()=>true});const canvases=[{getContext:()=>ctx},{getContext:()=>ctx}];
 const sheet={getBoundingClientRect:()=>({left:100,right:700,top:20,bottom:580})};
 const root={clientWidth:800,clientHeight:600,querySelectorAll:()=>canvases,querySelector:()=>sheet,getBoundingClientRect:()=>({left:0,top:0}),style:{setProperty(){}},dataset:{},classList:{toggle(){},add(){}}};
 const doc={hidden:false,addEventListener(k,f){listeners.set(k,f)},removeEventListener(k){listeners.delete(k)}};
 const context={root,document:doc,navigator:{hardwareConcurrency:8,deviceMemory:8},devicePixelRatio:2,matchMedia:s=>s.includes('reduced')?mq:sm,ResizeObserver:class{observe(){}disconnect(){disconnected++}},requestAnimationFrame:f=>{queue.set(++id,f);return id},cancelAnimationFrame:i=>queue.delete(i),Math};
 const ok=(v,label)=>{assert.ok(v,label);checks++};
 vm.runInNewContext(source+'; weather=createBookWeather(root,"frikten");',context);
 ok(queue.size===(reduced?0:1),'single or reduced-motion loop');const before=draws;
 for(let n=1;n<10;n++){const jobs=[...queue.values()];queue.clear();jobs.forEach(f=>f(n*33.4))}
 ok(reduced?draws===before:draws>before,'light mode starts; reduced mode stays static');
 const canvas=canvases[0];context.weather.turn(2);ok(root.dataset.chapter==='2'&&canvases[0]===canvas,'chapter change preserves canvas');
 doc.hidden=true;listeners.get('visibilitychange')();ok(queue.size===0,'hidden pauses');doc.hidden=false;listeners.get('visibilitychange')();ok(queue.size===(reduced?0:1),'visible resumes once');
 mq.matches=true;listeners.get('motion')();ok(queue.size===0,'live preference respected');
 context.weather.dispose();context.weather.dispose();ok(queue.size===0&&listeners.size===0&&disconnected===1,'complete idempotent cleanup');
}
console.log(checks+' weather lifecycle checks passed');
