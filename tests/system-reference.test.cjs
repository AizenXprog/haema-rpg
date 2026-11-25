'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ref=require('../rules-system-reference.js');
const old=require('../rules-unified-playtest.js');

test('edição de referência e conceitos são distintos de números experimentais',()=>{
 assert.equal(ref.VERSION,'2026.11.25-reference');
 assert.equal(ref.STATUS.canon,'base-oficial');
 assert.equal(ref.DRAFT_RULES.creation.status,'protocolo-experimental');
 assert.equal(ref.DRAFT_RULES.parry.procedureStatus,'a-decidir');
});
test('seis atributos e vinte e quatro competências idênticos ao laboratório Unificado',()=>{
 assert.deepEqual(ref.ATTRIBUTES,old.ATTR);
 assert.deepEqual(ref.SKILLS,old.SKILLS);
 assert.equal(new Set(ref.SKILLS).size,24);
 assert.equal(ref.DRAFT_RULES.creation.attributesUpgrades,4);
 assert.equal(ref.DRAFT_RULES.creation.skillsUpgrades,6);
 assert.equal(ref.DRAFT_RULES.creation.maxStartingDie,6);
 assert.equal(ref.DRAFT_RULES.creation.guard,6);
});
test('Defesa e Integridade do protocolo coincidem com motor de laboratório',()=>{
 for(const die of ref.DICE){
  assert.equal(ref.defense(die),old.defense(die));
  assert.equal(ref.integrity(die),old.integrity(die));
 }
 assert.equal(ref.defense(6),6);
 assert.equal(ref.integrity(4),10);
 assert.throws(()=>ref.defense(20));
 assert.throws(()=>ref.integrity(0));
});
test('Regências são sete conhecidas, distintas e não incluem Metus ou Motus',()=>{
 assert.equal(ref.REGENCIES.length,7);
 assert.equal(new Set(ref.REGENCIES.map(x=>x.name)).size,7);
 assert.deepEqual(ref.REGENCIES.map(x=>x.name),old.REGENCIES);
 assert.equal(ref.REGENCIES.some(x=>/Metus|Motus/.test(x.name)),false);
});
test('Primeira Ressonância usa 3d4 posicionados, correspondências EXATAS por posição',()=>{
 const pattern=[1,2,3];
 const results=[
  {choice:[4,3,2],matches:0,awakened:false,echo:false,penalty:null},
  {choice:[1,4,4],matches:1,awakened:true,echo:true,penalty:2},
  {choice:[1,2,4],matches:2,awakened:true,echo:true,penalty:1},
  {choice:[1,2,3],matches:3,awakened:true,echo:true,penalty:0}
 ];
 for(const v of results){
  const result=ref.resonance(pattern,v.choice);
  assert.equal(result.matches,v.matches);
  assert.equal(result.awakened,v.awakened);
  assert.equal(result.echo,v.echo);
  assert.equal(result.dtPenalty,v.penalty);
 }
 assert.equal(ref.echoDT(1),7);assert.equal(ref.echoDT(2),6);assert.equal(ref.echoDT(3),5);
 assert.throws(()=>ref.echoDT(0));assert.throws(()=>ref.resonance([1,2,3],[0,2,3]));
 assert.throws(()=>ref.resonance([1,2,3],[1,2]));
});
test('ficha futura tem até 3 folhas, 24 competências, e não reproduz barras removidas',()=>{
 assert.equal(ref.SHEET.maxPages,3);
 assert.deepEqual(ref.SHEET.pages.map(x=>x.number),[1,2,3]);
 assert.equal(ref.DRAFT_RULES.activeGeneralResources.includes('folego'),false);
 assert.equal(ref.DRAFT_RULES.inactiveOrReserved.includes('folego'),true);
 assert.equal(ref.DRAFT_RULES.inactiveOrReserved.includes('ignis'),true);
 assert.equal(ref.DRAFT_RULES.parry.learnedOnly,true);
 assert.equal(ref.DRAFT_RULES.parry.treeNode,'s1:1:4');
});
test('entradas públicas apresentam referência oficial sem apagar manual experimental',()=>{
 const system=fs.readFileSync('sistema.html','utf8');
 const index=fs.readFileSync('index.html','utf8');
 const main=fs.readFileSync('sistema-oficial.html','utf8');
 const manual=fs.readFileSync('manual-unificado.html','utf8');
 const doc=fs.readFileSync('docs/SISTEMA_MESTRE_CONSOLIDADO_20261125.md','utf8');
 for(const name of ['Kórven','Sælir','Vraek','Ithren','Ossyra','Nælth','Eyris'])assert.ok(main.includes(name),'Falta Regência '+name);
 assert.ok(system.includes('href="sistema-oficial.html"'));
 assert.ok(index.includes('href="sistema-oficial.html"'));
 assert.ok(main.includes('rules-system-reference.js'));
 assert.ok(main.includes('sistema-oficial.html')===false,'Sem link circular para a própria página');
 assert.ok(manual.includes('unified-20261125'));
 assert.match(main,/Primeira Ressonância/);
 assert.match(main,/Parry/);
 assert.match(doc,/\[PENDENTE CRÍTICO\]/);
 assert.match(doc,/não utiliza barras universais de Fôlego/i);
 assert.match(doc,/Site e Sistema criado por Vitor Monte/);
 assert.ok(!main.includes('HAEMA_BIBLIA_MESTRA.md'),'Não exibir caminho de documento privado');
});
