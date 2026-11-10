import './portal.js';
import './library.js?v=2';
import './admin.js';
import './mesa-gate.js';
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
