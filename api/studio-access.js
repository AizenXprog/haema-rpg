'use strict';
const {send,authorize}=require('./_access.cjs');
module.exports=async(req,res)=>{
 if(req.method!=='GET'){res.setHeader('Allow','GET');return send(res,405,{error:'Método inválido.'});}
 try{
  const rpc=await authorize(req);
  const permitted=await rpc('haema_has_area',{requested:'studio'});
  if(permitted!==true)return send(res,403,{error:'Estúdio reservado a usuários autorizados.'});
  return send(res,200,{allowed:true});
 }catch(error){return send(res,error.status||503,{error:error.status?error.message:'Estúdio temporariamente indisponível.'});}
};
