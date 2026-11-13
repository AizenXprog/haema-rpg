'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const src=fs.readFileSync('studio/frame-scheduler.js','utf8').replace(/^export /gm,'');
const {createFrameScheduler}=new Function(src+'\nreturn {createFrameScheduler};')();
let now=0,tasks=[],sent=0,release;
const schedule=(fn,ms)=>{const t={fn,at:now+ms};tasks.push(t);return t;};
const cancel=t=>{tasks=tasks.filter(x=>x!==t);};
const tick=async(ms=0)=>{now+=ms;const due=tasks.filter(t=>t.at<=now);tasks=tasks.filter(t=>t.at>now);due.forEach(t=>t.fn());await Promise.resolve();await Promise.resolve();};
const scheduler=createFrameScheduler(async valid=>{await new Promise(resolve=>{release=()=>{if(valid())sent++;resolve();};});},
 {intervalMs:85,clock:()=>now,schedule,cancel});
(async()=>{
 scheduler.request();for(let i=0;i<100;i++)scheduler.request();
 assert.equal(tasks.length,1,'burst is coalesced');
 await tick();for(let i=0;i<100;i++)scheduler.request();
 release();await Promise.resolve();await Promise.resolve();
 assert.equal(tasks.length,1,'movement continues to schedule frames');
 await tick(85);release();await Promise.resolve();await Promise.resolve();
 assert.equal(sent,2,'2 frames during movement without pointerup');
 scheduler.request();await tick(85);scheduler.reset();release();await Promise.resolve();await Promise.resolve();
 assert.equal(sent,2,'blackout invalidates pending encode');
 scheduler.request(true);await tick();release();await Promise.resolve();await Promise.resolve();
 assert.equal(sent,3,'resumes after blackout');
 scheduler.dispose();scheduler.request();assert.equal(tasks.length,0,'disposed');
 const editor=fs.readFileSync('studio/editor.js','utf8'),projector=fs.readFileSync('studio/projector.js','utf8');
 assert.ok(editor.includes('drawScene(drawingContext,scene,{player:true'),'projection uses player-only renderer');
 assert.ok(editor.includes('imageBlob:blob'),'binary frame transport');
 assert.ok(projector.includes("data?.type==='blackout'"),'blackout handled');
 console.log('live projection scheduling and privacy tests passed');
})().catch(e=>{console.error(e);process.exitCode=1;});
