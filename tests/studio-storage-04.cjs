'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process');
const source=fs.readFileSync('studio/storage.js','utf8').replace(/^export /gm,'');
const rows=new Map();let failNext=false;
const keyRange={bound(lower,upper){return {lower,upper};}};
const connection={close(){},transaction(){
 const tx={error:null,oncomplete:null,onerror:null,onabort:null};
 let pending=null;
 const request=operation=>{
  const req={onsuccess:null,onerror:null,result:undefined,error:null};
  queueMicrotask(()=>{
   try{req.result=operation();req.onsuccess?.();}
   catch(error){req.error=error;req.onerror?.();tx.onerror?.();return;}
   setTimeout(()=>{
    if(failNext){failNext=false;tx.error=Error('Falha após request.onsuccess');tx.onabort?.();return;}
    if(pending?.kind==='put')rows.set(pending.key,pending.value);
    if(pending?.kind==='delete')rows.delete(pending.key);
    tx.oncomplete?.();
   },5);
  });
  return req;
 };
 tx.objectStore=()=>({
  put(value){return request(()=>{pending={kind:'put',key:value.id,value};return value.id;});},
  get(key){return request(()=>rows.get(key));},
  getAll(range){return request(()=>[...rows].filter(([key])=>key>=range.lower&&key<=range.upper).map(([,value])=>value));},
  delete(key){return request(()=>{pending={kind:'delete',key};return undefined;});}
 });
 return tx;
}};
const idb={open(){const request={result:connection,onupgradeneeded:null,onsuccess:null,onerror:null};queueMicrotask(()=>request.onsuccess?.());return request;}};
const api=new Function('window','indexedDB','IDBKeyRange','crypto',source+'\nreturn {saveProject,loadProject,saveNamedProject,loadNamedProject,listNamedProjects,deleteNamedProject};')(
 {indexedDB:idb},idb,keyRange,{randomUUID:()=>'-dummy'});
const owner='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',other='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const id='map_1234567890abcdef',otherId='map_abcdef1234567890';
async function main(){
 let checks=0;
 const ok=(yes,name)=>{assert.ok(yes,name);checks++};
 await api.saveProject({name:'Legado'},owner);
 ok((await api.loadProject(owner)).name==='Legado','legacy owner record preserved');
 let committed=false;
 const save=api.saveNamedProject({name:'Costa'},owner,id).then(()=>{committed=true;});
 await Promise.resolve();await Promise.resolve();
 ok(!committed,'save waits for transaction.oncomplete, not request.onsuccess');
 await save;
 ok((await api.loadNamedProject(owner,id)).name==='Costa','committed named map can be reopened');
 await api.saveNamedProject({name:'Outro usuário'},other,otherId);
 ok((await api.listNamedProjects(owner)).length===1,'owner cannot list other user maps');
 failNext=true;
 await assert.rejects(api.saveNamedProject({name:'Falhar'},owner,otherId),/Falha após request.onsuccess/);checks++;
 ok(!(await api.loadNamedProject(owner,otherId)),'transaction abort does not create partial map');
 await api.deleteNamedProject(owner,id);
 ok((await api.listNamedProjects(owner)).length===0,'named deletion commits');
 ok((await api.loadProject(owner)).name==='Legado','named deletion never destroys legacy backup');
 await assert.rejects(api.loadNamedProject(owner,'bad-key'),/Identificador de mapa inválido/);checks++;
 cp.execFileSync('node',['--check','studio/storage.js']);checks++;
 console.log(checks+' IndexedDB durability, isolation and abort checks passed');
}
main().catch(error=>{console.error(error);process.exitCode=1;});