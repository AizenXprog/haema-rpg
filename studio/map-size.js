// HÆMA Estúdio 0.5 LAB — document dimensions are independent of the editor.
export const MAP_SIZE_LIMITS=Object.freeze({min:8,max:80,maxCells:6400});
export function validateMapSize(cols,rows){
 const c=Number(cols),r=Number(rows);
 if(!Number.isInteger(c)||!Number.isInteger(r)||c<8||r<8||c>80||r>80||c*r>6400)
  throw Error('Defina largura e altura entre 8 e 80 células.');
 return {cols:c,rows:r};
}
export function createEmptyMap(template,cols,rows,name='Novo mapa'){
 const size=validateMapSize(cols,rows),count=size.cols*size.rows;
 return {...template,...size,name:String(name).trim().slice(0,80)||'Novo mapa',
  tiles:Array(count).fill('grass'),fog:Array(count).fill(0),heights:Array(count).fill(0),
  props:[],tokens:[],walls:[],paths:[],surfaceStrokes:[],background:null};
}
export function resizeMapScene(current,cols,rows){
 const size=validateMapSize(cols,rows),beforeCols=current.cols,beforeRows=current.rows;
 const count=size.cols*size.rows,sharedCols=Math.min(beforeCols,size.cols),sharedRows=Math.min(beforeRows,size.rows);
 const tiles=Array(count).fill('grass'),fog=Array(count).fill(1),heights=Array(count).fill(0);
 for(let y=0;y<sharedRows;y++)for(let x=0;x<sharedCols;x++){
  const old=y*beforeCols+x,next=y*size.cols+x;
  tiles[next]=current.tiles[old]||'grass';fog[next]=current.fog[old]?1:0;heights[next]=current.heights?.[old]||0;
 }
 const inside=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<=size.cols&&p.y<=size.rows;
 const props=(current.props||[]).filter(inside),tokens=(current.tokens||[]).filter(inside);
 const walls=(current.walls||[]).filter(w=>inside({x:w.x1,y:w.y1})&&inside({x:w.x2,y:w.y2}));
 const paths=(current.paths||[]).filter(p=>Array.isArray(p.points)&&p.points.every(inside));
 const surfaceStrokes=(current.surfaceStrokes||[]).filter(p=>Array.isArray(p.points)&&p.points.every(inside));
 let paintedCells=0;
 for(let y=0;y<beforeRows;y++)for(let x=0;x<beforeCols;x++){
  if(x<size.cols&&y<size.rows)continue;
  const i=y*beforeCols+x;
  if(current.tiles[i]!=='grass'||(current.heights?.[i]||0)!==0)paintedCells++;
 }
 return {scene:{...current,...size,tiles,fog,heights,props,tokens,walls,paths,surfaceStrokes},
  cropped:beforeCols>size.cols||beforeRows>size.rows,
  removed:{paintedCells,props:(current.props||[]).length-props.length,
   tokens:(current.tokens||[]).length-tokens.length,walls:(current.walls||[]).length-walls.length,
   paths:(current.paths||[]).length-paths.length,
   surfaceStrokes:(current.surfaceStrokes||[]).length-surfaceStrokes.length}};
}
