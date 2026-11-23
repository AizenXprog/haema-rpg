/** Minimal safe inline manuscript formatter. No HTML execution or markdown injection. */
export function appendInlineFormatted(parent,value){
 const source=String(value??''),pattern=/\*\*([^*\n]+)\*\*|\*([^*\n]+)\*/g;
 let from=0,match;
 while((match=pattern.exec(source))){
  if(match.index>from)parent.append(document.createTextNode(source.slice(from,match.index).replace(/\*\*/g,'')));
  const el=document.createElement(match[1]!==undefined?'strong':'em');
  el.textContent=match[1]??match[2];
  parent.append(el);
  from=pattern.lastIndex;
 }
 if(from<source.length)parent.append(document.createTextNode(source.slice(from).replace(/\*\*/g,'')));
 return parent;
}
