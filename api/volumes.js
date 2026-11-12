'use strict';
const {send,authorize}=require('./_access.cjs');
module.exports=async(req,res)=>{
 if(req.method!=='GET'){res.setHeader('Allow','GET');return send(res,405,{error:'Método inválido.'});}
 try{
  const rpc=await authorize(req),id=new URL(req.url,'https://haema.invalid').searchParams.get('volume');
  if(!['frikten','jankinss'].includes(id))return send(res,400,{error:'Volume inválido.'});
  return send(res,200,await rpc('haema_volume_read',{volume_id:id}));
 }catch(error){return send(res,error.status||503,{error:error.status?error.message:'Volume temporariamente indisponível.'});}
};
