// HÆMA Estúdio LAB — tonalidade atmosférica 2D, sem regras mágicas e sem serviços externos.
// Não é um motor de linha de visão: luzes apenas compõem a imagem sob a neblina de guerra.
export const AMBIENT_PRESETS={
 day:{veil:'#18272b',darkness:.02,glow:.45},
 sunset:{veil:'#3c2336',darkness:.22,glow:.70},
 night:{veil:'#071627',darkness:.46,glow:.95},
 underground:{veil:'#11121a',darkness:.56,glow:1}
};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
export function normalizeAtmosphere(raw){
 if(!raw||typeof raw!=='object')return {preset:'day',strength:1};
 const preset=Object.prototype.hasOwnProperty.call(AMBIENT_PRESETS,raw.preset)?raw.preset:'day';
 const strength=Number.isFinite(Number(raw.strength))?clamp(Number(raw.strength),0,1):1;
 return {preset,strength:Math.round(strength*100)/100};
}
function lightSources(scene,player,visible){
 return (scene.props||[]).filter(p=>['torch','hearth'].includes(p.type)&&
   (!player||typeof visible==='function'&&visible(scene,p.x,p.y))).slice(0,32);
}
export function drawAtmosphere(ctx,scene,{cell=48,player=false,visible}={}){
 if(!ctx?.save||!ctx?.fillRect)return;
 const options=normalizeAtmosphere(scene.atmosphere),config=AMBIENT_PRESETS[options.preset];
 const w=scene.cols*cell,h=scene.rows*cell,dim=config.darkness*options.strength;
 ctx.save();
 if(dim>.001){
  ctx.fillStyle=config.veil;ctx.globalAlpha=dim;ctx.fillRect(0,0,w,h);
 }
 const lights=lightSources(scene,player,visible);
 if(typeof ctx.createRadialGradient==='function'){
  ctx.globalAlpha=1;
  ctx.globalCompositeOperation='screen';
  for(const prop of lights){
   const x=prop.x*cell,y=prop.y*cell,hearth=prop.type==='hearth';
   const radius=cell*(hearth?3.4:2.35),power=config.glow*(hearth?.42:.33);
   const gradient=ctx.createRadialGradient(x,y,0,x,y,radius);
   gradient.addColorStop(0,'rgba(255,178,82,'+power.toFixed(3)+')');
   gradient.addColorStop(.27,'rgba(240,131,54,'+(power*.65).toFixed(3)+')');
   gradient.addColorStop(1,'rgba(213,94,36,0)');
   ctx.fillStyle=gradient;ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
 }
 ctx.restore();
}
