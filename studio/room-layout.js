// HÆMA Estúdio LAB — planner espacial original para interiores mobiliados.
// Ordem de leitura: função da sala, circulação, âncoras, objetos secundários, detalhes.
const sizes={
 rug:[.54,.41],table:[.5,.37],chair:[.27,.27],bed:[.46,.57],
 chest:[.34,.27],barrel:[.24,.27],shelf:[.48,.23],
 cabinet:[.45,.26],hearth:[.47,.4],pillar:[.39,.39],crate:[.3,.3],
 torch:[.12,.12]
};
const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
function footprint(p){
 const size=sizes[p.type]||[.34,.34];return {rx:size[0],ry:size[1]};
}
function overlaps(a,b){
 if(a.type==='rug'||b.type==='rug'||a.type==='torch'||b.type==='torch')return false;
 const fa=footprint(a),fb=footprint(b);
 return Math.abs(a.x-b.x)<fa.rx+fb.rx+.21&&Math.abs(a.y-b.y)<fa.ry+fb.ry+.21;
}
export function roomDoorPoint(room){
 const {x,y,w,h}=room,side=room.door||'south';
 const midX=x+Math.floor(w/2)+.5,midY=y+Math.floor(h/2)+.5;
 if(side==='north')return {x:midX,y,side};
 if(side==='west')return {x,y:midY,side};
 if(side==='east')return {x:x+w,y:midY,side};
 return {x:midX,y:y+h,side};
}
export function blocksEntrance(p,room){
 if(room.door===false)return false;
 const d=roomDoorPoint(room),size=footprint(p);
 const span=1.05,depth=1.8;
 if(d.side==='north')return Math.abs(p.x-d.x)<span+size.rx&&p.y-size.ry<d.y+depth;
 if(d.side==='south')return Math.abs(p.x-d.x)<span+size.rx&&p.y+size.ry>d.y-depth&&p.y-size.ry<d.y+.1;
 if(d.side==='west')return Math.abs(p.y-d.y)<span+size.ry&&p.x-size.rx<d.x+depth&&p.x+size.rx>d.x-.1;
 return Math.abs(p.y-d.y)<span+size.ry&&p.x+size.rx>d.x-depth;
}
export function validateFurniture(p,room,others){
 if(!sizes[p.type]||!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;
 const f=footprint(p),margin=.32;
 if(p.x-f.rx<room.x+margin||p.x+f.rx>room.x+room.w-margin)return false;
 if(p.y-f.ry<room.y+margin||p.y+f.ry>room.y+room.h-margin)return false;
 if(p.type!=='rug'&&blocksEntrance(p,room))return false;
 if((others||[]).some(o=>overlaps(p,o)))return false;
 return true;
}
export function planRoomFurniture(room,kind='common',random=()=>.5,existing=[]){
 if(!room||room.w<3||room.h<3)return [];
 const {x,y,w,h}=room,cx=x+w/2,cy=y+h/2;
 const placed=[];
 const round=n=>Math.round(n*100)/100;
 const place=(type,xx,yy,rotation=0)=>{
  const prop={type,x:round(xx),y:round(yy),rotation};
  if(validateFurniture(prop,room,[...existing,...placed])){placed.push(prop);return true;}
  return false;
 };
 const jitter=()=>((Number(random())||.5)-.5)*.35;
 const wallRow=y+1.06,nearBottom=y+h-1.08;
 if(kind==='tavern'){
  // Floor decoration always goes beneath furniture in draw order.
  place('rug',cx,cy);
  const anchors=[[cx-.65,cy],[cx+.7,cy-.5],[cx-.1,cy+1.05]];
  for(const [tx,ty] of anchors){
   if(place('table',tx,ty)){
    for(const [dx,dy,rotation] of [[0,-1.09,0],[-1.08,0,90],[1.08,0,90],[0,1.09,180]]){
     place('chair',tx+dx+jitter()*.2,ty+dy+jitter()*.2,rotation);
    }
   }
  }
  place('shelf',x+1.5,wallRow,90);
  place('barrel',x+w-1.07,y+1.1);
  place('barrel',x+w-1.55,y+1.13);
  place('hearth',x+1.09,nearBottom);
 }else if(kind==='bedroom'){
  place('rug',cx,cy);
  const bedLeft=random()>.5;
  place('bed',bedLeft?x+1.08:x+w-1.08,y+1.55,bedLeft?90:270);
  place('chest',bedLeft?x+w-1.1:x+1.1,y+1.18);
  place('cabinet',bedLeft?x+w-1.15:x+1.15,nearBottom);
  place('chair',cx-.75,cy+.12);
 }else if(kind==='library'){
  place('rug',cx,cy);
  // Shelves hug structural walls, leaving a navigable center and clear entrance.
  for(let sx=x+1.06;sx<=x+w-1.03;sx+=1.25)place('shelf',sx,wallRow);
  place('table',cx,cy);
  place('chair',cx,cy-.91,180);
  place('chair',cx,cy+.91,0);
  place('cabinet',x+1.14,nearBottom,90);
 }else{
  place('rug',cx,cy);
  place(random()>.5?'table':'pillar',cx,cy);
  place('chest',x+1.04,y+1.1);
  place('crate',x+w-1.1,y+1.1);
 }
 return placed;
}
