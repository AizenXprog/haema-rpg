// HÆMA Studio LAB — coalesce UI events into a single canvas paint per frame.
export function createRenderScheduler(draw,{schedule=fn=>requestAnimationFrame(fn),cancel=id=>cancelAnimationFrame(id)}={}){
 let pending=null,disposed=false;
 const paint=()=>{pending=null;if(!disposed)draw();};
 return {
  request(){
   if(disposed||pending!==null)return;
   pending=schedule(paint);
  },
  flush(){
   if(disposed||pending===null)return;
   cancel(pending);pending=null;draw();
  },
  dispose(){
   disposed=true;
   if(pending!==null){cancel(pending);pending=null;}
  },
  get pending(){return pending!==null;}
 };
}
