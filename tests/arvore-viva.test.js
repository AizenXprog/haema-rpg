'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const tree=require('../arvore-data.js');
test('631 nós, mesma topologia, custo, pai e chaves',()=>{
 assert.equal(tree.nodes.length,631);assert.equal(tree.edges.length,630);assert.equal(new Set(tree.nodes.map(n=>n.id)).size,631);
 assert.equal(tree.nodes.filter(n=>n.status==='ready').length,127);
 assert.equal(tree.nodes.filter(n=>n.status==='draft').length,504);
 for(const node of tree.nodes){if(node.id!=='origem')assert.equal(tree.map.get(node.id).parent,node.parent)}
});
test('126 habilidades iniciais distintas e preenchidas',()=>{
 const ready=tree.nodes.filter(n=>n.status==='ready'&&n.id!=='origem');
 assert.equal(ready.length,126);
 assert.equal(new Set(ready.map(x=>x.name)).size,126);
 for(const n of ready){assert.ok(n.trigger?.length>20,n.id);assert.ok(n.effect?.length>30,n.id);assert.ok(n.limit?.length>20,n.id);assert.ok(n.example?.length>20,n.id);}
});
test('56 ápices em projeto possuem nomes próprios únicos e não podem ser comprados por padrão',()=>{
 const caps=tree.nodes.filter(n=>n.type==='apex');assert.equal(caps.length,56);
 assert.equal(new Set(caps.map(n=>n.name)).size,56);
 assert.ok(caps.every(n=>n.status==='draft'));
});
test('conserva o caminho ramificado e os 180 PE',()=>{
 const path=[];for(let i=0;i<24;i++){let candidates=tree.nextNodes(path);assert.ok(candidates.length);path.push(candidates[0].id)}
 assert.equal(tree.formatCost(path),180);
 assert.ok(!tree.canUnlock(path,'s2:x:1'));
});