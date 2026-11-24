/* HÆMA — 126 técnicas realmente aprendíveis, em PLAYTEST.
 * Cada habilidade tem operação, vantagem específica, limite e exemplo.
 * Não concede permissão sobre ações que qualquer personagem já pode tentar.
 * O benefício mecânico só pertence a quem adquiriu o nó na Constelação.
 * Site e Sistema criado por Vitor Monte.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.HaemaTrainingGuide=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const A={
  combate:{
 "0": [
  [
   "Observe um inimigo ferido a curta distância. Antes de uma manobra dirigida à postura lesionada, declare o ponto observado.",
   "Ganhe +1 na tentativa de desequilibrar ou limitar o movimento do membro ferido.",
   "Uma vez por cena; exige ferimento visível e não produz execução automática.",
   "Você percebe que o joelho cede e testa uma rasteira contra essa perna com +1."
  ],
  [
   "Antes de rolar um ataque contra o alvo exposto por manobra de um aliado, anuncie a finalização técnica.",
   "Se acertar, aumente o dano final em 1 ponto, depois das reduções; escolha dano, não controle simultâneo.",
   "Uma vez por cena; precisa de abertura criada por aliado nesta rodada; não ignora armadura.",
   "O escudo foi afastado pelo colega; você acerta e inflige 1 ponto adicional de dano final."
  ],
  [
   "Após incapacitar um inimigo com um ataque válido, anuncie que usará o deslocamento restante para alcançar outra posição de combate.",
   "Acrescente até 1 m ao seu deslocamento normal restante, exclusivamente em direção a cobertura ou a um novo alvo visível.",
   "Uma vez por cena; não atravessa obstáculos, não concede nova ação e não funciona com Movimento já esgotado.",
   "O primeiro guarda cai; você usa o impulso para alcançar a pilastra um metro além da distância normal."
  ],
  [
   "Antes do ataque a um adversário que recebeu dano nesta rodada, declare qual abertura física daquele ferimento pretende explorar.",
   "Receba +1 no ataque contra o mesmo alvo, desde que a parte ferida permaneça acessível.",
   "Uma vez por cena; não permite atingir partes protegidas por cobertura e não acumula com outro +1 de técnica.",
   "A flecha feriu o ombro do inimigo; você busca a guarda enfraquecida e soma +1 no ataque."
  ],
  [
   "Ao incapacitar um oponente adjacente, declare a cobertura física próxima que vai ocupar usando seu Movimento disponível.",
   "Receba +1 no primeiro teste de Esquiva contra o próximo ataque vindo da direção coberta, até seu turno seguinte.",
   "Uma vez por cena; exige alcançar cobertura real com Movimento normal e pagar 1 Fôlego pela Esquiva.",
   "Depois do golpe final, você chega atrás de uma coluna e rola sua Esquiva com +1."
  ],
  [
   "Quando falhar uma finalização corpo a corpo, anuncie imediatamente uma retirada pelo trajeto livre que consegue ver.",
   "Receba +1 no próximo teste físico para recuar desse mesmo adversário antes do fim do próximo turno.",
   "Uma vez por cena; falhar não gera movimento grátis e a retirada precisa ser possível no terreno.",
   "Você erra a estocada, reconhece a abertura na parede e recebe +1 ao escapar no turno seguinte."
  ]
 ],
 "1": [
  [
   "Com outro aliado em posição de cerco, declare qual saída está pressionando antes de sua manobra de bloqueio.",
   "Ganhe +1 no teste oposto de posicionamento para impedir que um único adversário atravesse aquela saída.",
   "Uma vez por cena; exige duas posições reais e não bloqueia todas as rotas do alvo.",
   "Dois personagens fecham o corredor; você testa a contenção do centro com +1."
  ],
  [
   "Ao acertar um golpe corpo a corpo, declare antes do dano que fará uma manobra para afastar a postura do alvo.",
   "Se vencer a oposição aplicável, desloque o inimigo até 1 m além do deslocamento permitido pela manobra básica, havendo espaço.",
   "Uma vez por cena; substitui o dano, não derruba automaticamente e não atravessa obstáculos.",
   "Você acerta o escudeiro e converte o golpe em empurrão, deslocando-o mais um metro."
  ],
  [
   "Antes de um aliado atravessar uma área ameaçada por inimigo que você alcança, anuncie que o está fixando com sua arma.",
   "O aliado ganha +1 em um teste de deslocamento ou evasão para cruzar aquela passagem.",
   "Uma vez por cena; a pressão depende de sua posição e não cancela uma Reação inimiga automaticamente.",
   "Você mantém o arqueiro sob ameaça; o batedor cruza a abertura com +1 no teste."
  ],
  [
   "Depois de dominar com sucesso uma passagem estreita, indique ao aliado que a atravessará no turno seguinte.",
   "O primeiro aliado que atravessar recebe +1 no teste para superar oposição de posicionamento naquele trecho.",
   "Uma vez por cena; corredor e posição precisam continuar livres; não impede criaturas sem oposição física.",
   "Você segura o vão da porta; o curandeiro passa com +1 na manobra de travessia."
  ],
  [
   "Após dois turnos seguidos pressionando o mesmo alvo, anuncie uma manobra de contenção antes de rolar.",
   "Receba +1 nessa manobra para limitar o deslocamento do adversário.",
   "Uma vez por cena; perde preparação ao trocar de alvo ou sair do alcance.",
   "Você força o guarda a recuar por duas rodadas e rola a contenção decisiva com +1."
  ],
  [
   "Depois de impedir com sucesso uma rota, indique a segunda passagem que você e um aliado já conseguem alcançar.",
   "O aliado ganha +1 na próxima disputa de posicionamento para fechar essa segunda rota ainda nesta rodada.",
   "Uma vez por cena; não cria obstáculo, não concede movimento adicional e exige aliado capaz de agir.",
   "Após travar a escada, você orienta o companheiro: ele bloqueia o corredor lateral com +1."
  ]
 ],
 "x": [
  [
   "Quando acertar seu primeiro ataque da cena, anuncie «Primeiro Sangue» antes de resolver a próxima ação aliada e indique a abertura que o golpe criou.",
   "O primeiro aliado que atacar esse mesmo alvo até o início de seu próximo turno recebe +1 no teste de ataque.",
   "Uma vez por cena; não altera o dano do primeiro golpe, não concede ataque extra e não acumula com outro bônus de técnica na mesma rolagem.",
   "Seu golpe alcança o ombro do guarda; você aponta a brecha. A guerreira ataca logo depois com +1."
  ],
  [
   "Observe um ataque corpo a corpo do alvo; antes de sua próxima manobra contra ele, declare qual cadência reconheceu.",
   "Receba +1 na primeira disputa de controle de arma ou postura contra aquele adversário observado.",
   "Uma vez por cena; exige linha de visão do ataque original, mesmo adversário e manobra efetivamente rolada.",
   "O espadachim repete um corte lateral; você disputa o controle de sua lâmina e soma +1 ao teste."
  ],
  [
   "Vença uma disputa de armas com sua Ação Principal; anuncie antes da resolução que está abrindo passagem para um aliado adjacente.",
   "Um aliado recebe +1 no próximo teste físico para atravessar a zona que você pressionou até seu turno seguinte.",
   "Uma vez por cena; a área deve ser fisicamente atravessável; não empurra ninguém nem gera movimento gratuito.",
   "Você prende a lança do sentinela; seu aliado tenta atravessar a porta e rola com +1."
  ],
  [
   "Permaneça em alcance corpo a corpo de um mesmo inimigo após ele atacar. No seu turno seguinte, antes de uma manobra de desarme ou desequilíbrio, ative esta técnica.",
   "Ganhe +1 nesse teste específico de manobra contra o inimigo que você manteve sob pressão.",
   "Uma vez por cena; falha se qualquer dos dois romper a distância ou se você atacar outro alvo.",
   "Você sustenta a guarda durante a rodada e inicia um desarme com +1 no turno seguinte."
  ],
  [
   "Ao alcançar com sucesso um adversário que pretende fugir, declare antes do ataque que substitui o dano por uma interrupção de avanço.",
   "Além do efeito normal de uma manobra de contenção bem-sucedida, reduza em até 1 m o deslocamento restante do alvo.",
   "Uma vez por cena; exige contato plausível, teste bem-sucedido e espaço real; não cancela teleporte ou ação já concluída.",
   "O saqueador tenta correr; sua estocada prende sua passada, reduzindo em 1 m a fuga permitida."
  ],
  [
   "Depois de vencer uma manobra que abriu espaço, anuncie que vai aproveitar a mesma brecha em seu próximo ataque ao alvo.",
   "Some +1 ao primeiro teste de ataque que você realizar contra aquele alvo até o fim do seu próximo turno.",
   "Uma vez por cena; não funciona sem manobra anterior bem-sucedida nem se a abertura deixar de existir.",
   "Você tira o escudo do caminho com uma manobra e soma +1 no próximo golpe contra o flanco."
  ]
 ]
}
 };
 function get(node){
  const match=/^s[0-6]:(x|[01]{1,3}):([1-6])$/.exec(node.id);
  if(!match)return null;
  const route=match[1];
  if(route!=='x'&&route.length!==1)return null;
  const entry=A[node.sector]?.[route]?.[Number(match[2])-1];
  return entry?{trigger:entry[0],effect:entry[1],limit:entry[2],example:entry[3]}:null;
 }
 return Object.freeze({get,all:A});
});
