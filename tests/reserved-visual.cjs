/* Regression checks for reserved-library UX. Run: node tests/reserved-visual.cjs */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const read=path=>fs.readFileSync(path,'utf8');
const reader=read('reserved-books.js');
const atmosphere=read('reserved-atmosphere.js');
const css=read('reserved-books.css');
const app=read('app.js');
const html=read('biblioteca.html');
let count=0;
function check(condition,message){assert.ok(condition,message);count++;}
check(!reader.includes("button('Enigma'"),'Leitor não deve denunciar o enigma na navegação fixa');
check(reader.includes("/^VII\\s*[—-]/i.test"),'Anexo deve aparecer apenas no capítulo VII');
check(reader.includes('reserved-annotation-trigger'),'Anexo precisa de entrada contextual');
check(reader.includes('Voltar ao manuscrito'),'Leitura deve ser retomável');
check(reader.includes('createReservedAtmosphere(dialog,info.theme)'),'Atmosfera precisa ativar ao abrir');
check(reader.includes('atmosphere?.dispose()'),'Atmosfera precisa ser destruída ao fechar');
check(!reader.includes('expected_answer'),'Gabarito não pode estar embutido no leitor');
check(css.includes('.cursor-ready .reserved-reader *{cursor:auto!important}'),'Ponteiro nativo em diálogos');
check(css.includes('reserved-book-leaves')&&css.includes('reserved-cover-corner'),'Profundidade física da capa');
for(const theme of ['archive','crown','regencies']){
 check(css.includes('reserved-reader.theme-'+theme+' .reserved-scenery'),'Ambiente '+theme);
 check(reader.includes("theme:'"+theme+"'"),'Tema cadastrado '+theme);
}
check(atmosphere.includes('prefers-reduced-motion')&&atmosphere.includes('document.hidden'),'Respeitar movimento reduzido e página oculta');
check(atmosphere.includes('observer?.disconnect()')&&atmosphere.includes('cancelAnimationFrame(raf)'),'Parar animação ao fechar');
check(app.includes("reserved-books.js?v=2"),'SPA deve carregar JS atualizado');
check(html.includes('reserved-books.css?v=2'),'CSS atualizado no HTML');
check(html.includes('reserved-books.js?v=2'),'JS atualizado no HTML');
console.log('HÆMA: '+count+' verificações de regressão da Biblioteca aprovadas.');
