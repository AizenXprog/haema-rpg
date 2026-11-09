'use strict';
const {send, authorize} = require('./_access.cjs');
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow','GET'); return send(res,405,{error:'Método inválido.'}); }
  try {
    const rpc = await authorize(req);
    const url = new URL(req.url, 'https://haema.invalid');
    const entry = url.searchParams.get('entry');
    if (entry && !/^[a-z0-9-]{1,80}$/.test(entry)) return send(res,400,{error:'Registro inválido.'});
    return send(res,200,entry ? await rpc('haema_book_entry',{entry_id:entry}) : await rpc('haema_book_index'));
  } catch (error) { return send(res,error.status || 503,{error:error.status ? error.message : 'Acervo temporariamente indisponível.'}); }
};
