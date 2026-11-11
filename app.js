import './portal.js';
import './library.js?v=3';
import './admin.js?v=2';
import './mesa-gate.js';
import './trailers.js?v=1';
import {access} from './auth.js';
async function updateAccountNavigation() {
  const link=document.querySelector('[data-admin-link]');
  if(!link)return;
  try { const result=await access();link.hidden=!result.admin; }
  catch { link.hidden=true; }
}
document.addEventListener('haema:auth',updateAccountNavigation);
document.addEventListener('haema:navigated',updateAccountNavigation);
updateAccountNavigation();
