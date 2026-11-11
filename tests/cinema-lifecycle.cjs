const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let checks=0;const ok=(v,s)=>{assert.ok(v,s);checks++};
function run({reduced=false,narrow=false,cores=8}={}){
 const document=new EventTarget(),window=new EventTarget(),frames=new Map(),media={};
 let started=0,cancelled=0,frameId=0;
 const heading={animate(){started++;return {finished:new Promise(()=>{}),cancel(){cancelled++}}}};
 const main=new EventTarget();main.querySelector=s=>s==='h1'?heading:null;main.querySelectorAll=()=>[];
 Object.assign(document,{hidden:false,documentElement:{dataset:{},toggleAttribute(){}},getElementById:id=>id==='conteudo'?main:null});
 function matchMedia(q){if(!media[q])media[q]=Object.assign(new EventTarget(),{matches:q.includes('reduced')?reduced:q.includes('max-width')?narrow:true});return media[q]}
 vm.runInNewContext(fs.readFileSync('cinema.js','utf8'),{document,window,matchMedia,navigator:{hardwareConcurrency:cores},AbortController,Set,URL,requestAnimationFrame:f=>{frames.set(++frameId,f);return frameId},cancelAnimationFrame:id=>frames.delete(id)});
 return {document,window,frames,media,started:()=>started,cancelled:()=>cancelled};
}
let h=run({reduced:true});ok(h.started()===0&&h.frames.size===0,'reduced motion schedules no decorative animation');ok(h.document.documentElement.dataset.cinemaQuality==='quiet','reduced quality');
h=run({narrow:true});ok(h.frames.size===0&&h.document.documentElement.dataset.cinemaQuality==='quiet','mobile skips frame sampling');
h=run({cores:2});ok(h.document.documentElement.dataset.cinemaQuality==='quiet','low core count selects light mode');
h=run();ok(h.started()===1,'initial heading entrance');
h.document.dispatchEvent(new Event('haema:leaving'));ok(h.cancelled()===1,'leaving cancels active animations');
h.document.dispatchEvent(new Event('haema:navigated'));ok(h.started()===2,'next route initializes once');
for(let i=0;i<30&&h.frames.size;i++){const [id,fn]=h.frames.entries().next().value;h.frames.delete(id);fn((i+1)*55)}
ok(h.frames.size===0,'frame sampling ends after bounded startup');ok(h.document.documentElement.dataset.cinemaQuality==='quiet','slow frame sample degrades effects');
h.window.dispatchEvent(new Event('pagehide'));ok(h.cancelled()===2,'pagehide cleans next route animation');
console.log(checks+' cinematic lifecycle checks passed');
