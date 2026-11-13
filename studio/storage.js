// HÆMA Estúdio — multiple local map documents, scoped to the authenticated user.
// Preserve the original owner:UUID record for backwards compatibility and recovery.
const DB_NAME='haema-studio-local',STORE='projects';
let promise;
function db(){
 if(typeof window==='undefined'||!('indexedDB' in window))return Promise.reject(Error('IndexedDB indisponível.'));
 if(!promise)promise=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{
   if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'id'});
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
 }).catch(error=>{promise=null;throw error});
 return promise;
}
async function transact(mode,operation){
 const database=await db();
 return new Promise((resolve,reject)=>{
  const tx=database.transaction(STORE,mode);
  let request;
  try{request=operation(tx.objectStore(STORE));}
  catch(error){reject(error);return;}
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error);
  tx.onerror=()=>reject(tx.error);
  tx.onabort=()=>reject(tx.error||Error('Transação cancelada.'));
 });
}
const ownerKey=owner=>{
 if(!/^[0-9a-f-]{36}$/i.test(owner||''))throw Error('Identidade de sessão indisponível.');
 return 'owner:'+owner;
};
const mapPrefix=owner=>'map:'+ownerKey(owner).slice(6)+':';
const mapKey=(owner,id)=>{
 if(!/^map_[a-z0-9-]{16,70}$/i.test(id||''))throw Error('Identificador de mapa inválido.');
 return mapPrefix(owner)+id;
};
export const createMapId=()=> 'map_'+crypto.randomUUID();
export async function saveProject(scene,owner){
 return transact('readwrite',store=>store.put({...scene,id:ownerKey(owner),savedAt:Date.now()}));
}
export async function loadProject(owner){return transact('readonly',store=>store.get(ownerKey(owner)));}
export async function saveNamedProject(scene,owner,mapId){
 const key=mapKey(owner,mapId);
 return transact('readwrite',store=>store.put({...scene,id:key,mapId,savedAt:Date.now()}));
}
export async function loadNamedProject(owner,mapId){
 const doc=await transact('readonly',store=>store.get(mapKey(owner,mapId)));
 return doc||null;
}
export async function listNamedProjects(owner){
 const prefix=mapPrefix(owner);
 const docs=await transact('readonly',store=>store.getAll(IDBKeyRange.bound(prefix,prefix+'\uffff')));
 return docs.filter(d=>d&&typeof d.mapId==='string'&&d.id===prefix+d.mapId)
  .map(d=>({mapId:d.mapId,name:String(d.name||'Mapa sem título').slice(0,80),
    savedAt:Number(d.savedAt)||0,cols:Number(d.cols)||28,rows:Number(d.rows)||18}))
  .sort((a,b)=>b.savedAt-a.savedAt);
}
export async function deleteNamedProject(owner,mapId){
 return transact('readwrite',store=>store.delete(mapKey(owner,mapId)));
}
export function exportJSON(scene){
 const text=JSON.stringify(scene),blob=new Blob([text],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;
 link.download='haema-mapa-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
