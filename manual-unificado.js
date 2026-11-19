'use strict';
function initHAEMAUnifiedManual(){
 const root=document.querySelector('.unified-manual');if(!root||root.dataset.haemaInit==='yes')return;
 root.dataset.haemaInit='yes';

const input=document.getElementById('filter'),items=[...document.querySelectorAll('.chapter')];
function filter(){const q=input.value.toLocaleLowerCase('pt-BR').trim();let count=0;for(const d of items){const ok=!q||d.textContent.toLocaleLowerCase('pt-BR').includes(q);d.hidden=!ok;if(ok)count++;if(q&&ok)d.open=true;}document.getElementById('count').textContent=count+' capítulos encontrados';document.getElementById('empty').style.display=count?'none':'block';}
input.addEventListener('input',filter);filter();
document.querySelectorAll('nav a').forEach(link=>link.addEventListener('click',()=>{const d=document.querySelector(link.getAttribute('href'));if(d)d.open=true;}));

}
document.addEventListener('DOMContentLoaded',initHAEMAUnifiedManual);
document.addEventListener('haema:navigated',initHAEMAUnifiedManual);
