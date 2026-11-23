'use strict';
function initHAEMAUnifiedManual(){
 const root=document.querySelector('.unified-manual');if(!root||root.dataset.haemaInit==='yes')return;
 root.dataset.haemaInit='yes';

const input=document.getElementById('filter'),items=[...document.querySelectorAll('.chapter')];
function filter(){
 const q=input.value.toLocaleLowerCase('pt-BR').trim();let count=0;
 for(const d of items){
  const ok=!q||d.textContent.toLocaleLowerCase('pt-BR').includes(q);
  d.hidden=!ok;if(ok)count++;if(q&&ok)d.open=true;
 }
 for(const group of root.querySelectorAll('.manual-toc-group')){
  let found=0;
  for(const link of group.querySelectorAll('a[href^="#cap-"]')){
   const chapter=root.querySelector(link.getAttribute('href'));
   const visible=!!chapter&&!chapter.hidden;
   link.hidden=!visible;if(visible)found++;
  }
  group.hidden=!!q&&found===0;
  if(q&&found>0)group.open=true;
 }
 root.querySelector('#count').textContent=count+' capítulos encontrados';
 root.querySelector('#empty').style.display=count?'none':'block';
}
input.addEventListener('input',filter);filter();
root.querySelectorAll('.layout nav a').forEach(link=>link.addEventListener('click',()=>{const d=root.querySelector(link.getAttribute('href'));if(d)d.open=true;}));

}
document.addEventListener('DOMContentLoaded',initHAEMAUnifiedManual);
document.addEventListener('haema:navigated',initHAEMAUnifiedManual);
