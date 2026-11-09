'use strict';
function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vary', 'Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(data));
}
async function authorize(req) {
  const base = (process.env.HAEMA_SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.HAEMA_SUPABASE_PUBLISHABLE_KEY;
  const token = req.headers.authorization || '';
  if (!/^Bearer [A-Za-z0-9._~-]+$/.test(token)) throw Object.assign(Error('Entre com Google.'), {status: 401});
  if (!base || !key) throw Object.assign(Error('Acesso temporariamente indisponível.'), {status: 503});
  const headers = {apikey: key, Authorization: token, 'Content-Type': 'application/json'};
  const response = await fetch(base + '/auth/v1/user', {headers, signal: AbortSignal.timeout(8000)});
  if (!response.ok) throw Object.assign(Error('Sessão inválida ou expirada.'), {status: 401});
  const user = await response.json();
  if (!(user.app_metadata?.providers || [user.app_metadata?.provider]).includes('google')) {
    throw Object.assign(Error('Use uma conta Google autorizada.'), {status: 403});
  }
  return async (name, args = {}) => {
    const result = await fetch(base + '/rest/v1/rpc/' + name, {
      method: 'POST', headers, body: JSON.stringify(args), signal: AbortSignal.timeout(8000)
    });
    if (!result.ok) throw Object.assign(Error('Acesso pendente, revogado ou registro indisponível.'), {status: result.status >= 500 ? 503 : 403});
    return result.json();
  };
}
module.exports = {send, authorize};
