'use strict';
const {send,authorize}=require('./_access.cjs');
const VALID = new Set(['arquivos-silenciados','peso-da-coroa','regencias-conhecidas']);
const ACTIONS = {
 list:['haema_reserved_catalog',null],
 read:['haema_reserved_read',['book_key']],
 save:['haema_reserved_save',['book_key','chapter_number','page_number']],
 solve:['haema_reserved_solve',['book_key','attempt']],
 admin:['haema_reserved_admin_catalog',null],
 grant:['haema_reserved_admin_grant',['target','book_key','enable_access']],
 reset:['haema_reserved_admin_reset',['target','book_key']],
 publish:['haema_reserved_admin_publish',['book_key','next_published']],
 import:['haema_reserved_admin_import',['book_key','book_title','book_subtitle','raw_manuscript','puzzle_data','puzzle_answer','unlocked_text']]
};
module.exports=async function reserved(req,res){
 if(!['GET','POST'].includes(req.method))return send(res,405,{error:'Método indisponível.'});
 try{
  const url=new URL(req.url,'https://haema.invalid');
  const payload=req.method==='POST'?(typeof req.body==='object'&&req.body!==null?req.body:JSON.parse(req.body||'{}')):{};
  const action=req.method==='GET'?(url.searchParams.get('action')||'list'):payload.action;
  if(!Object.hasOwn(ACTIONS,action))return send(res,400,{error:'Operação desconhecida.'});
  if(req.method==='GET'&&!['list','read','admin'].includes(action))return send(res,405,{error:'Método inválido.'});
  if(req.method==='POST'&&['list','read','admin'].includes(action))return send(res,405,{error:'Método inválido.'});
  const [rpcName,keys]=ACTIONS[action];
  const args={};
  if(keys)for(const key of keys){
   const value=key==='book_key'&&req.method==='GET'?url.searchParams.get('id'):payload[key];
   if(value===undefined||value===null)return send(res,400,{error:'Parâmetro obrigatório ausente.'});
   args[key]=value;
  }
  if(args.book_key&&!VALID.has(args.book_key))return send(res,400,{error:'Livro inválido.'});
  if(action==='import'&&typeof args.raw_manuscript==='string'&&args.raw_manuscript.length>150000)
   return send(res,413,{error:'Arquivo muito grande.'});
  const rpc=await authorize(req);
  const data=await rpc(rpcName,args);
  return send(res,200,data===undefined?{ok:true}:data);
 }catch(error){
  if(error instanceof SyntaxError)return send(res,400,{error:'JSON inválido.'});
  return send(res,error.status||503,{error:error.status?error.message:'Não foi possível completar a operação.'});
 }
};
