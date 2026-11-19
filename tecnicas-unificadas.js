'use strict';
function initHAEMAUnifiedTechniques(){
 const root=document.querySelector('.unified-techniques');if(!root||root.dataset.haemaInit==='yes')return;
 root.dataset.haemaInit='yes';
document.addEventListener('DOMContentLoaded',()=>{
 const data=window.HAEMAUnifiedTechniques||[],list=document.getElementById('catalog'),count=document.getElementById('count');
 function draw(){const q=document.getElementById('search').value.toLocaleLowerCase('pt-BR').trim(),cost=document.getElementById('cost').value;
 const found=data.filter(t=>(!cost||t.cost===Number(cost))&&(!q||[t.name,t.requirement,t.effect].join(' ').toLocaleLowerCase('pt-BR').includes(q)));
 list.replaceChildren();count.textContent=found.length+' de '+data.length+' técnicas';
 for(const t of found){const card=document.createElement('article'),name=document.createElement('h2'),meta=document.createElement('small'),p=document.createElement('p');
 name.textContent=t.id+'. '+t.name;meta.textContent=t.cost+' PE · '+t.requirement;p.textContent=t.effect;card.append(name,meta,p);list.append(card);}
 }
 document.getElementById('search').addEventListener('input',draw);document.getElementById('cost').addEventListener('change',draw);draw();
});
}
document.addEventListener('DOMContentLoaded',initHAEMAUnifiedTechniques);
document.addEventListener('haema:navigated',initHAEMAUnifiedTechniques);
