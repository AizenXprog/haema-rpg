// HÆMA Archive — pure catalog utilities. No network or credential access.
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const tokens = value => normalize(String(value).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')).split(/[^a-z0-9]+/).filter(Boolean);
const vocabulary = [
 ['dragon','dragao','dragoes'], ['forest','floresta','florestal','bosque'], ['trail','trilha','caminho'], ['night','noite','noturno','noturna'],
 ['wood','madeira','madeirado'], ['stone','pedra','rocha'], ['metal','metalico','metalica'], ['rusty','enferrujado','enferrujada'],
 ['bloody','ensanguentado','ensanguentada','sangue'], ['broken','quebrado','quebrada'], ['fallen','caido','caida'],
 ['red','vermelho','vermelha'], ['black','preto','preta','negro','negra'], ['white','branco','branca'], ['blue','azul'], ['green','verde'], ['gold','dourado','dourada','ouro'], ['silver','prata','prateado','prateada'], ['gray','grey','cinza'],
 ['sword','swords','espada','espadas'], ['shield','escudo'], ['bow','arco'], ['dagger','daggers','adaga','adagas'], ['greataxe','machado'], ['spear','lanca'], ['staff','cajado'], ['magic','magia','magico','magica'], ['fire','fogo'], ['lightning','raio','relampago'],
 ['table','mesa'], ['chair','cadeira'], ['ladder','escada'], ['door','porta'], ['window','janela'], ['wall','parede'], ['floor','piso','chao'], ['altar','altar'], ['tree','arvore','arvores'], ['water','agua'], ['river','rio'], ['snow','neve'], ['desert','deserto'], ['bridge','ponte'],
 ['barbarian','barbaro'], ['bard','bardo'], ['cleric','clerigo'], ['druid','druida'], ['fighter','guerreiro'], ['wizard','mago'], ['sorcerer','feiticeiro'], ['rogue','ladino'], ['paladin','paladino'], ['monk','monge'], ['ranger','patrulheiro'], ['warlock','bruxo'],
 ['beast','besta','animal'], ['undead','morto-vivo'], ['fiend','demonio'], ['elemental','elemental'], ['gridless','semgrade'], ['grid','grade'], ['canopy','copa']
];
const aliases = new Map();
for (const group of vocabulary) for (const word of group) aliases.set(word, new Set(group));
const image = /\.(png|webp|jpe?g|gif|avif|svg|bmp|tiff?)$/i;
const ignored = new Set(['de','da','do','das','dos','com','e','um','uma']);
export function buildCatalog(text, root = '/') {
 const groups = new Map();
 const prefix = root.endsWith('/') ? root : root + '/';
 for (const raw of String(text).split(/\r?\n/)) {
  const path = raw.replace(/^\uFEFF/, '');
  if (!path.startsWith(prefix) || !image.test(path)) continue;
  const match = path.match(image), format = match[1].toLowerCase();
  const key = path.slice(0, -match[0].length);
  let item = groups.get(key);
  if (!item) {
   const name = key.slice(key.lastIndexOf('/') + 1);
   const terms = new Set(tokens(key.slice(prefix.length)));
   for (const term of [...terms]) for (const alias of aliases.get(term) ?? []) terms.add(alias);
   if (terms.has('gridless')) terms.add('semgrade');
   item = { id:key, name, variants:[], terms:[...terms] };
   groups.set(key,item);
  }
  if (!item.variants.some(v => v.path === path)) item.variants.push({format, path});
 }
 return [...groups.values()];
}
export function searchCatalog(catalog, query, {offset=0,limit=48}={}) {
 const q = normalize(query).replace(/\bsem\s+grade\b/g,'semgrade').replace(/\bmorto[ -]vivo\b/g,'mortovivo');
 const words = tokens(q).filter(x => !ignored.has(x));
 const result = [];
 let total = 0;
 for (const item of catalog) {
  if (!words.every(w => item.terms.includes(w) || (w==='mortovivo' && item.terms.includes('undead')))) continue;
  if (total >= offset && result.length < limit) result.push(item);
  total++;
 }
 return {total, items:result};
}
