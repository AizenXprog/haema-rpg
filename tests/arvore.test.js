'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const lib=require('../arvore-data.js');
const {nodes,map,sectors,edges,key,nextNodes,canUnlock,formatCost}=lib;
test('sete setores e 631 nós sem IDs repetidos',()=>{
 assert.equal(sectors.length,7);assert.equal(nodes.length,631);assert.equal(new Set(nodes.map(n=>n.id)).size,nodes.length);assert.equal(edges.length,630);
});
test('todo nó não inicial tem um único pai válido',()=>{
 for(const n of nodes){if(n.id==='origem'){assert.equal(n.parent,null);continue;}assert.ok(map.has(n.parent),n.id);assert.ok(n.rank>=1&&n.rank<=24);}
});
test('cada escolha abre somente um próximo nó na ponta atual',()=>{
 assert.equal(nextNodes([]).length,7);
 let path=[];const first=nextNodes(path)[0];assert.ok(canUnlock(path,first.id));
 path.push(first.id);assert.equal(nextNodes(path).length,1);
 for(let i=0;i<5;i++)path.push(nextNodes(path)[0].id);
 assert.equal(nextNodes(path).length,2);
 const fork=nextNodes(path)[0];path.push(fork.id);assert.ok(!canUnlock(path,nextNodes(path.slice(0,-1))[1].id));
});
test('um caminho completo tem 24 passos e custo 180 PE',()=>{
 const path=[];for(let i=0;i<24;i++){const choices=nextNodes(path);assert.ok(choices.length>=1);path.push(choices[0].id)}
 assert.equal(path.length,24);assert.equal(formatCost(path),180);assert.equal(nextNodes(path).length,0);
});
test('nós de Regências pedem Despertar e ápices estão na geração final',()=>{
 assert.ok(nodes.filter(x=>x.sector==='regencias').every(n=>n.lockedByAwakening));
 assert.equal(nodes.filter(x=>x.type==='apex').length,56);
 assert.ok(nodes.some(x=>x.name==='Ceifa Encadeada'));
 assert.ok(nodes.some(x=>x.name==='Ressonância Dupla'));
});