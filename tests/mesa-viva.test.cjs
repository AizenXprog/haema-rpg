'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {reconcile,sanitizeStats}=require('../painel-mesa-viva.js');
test('mesa inicia todos os personagens cadastrados sem números inventados',()=>{
 const ids=Array.from({length:5},(_,i)=>({id:'c'+i,title:'P'+i}));
 const v=reconcile(null,ids);
 assert.equal(v.order.length,5);
 assert.equal(v.round,0);
 assert.equal(v.characters.c0.integridade,null);
 assert.equal(v.characters.c0.folego,null);
 assert.equal(v.characters.c0.reaction,true);
});
test('estado salvo preserva recursos, inimigos e ordem sem personagens estranhos',()=>{
 const v=reconcile({round:2,index:1,order:['inimigo_a','c2','forged'],characters:{c2:{integridade:8,folego:3,metus:2,condition:'Atordoado',reaction:false},forged:{integridade:99}},enemies:[{id:'inimigo_a',name:'Vigia',stats:{integridade:12}}]},[{id:'c2',title:'A'}]);
 assert.deepEqual(v.order,['inimigo_a','c2']);
 assert.equal(v.characters.c2.integridade,8);
 assert.equal(v.characters.c2.reaction,false);
 assert.equal(v.enemies[0].stats.integridade,12);
 assert.equal(v.characters.forged,undefined);
});
test('rejeita valores negativos, recursos inexistentes e conteúdo exagerado',()=>{
 const stats=sanitizeStats({integridade:-10,folego:2000,ferimentos:'',metus:'nan',reaction:false,condition:'x'.repeat(300)});
 assert.equal(stats.integridade,0);
 assert.equal(stats.folego,999);
 assert.equal(stats.ferimentos,null);
 assert.equal(stats.metus,0);
 assert.equal(stats.reaction,false);
 assert.equal(stats.condition.length,160);
});
test('ordem de combate preserva atores ativos e limita adversários',()=>{
 const many=Array.from({length:50},(_,i)=>({id:'inimigo_'+i,name:'X',stats:{folego:3}}));
 const v=reconcile({round:7,index:9999,enemies:many,order:many.map(e=>e.id)},[{id:'c1'}]);
 assert.equal(v.enemies.length,30);
 assert.equal(v.order.length,31);
 assert.equal(v.index,30);
});
