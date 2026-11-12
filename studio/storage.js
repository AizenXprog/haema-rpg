// Local-first project storage. No user content is uploaded to Supabase or Vercel.
const DB_NAME='haema-studio-local',STORE='projects';
let promise;
function db(){
 if(!('indexedDB' in window))return Promise.reject(Error('IndexedDB indisponível.'));
 if(!promise)promise=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'id'});
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 }).catch(error=>{promise=null;throw error});
 return promise;
}
async function transact(mode,operation){
 const database=await db();
 return new Promise((resolve,reject)=>{
  const transaction=database.transaction(STORE,mode);
  const store=transaction.objectStore(STORE),request=operation(store);
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
  transaction.onerror=()=>reject(transaction.error);
 });
}
const ownerKey=owner=>{if(!/^[0-9a-f-]{36}$/i.test(owner||''))throw Error('Identidade de sessão indisponível.');return 'owner:'+owner;};
export async function saveProject(scene,owner){return transact('readwrite',store=>store.put({...scene,id:ownerKey(owner),savedAt:Date.now()}));}
export async function loadProject(owner){return transact('readonly',store=>store.get(ownerKey(owner)));}
export function exportJSON(scene){
 const text=JSON.stringify(scene),blob=new Blob([text],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='haema-mapa-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
