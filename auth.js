// One Supabase client and one session across every HÆMA route.
let clientPromise;
export async function client() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const response = await fetch('/api/portal-config', {cache: 'no-store'});
      if (!response.ok) throw Error('Não foi possível preparar o acesso.');
      const config = await response.json();
      if (!config.configured) throw Error('Login indisponível neste ambiente.');
      const {createClient} = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/+esm');
      const supabase = createClient(config.url, config.publishableKey);
      supabase.auth.onAuthStateChange(event => {
        if (['SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event)) {
          setTimeout(() => document.dispatchEvent(new Event('haema:auth')), 0);
        }
      });
      return supabase;
    })().catch(error => { clientPromise = null; throw error; });
  }
  return clientPromise;
}
export async function rpc(name, args = {}) {
  const db = await client();
  const result = await db.rpc(name, args);
  if (result.error) throw result.error;
  return result.data;
}
export async function access() {
  const db = await client();
  const {data: {session}} = await db.auth.getSession();
  if (!session) return {user: null, admin: false, areas: []};
  const {data, error} = await db.auth.getUser();
  if (error || !data.user) throw Error('Sua sessão expirou. Entre novamente.');
  const admin = await rpc('haema_is_admin');
  if (admin) return {user: data.user, admin: true, areas: ['library','bestiary','portal','mesa','materials'], status: 'approved'};
  const [account, grants] = await Promise.all([
    db.from('haema_access_accounts').select('status').eq('user_id', data.user.id).single(),
    db.from('haema_area_grants').select('area').eq('user_id', data.user.id)
  ]);
  if (account.error || grants.error) throw Error('Não foi possível consultar as permissões.');
  return {user: data.user, admin: false, status: account.data.status,
    areas: account.data.status === 'approved' ? grants.data.map(g => g.area) : []};
}
export async function login() {
  const db = await client();
  const target = new URL(location.pathname, location.origin);
  const {error} = await db.auth.signInWithOAuth({provider: 'google', options: {redirectTo: target.href}});
  if (error) throw error;
}
export async function logout() {
  const db = await client();
  const {error} = await db.auth.signOut();
  if (error) throw error;
}
export async function authorizedFetch(path, options = {}) {
  const db = await client();
  const {data: {session}} = await db.auth.getSession();
  if (!session) throw Error('Entre com Google para continuar.');
  const response = await fetch(path, {...options, cache: 'no-store',
    headers: {...options.headers, Authorization: 'Bearer ' + session.access_token}});
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw Error(body.error || 'Acesso indisponível. Atualize suas permissões.');
  }
  return response;
}
export function node(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
export function button(text, action, className = 'archive-button') {
  const el = node('button', className, text);
  el.type = 'button';
  el.addEventListener('click', async () => {
    el.disabled = true;
    try { await action(); }
    catch (error) {
      let feedback = document.querySelector('[data-access-feedback]');
      if (!feedback) {
        feedback=node('p','admin-feedback');
        feedback.setAttribute('role','status');
        el.after(feedback);
      }
      feedback.textContent = error.message || 'Tente novamente.';
    } finally { el.disabled = false; }
  });
  return el;
}
export function accessGate(root, info, areaName) {
  root.replaceChildren(node('span','archive-kicker','ACESSO PESSOAL'),
    node('h2','',info.user ? 'Seu lugar está sendo preparado.' : 'Entre no acervo.'),
    node('p','',info.user
      ? (info.status === 'denied' || info.status === 'revoked'
        ? 'O acesso a ' + areaName + ' está suspenso. Consulte o administrador.'
        : 'Sua conta está registrada. O administrador pode liberar ' + areaName + ' para você.')
      : 'Identifique-se com sua conta Google. O administrador aprova o acesso de cada pessoa.'));
  root.append(button(info.user ? 'Consultar novamente' : 'Entrar com Google',
    info.user ? () => document.dispatchEvent(new Event('haema:auth')) : login));
  if (info.user) root.append(button('Sair da conta', logout, 'archive-link-button'));
}
