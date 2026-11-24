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
test('Parry só é conquistado dentro da rota de Defesa, não é ação universal',()=>{
 const parry=tree.map.get('s1:1:4');
 assert.equal(parry.name,'Parry · Defesa Perfeita');
 assert.equal(parry.rank,10);
 assert.equal(parry.status,'ready');
 assert.equal(parry.parent,'s1:1:3');
 assert.match(parry.effect,/Sem este nó, o personagem não tem acesso ao Parry/);
 const start=[];
 assert.equal(tree.canUnlock(start,parry.id),false);
 assert.equal(tree.canUnlock(start,'s1:x:1'),true);
});

const guides=require('../arvore-treinamentos.js');
test('todas as 126 técnicas explicam COMO USAR e concedem benefício aprendido mensurável',()=>{
 const learned=tree.nodes.filter(n=>n.status==='ready'&&n.id!=='origem');
 assert.equal(learned.length,126);
 const effects=new Set(),examples=new Set();
 for(const n of learned){
  const entry=guides.get(n);
  assert.ok(entry,'Guia ausente para '+n.id);
  assert.equal(n.trigger,entry.trigger,'Uso inconsistente em '+n.id);
  assert.equal(n.effect,entry.effect,'Vantagem inconsistente em '+n.id);
  assert.equal(n.limit,entry.limit,'Limite inconsistente em '+n.id);
  assert.equal(n.example,entry.example,'Exemplo inconsistente em '+n.id);
  for(const field of ['trigger','effect','limit','example'])
   assert.ok(n[field].length>=45,n.id+' sem explicação suficiente em '+field);
  assert.match(n.trigger,/(declare|antes|ap[oó]s|quando|gaste|observe|escolha|prepare|identifique|durante|tenha)/i,n.id+' não ensina o momento de ativar');
  assert.match(n.effect,/(\+1|\bDT\b|reduz|acrescente|conserv|ignore|desbloque|receba|some|ganhe|evite|aumente|desloque)/i,n.id+' sem vantagem verificável');
  assert.match(n.limit,/(vez|cena|sess[aã]o|rea[cç][aã]o|preparo|limite)/i,n.id+' sem limite de uso');
  effects.add(n.effect);examples.add(n.example);
 }
 assert.equal(effects.size,126,'Vantagens copiadas/duplicadas');
 assert.equal(examples.size,126,'Exemplos sem individualidade');
});
test('Parry continua adquirido apenas no ramo de Defesa e sob protocolo experimental',()=>{
 const n=tree.map.get('s1:1:4');
 assert.match(n.effect,/Sem este nó, o personagem não tem acesso ao Parry/);
 assert.match(n.trigger,/depois|antes|declare|Despertar|Reação/i);
 assert.match(n.limit,/ainda precisam de aprovação/);
 assert.equal(guides.get(tree.map.get('s0:x:1')).effect,tree.map.get('s0:x:1').effect);
});
