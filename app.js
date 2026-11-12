import './volumes.js?v=2';
import './portal.js?v=4';
import './portal-hub.js?v=1';
import './library.js?v=4';
import './admin.js?v=4';
import './mesa-gate.js';
import {access} from './auth.js';
async function updateAccountNavigation() {
  const links=document.querySelectorAll('[data-admin-link]');
  if(!links.length)return;
  try { const result=await access();links.forEach(link=>link.hidden=!result.admin); }
  catch { links.forEach(link=>link.hidden=true); }
}
document.addEventListener('haema:auth',updateAccountNavigation);
document.addEventListener('haema:navigated',updateAccountNavigation);
updateAccountNavigation();
