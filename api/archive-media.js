// Private, read-only MEGA bridge. Never exports share links or session keys.
const { Storage, File } = require('megajs');
const sharp = require('sharp');
const { pipeline } = require('node:stream/promises');
const TYPES = {png:'image/png',webp:'image/webp',jpg:'image/jpeg',jpeg:'image/jpeg'};
const ID = /^[A-Za-z0-9_-]{8}$/;
const MAX_SOURCE = 40 * 1024 * 1024;
const MAX_DOWNLOAD = 150 * 1024 * 1024;
let connection, activePreviews=0;
const cache = new Map();
let cacheBytes=0;
function error(res,status,message){return res.status(status).json({error:message});}
async function isAdmin(req){
 const token=req.headers.authorization;
 const url=process.env.HAEMA_SUPABASE_URL;
 const key=process.env.HAEMA_SUPABASE_PUBLISHABLE_KEY;
 if(!token || !/^Bearer [A-Za-z0-9._-]+$/.test(token)||!url||!key) return false;
 const headers={apikey:key,Authorization:token};
 const user=await fetch(url.replace(/\/$/,'')+'/auth/v1/user',{headers,cache:'no-store'});
 if(!user.ok)return false;
 const admin=await fetch(url.replace(/\/$/,'')+'/rest/v1/rpc/haema_is_admin',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:'{}',cache:'no-store'});
 return admin.ok && (await admin.json())===true;
}
function folderLink(){
 const value=(process.env.HAEMA_MEGA_FOLDER_URL||'').trim();
 return /^https:\/\/mega\.nz\/folder\/[A-Za-z0-9_-]{8}#[A-Za-z0-9_-]{22}$/.test(value)?value:null;
}
function configured(){
 if(folderLink())return true;
 const ids=(process.env.HAEMA_MEGA_ROOT_HANDLES||'').split(',').map(v=>v.trim()).filter(Boolean);
 return Boolean(process.env.HAEMA_MEGA_SESSION_JSON && ids.length && ids.every(x=>ID.test(x)));
}
async function storage(){
 if(!connection){
  connection=(async()=>{
   const link=folderLink();
   if(link){
    const root=File.fromURL(link);
    await root.loadAttributes();
    if(!root.directory||!Array.isArray(root.children))throw Error('Archive folder unavailable');
    const files=Object.create(null),allowed=new Set(),visited=new Set(),stack=[root];
    while(stack.length){
     const node=stack.pop();
     if(visited.has(node))continue;visited.add(node);
     if(node.directory){stack.push(...(node.children||[]));continue;}
     const id=ID.test(node.nodeId||'')?node.nodeId:Array.isArray(node.downloadId)&&ID.test(node.downloadId[1]||'')?node.downloadId[1]:null;
     if(id){files[id]=node;allowed.add(id);}
    }
    if(!allowed.size)throw Error('No files found in archive folder');
    return {s:{files},allowed,expires:Date.now()+5*60*1000};
   }
   const session=JSON.parse(process.env.HAEMA_MEGA_SESSION_JSON);
   const s=Storage.fromJSON(session);
   await s.reload();
   const allowed=new Set(), visited=new Set();
   for(const id of process.env.HAEMA_MEGA_ROOT_HANDLES.split(',').map(x=>x.trim()).filter(Boolean)){
    const root=s.files[id];
    if(!root||!root.directory)throw Error('Archive root unavailable');
    const stack=[root];
    while(stack.length){const node=stack.pop();if(visited.has(node.nodeId))continue;visited.add(node.nodeId);if(node.directory)stack.push(...(node.children||[]));else allowed.add(node.nodeId);}
   }
   return {s,allowed,expires:Date.now()+5*60*1000};
  })().catch(e=>{connection=null;throw e;});
 }
 const result=await connection;
 if(result.expires<Date.now()){connection=null;return storage();}
 return result;
}
function remember(key,buf){
 if(buf.length>1024*1024)return;
 while(cache.size>=64||cacheBytes+buf.length>16*1024*1024){const first=cache.keys().next().value;const old=cache.get(first);cacheBytes-=old.buf.length;cache.delete(first);}
 cache.set(key,{buf,expires:Date.now()+5*60*1000});cacheBytes+=buf.length;
}
function disposition(name){
 const safe=String(name).replace(/[\r\n/\\]/g,'_');
 const ascii=safe.replace(/[^\x20-\x7e]|[";]/g,'_');
 return 'attachment; filename="'+ascii+'"; filename*=UTF-8\'\''+encodeURIComponent(safe).replace(/['()]/g,c=>'%'+c.charCodeAt(0).toString(16));
}
module.exports=async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store, max-age=0');
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 if(req.method!=='GET')return error(res,405,'Método não permitido.');
 try{
  if(!await isAdmin(req))return error(res,403,'Acesso exclusivo do administrador.');
  const mode=req.query.mode||'preview';
  if(mode==='status')return res.status(200).json({configured:configured()});
  if(!configured())return error(res,503,'Integração MEGA ainda não configurada.');
  const id=req.query.id;
  if(typeof id!=='string'||!ID.test(id)||!['preview','download'].includes(mode))return error(res,400,'Recurso inválido.');
  const {s,allowed}=await storage();
  const file=s.files[id];
  if(!allowed.has(id)||!file||file.directory)return error(res,404,'Arquivo indisponível no acervo autorizado.');
  const ext=String(file.name).split('.').pop().toLowerCase();
  if(!TYPES[ext])return error(res,415,'Formato de imagem não suportado.');
  if(!Number.isSafeInteger(file.size)||file.size<=0)return error(res,422,'Tamanho de arquivo inválido.');
  if(mode==='download'){
   if(file.size>MAX_DOWNLOAD)return error(res,413,'Arquivo acima do limite experimental de 150 MB.');
   res.status(200);res.setHeader('Content-Type',TYPES[ext]);res.setHeader('Content-Disposition',disposition(file.name));
   await pipeline(file.download({forceHttps:true,maxConnections:2}),res);
   return;
  }
  const width=req.query.large==='1'?1600:420;
  const cacheKey=id+':'+width;
  const cached=cache.get(cacheKey);
  if(cached&&cached.expires>Date.now()){res.setHeader('Content-Type','image/webp');return res.status(200).send(cached.buf);}
  if(cached){cache.delete(cacheKey);cacheBytes-=cached.buf.length;}
  if(file.size>MAX_SOURCE)return error(res,413,'Prévia experimental limitada a imagens de até 40 MB. O original pode ser baixado.');
  if(activePreviews>=2)return error(res,429,'Prévia ocupada. Tente novamente.');
  activePreviews++;
  try{
   const original=await file.downloadBuffer({forceHttps:true,maxConnections:2});
   const buf=await sharp(original,{limitInputPixels:100000000,failOn:'error'}).rotate().resize({width,height:width,fit:'inside',withoutEnlargement:true}).webp({quality:76}).toBuffer();
   remember(cacheKey,buf);
   res.setHeader('Content-Type','image/webp');return res.status(200).send(buf);
  }finally{activePreviews--;}
 }catch(e){
  if(res.headersSent){res.destroy();return;}
  return error(res,502,'Não foi possível recuperar a imagem do MEGA. Verifique a conexão e a quota de transferência.');
 }
};
