'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const h=require('../rules-unified-playtest.js');
test('criação: limites e versão isolada',()=>{
 const c=h.createdCharacter();
 assert.equal(h.validateCreation(c).valid,true);
 assert.equal(h.integrity(4),10);assert.equal(h.integrity(6),12);
 assert.equal(h.defense(6),6);assert.equal(h.defense(8,{shield:true,partialCover:true}),9);
 c.attributes=[6,6,6,6,6,4];assert.equal(h.validateCreation(c).valid,false);
 c.attributes=[6,6,6,6,4,4];c.skills=Array(24).fill(4);
 for(let i=0;i<6;i++)c.skills[i]=6;
 assert.equal(h.validateCreation(c).valid,true);
 c.skills[6]=8;assert.equal(h.validateCreation(c).valid,false);
});
test('resultados naturais, crítico e Invicta',()=>{
 const r=h.exceptional({aFace:6,bFace:6,aRoll:6,bRoll:5,dt:6,realDanger:true});
 assert.equal(r.critical,true);assert.equal(r.invictaEligible,false);
 assert.equal(h.exceptional({aFace:6,bFace:8,aRoll:6,bRoll:7,dt:7,realDanger:true}).invictaEligible,true);
 assert.equal(h.exceptional({aFace:6,bFace:8,aRoll:6,bRoll:7,dt:7,realDanger:false}).invictaEligible,false);
 assert.equal(h.exceptional({aFace:4,bFace:4,aRoll:4,bRoll:4,dt:6}).critical,false);
 assert.equal(h.test({aFace:6,bFace:4,aRoll:4,bRoll:3,dt:7}).success,true);
 assert.equal(h.test({aFace:6,bFace:4,aRoll:4,bRoll:3,dt:7,possible:false}).success,false);
 assert.throws(()=>h.test({aFace:6,bFace:4,aRoll:4,bRoll:3,dt:7,modifier:3}));
});
test('probabilidades exatas enumeradas do relatório',()=>{
 const close=(x,y)=>assert.ok(Math.abs(x-y)<0.000001,x+' != '+y);
 close(h.probability(6,6,7,'critical'),3/36);
 close(h.probability(8,8,7,'critical'),3/64);
 close(h.probability(6,6,6,'success'),26/36);
 close(h.probability(6,8,7,'invicta'),3/48);
});
test('combate mantém escolha exclusiva Impacto/Virada',()=>{
 const attack={aFace:6,bFace:6,aRoll:6,bRoll:5,defenseValue:6,weaponFace:6,weaponRoll:4,armor:1,parry:1};
 assert.equal(h.attack({...attack,criticalChoice:'impact'}).damage,4);
 assert.equal(h.attack({...attack,criticalChoice:'virada'}).damage,2);
 assert.equal(h.attack({...attack,criticalChoice:'virada'}).virada,true);
 assert.equal(h.attack({...attack,dodged:true}).damage,0);
 assert.equal(h.apexStrike(6,{armor:1,parry:1}),6);
});
test('Metus anula estritamente menores, Latebra preserva marcas',()=>{
 assert.deepEqual(h.metus(4,6,6).rolls,[0,6]);
 assert.deepEqual(h.metus(6,6,6).rolls,[6,6]);
 assert.deepEqual(h.metus(4,6,5).rolls,[0,6]);
 assert.deepEqual(h.metus(5,6,5).rolls,[5,6]);
 const rolls=[2,2,4],marks=h.initialLatebra(6,()=>rolls.shift());
 assert.deepEqual(marks,[2,4]);
 const search=h.searchLatebra([2,4,5],[4,1]);
 assert.deepEqual(search.remaining,[2,5]);assert.equal(search.located,false);
});
test('ferimentos e custos de evolução',()=>{
 assert.deepEqual(h.damageState({current:10,max:10,wounds:0,damage:6}),
  {integrity:4,wounds:1,incapacitated:false,newWound:true});
 assert.equal(h.progressCost('competencia',4),6);
 assert.equal(h.progressCost('competencia',10),24);
 assert.equal(h.progressCost('guarda',6),12);
 assert.equal(h.progressCost('atributo',8),34);
});

test('catálogo completo de 22 técnicas: ids, custos e requisitos',()=>{
 const catalog=require('../techniques-unified-playtest.js');
 assert.equal(catalog.length,22);
 assert.equal(new Set(catalog.map(t=>t.id)).size,22);
 assert.equal(catalog[0].name,'Manobra Segura');
 assert.equal(catalog[21].name,'Trajeto Preparado');
 for(const t of catalog){
  assert.ok(t.name&&t.requirement&&t.effect);
  assert.ok([4,8,12].includes(t.cost));
 }
});
test('páginas experimentais existem e não importam núcleo legado',()=>{
 const fs=require('node:fs');
 for(const name of ['manual-unificado.html','laboratorio-unificado.html','tecnicas-unificadas.html']){
  const html=fs.readFileSync(require('node:path').join(__dirname,'..',name),'utf8');
  assert.match(html,/CANDIDATO|candidato|playtest/i);
  assert.match(html,/Site e Sistema criado por/);
  assert.doesNotMatch(html,/#E6D5BB|#B53D56|#C98C50|#356E9A|#796985|#4AA69D|#D9C86E/);
 }
 const lab=fs.readFileSync(require('node:path').join(__dirname,'..','laboratorio-unificado.js'),'utf8');
 assert.match(lab,/haema-character-unified-playtest-20261119/);
 assert.doesNotMatch(lab,/localStorage\.removeItem/);
});

test('incapacitação, primeiros socorros, segurança e descanso',()=>{
 let state={integrity:0,deathRisks:0,stable:false,firstDeathCheckDone:false};
 state=h.deathRisk(state,{kind:'turn',rollSuccess:false});
 assert.equal(state.deathRisks,1);
 state=h.deathRisk(state,{kind:'turn',rollSuccess:false});
 assert.equal(state.deathRisks,1,'Primeiro teste ocorre uma vez');
 state=h.deathRisk(state,{kind:'dangerRound',underThreat:false});
 assert.equal(state.deathRisks,1,'Sem ameaça efetiva não aumenta');
 state=h.deathRisk(state,{kind:'dangerRound',underThreat:true});
 assert.equal(state.deathRisks,2);
 state=h.deathRisk(state,{kind:'effectiveDamage',underThreat:true});
 assert.equal(state.deathRisks,3);assert.equal(state.dead,true);
 assert.equal(h.aid({withKit:true,attributeRoll:2,medicineRoll:3}).success,true);
 assert.equal(h.aid({withKit:false,attributeRoll:2,medicineRoll:3}).success,false);
 assert.equal(h.safeRecovery({current:0,max:12,safe:true,stable:true,minutes:10}).integrity,1);
 assert.equal(h.safeRecovery({current:0,max:12,safe:false,stable:true,minutes:10}).integrity,0);
 assert.equal(h.longRest({current:10,max:12,rollValue:5,safe:true}).integrity,12);
 assert.equal(h.longRest({current:10,max:12,rollValue:5,safe:false}).integrity,10);
});
test('quatro modalidades de Ápice respeitam oportunidade e custo',()=>{
 for(const type of ['golpe','protecao','superacao','tanger']){
  const denied=h.apex(type,{stored:0,actionSucceeded:true,validAnchor:true,adjacent:true,reactionAvailable:true,physicallyPossible:true,stableDiscovery:true,choiceOffered:true});
  assert.equal(denied.allowed,false);
  const allowed=h.apex(type,{stored:1,actionSucceeded:true,validAnchor:true,adjacent:true,reactionAvailable:true,physicallyPossible:true,stableDiscovery:true,choiceOffered:true});
  assert.equal(allowed.allowed,true);assert.equal(allowed.remaining,0);
 }
 assert.equal(h.apex('protecao',{stored:1,adjacent:false,reactionAvailable:true,physicallyPossible:true}).allowed,false);
 assert.equal(h.apex('tanger',{stored:1,actionSucceeded:true,validAnchor:true,stableDiscovery:false}).allowed,false);
 assert.equal(h.apex('superacao',{stored:1,actionSucceeded:true,physicallyPossible:true,choiceOffered:false}).allowed,false);
});
test('portal usa versão separada e não derruba verificação da 0.1',()=>{
 const fs=require('node:fs');
 const portal=fs.readFileSync(require('node:path').join(__dirname,'..','portal.js'),'utf8');
 assert.match(portal,/editUnifiedCharacter/);
 assert.match(portal,/editCharacter\(panel,root,character,!mine\)/);
 assert.match(portal,/rules_version:core.VERSION/);
 assert.match(portal,/rules_version:'0.1'/);
 const schema=fs.readFileSync(require('node:path').join(__dirname,'..','docs','UNIFIED_PLAYTEST_CHARACTERS_MIGRATION.sql'),'utf8');
 assert.match(schema,/BEGIN;/);assert.match(schema,/COMMIT;/);
 assert.match(schema,/unified-playtest-20261119/);
 assert.doesNotMatch(schema,/DROP TABLE|TRUNCATE|DELETE FROM/i);
});

test('técnicas: todos os requisitos mapeados, sem compra livre',()=>{
 const engine=require('../techniques-unified-logic.js'),catalog=engine.catalog;
 const all=h.createdCharacter();
 for(const technique of catalog){
  assert.equal(engine.requirement(technique,all).met,false,'Iniciante d4 não cumpre requisito de '+technique.name);
 }
 all.skills=Array(24).fill(12);all.pe=50;
 for(const technique of catalog){
  const eligible=engine.evaluate(all,technique.id);
  assert.equal(eligible.allowed,false,'Exige validação do mestre');
  const r=engine.acquire(all,technique.id,{masterApproved:true});
  assert.equal(r.ok,true,technique.name);
  assert.equal(r.character.pe,50-technique.cost);
  assert.equal(r.character.techniques.includes(technique.name),true);
  assert.equal(all.pe,50,'Não deve mutar a ficha de origem');
  assert.equal(engine.acquire({...all,pe:0},technique.id,{masterApproved:true}).ok,false);
 }
 all.skills=Array(24).fill(4);all.pe=50;
 all.skills[h.SKILLS.indexOf('Medicina')]=6;
 assert.equal(engine.evaluate(all,7,{masterApproved:true}).allowed,false,'Socorro em Retirada exige também Atletismo');
 all.skills[h.SKILLS.indexOf('Atletismo')]=6;
 assert.equal(engine.evaluate(all,7,{masterApproved:true}).allowed,true);
});

test('modificadores afetam sucesso, nunca a margem natural do crítico',()=>{
 const r=h.exceptional({aFace:6,bFace:6,aRoll:6,bRoll:5,dt:12,modifier:1});
 assert.equal(r.success,true);
 assert.equal(r.margin,-1);
 assert.equal(r.critical,false);
 const other=h.exceptional({aFace:6,bFace:6,aRoll:6,bRoll:5,dt:10,modifier:-2});
 assert.equal(other.success,false);
 assert.equal(other.critical,false);
});

test('Tanger exige descoberta, Despertar, âncora e preparação; ensaio tem DT+1',()=>{
 const d={regency:'Kórven',state:'provisoria',scale:'intervencao',
  phenomenon:'tensão',anchor:'suporte',competence:'Engenharia',effect:'redistribuir tensão',
  limits:'uma junta',duration:'rodada',signal:'marca visível',counterplay:'romper suporte',
  risk:'desgaste anunciado'};
 assert.equal(h.validateDiscovery(d).valid,true);
 const base={discovery:d,awakened:['Kórven'],regencyFace:4,skillFace:6,
  regencyRoll:4,skillRoll:4,anchored:true,possible:true};
 const result=h.tanger(base);assert.equal(result.allowed,true);assert.equal(result.dt,7);
 const essay=h.tanger({...base,essay:true});assert.equal(essay.dt,8);
 assert.equal(h.tanger({...base,awakened:[]}).allowed,false);
 assert.equal(h.tanger({...base,anchored:false}).allowed,false);
 assert.equal(h.tanger({...base,discovery:{...d,state:'suspeita'}}).allowed,false);
 assert.equal(h.stabilizeDiscovery({discovery:d,pe:8,studyConfirmed:true}).remainingPE,0);
 assert.equal(h.stabilizeDiscovery({discovery:d,pe:7,studyConfirmed:true}).allowed,false);
 assert.equal(h.stabilizeDiscovery({discovery:d,pe:8,studyConfirmed:false}).allowed,false);
 const major={...d,scale:'maior',state:'estavel'};
 assert.equal(h.tanger({...base,discovery:major,preparations:1,canSustain:true}).allowed,false);
 assert.equal(h.tanger({...base,discovery:major,preparations:2,canSustain:true}).allowed,true);
});

test('evolução real: uma etapa, custo PE, vivência e sem mutação',()=>{
 const c=h.createdCharacter();c.pe=40;
 assert.equal(h.improveDie(c,{type:'competencia',index:0,experienced:true,masterApproved:true}).ok,true);
 const skill=h.improveDie(c,{type:'competencia',index:0,experienced:true,masterApproved:true});
 assert.equal(skill.cost,6);assert.equal(skill.to,6);assert.equal(skill.character.pe,34);
 assert.equal(c.skills[0],4);assert.equal(c.pe,40);
 assert.equal(h.improveDie(c,{type:'competencia',index:0,experienced:false,masterApproved:true}).ok,false);
 assert.equal(h.improveDie({...c,pe:5},{type:'competencia',index:0,experienced:true,masterApproved:true}).ok,false);
 const guard=h.improveDie(c,{type:'guarda',experienced:true,masterApproved:true});
 assert.equal(guard.cost,12);assert.equal(guard.character.guard,8);
 assert.equal(h.improveDie(c,{type:'atributo',index:6,experienced:true,masterApproved:true}).ok,false);
});

test('contrato dos controles de laboratório: todo ID usado existe no HTML',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const html=fs.readFileSync(path.join(__dirname,'..','laboratorio-unificado.html'),'utf8');
 const js=fs.readFileSync(path.join(__dirname,'..','laboratorio-unificado.js'),'utf8');
 const ids=[...js.matchAll(/\$\('([\w-]+)'\)/g)].map(m=>m[1]);
 const missing=[...new Set(ids)].filter(id=>!html.includes('id="'+id+'"'));
 assert.deepEqual(missing,[]);
});
