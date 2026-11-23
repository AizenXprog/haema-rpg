'use strict';
/* Guided learning only. Never changes a character, a campaign or a rule. */
function initHAEMALearning(){
 const root=document.querySelector('main.haema-learning');
 if(!root||root.dataset.haemaInit==='yes')return;
 root.dataset.haemaInit='yes';
 const core=window.HAEMAUnified;
 const button=root.querySelector('#haema-system-roll'),select=root.querySelector('#haema-system-example'),out=root.querySelector('#haema-system-result');
 if(!button||!select||!out)return;
 if(!core){button.disabled=true;out.textContent='O exemplo interativo não está disponível. As explicações continuam acessíveis.';return;}
 button.addEventListener('click',()=>{
  const trained=select.value==='trained';
  const aFace=trained?6:4,bFace=trained?6:4,dt=trained?7:5;
  const a=core.roll(aFace),b=core.roll(bFace),result=core.test({aFace,bFace,aRoll:a,bRoll:b,dt});
  out.textContent='d'+aFace+' ('+a+') + d'+bFace+' ('+b+') = '+result.total+' · DT '+dt+'. '+(result.success?'Você conseguiu!':'Você não alcançou a dificuldade.')+' O mestre descreve o que acontece em seguida.';
 });
}
document.addEventListener('DOMContentLoaded',initHAEMALearning);
document.addEventListener('haema:navigated',initHAEMALearning);
