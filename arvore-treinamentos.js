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
},
  defesa:{
 "0": [
  [
   "Ocupe cobertura física entre uma ameaça e um aliado; antes de opor-se ao avanço pela linha protegida, declare o bastião.",
   "Ganhe +1 na primeira disputa de posicionamento para manter o aliado protegido naquela linha.",
   "Uma vez por cena; não gera escudo invisível, não protege ataques por ângulos descobertos.",
   "Você permanece entre o guarda e o curandeiro; se o guarda tenta passar, sua oposição recebe +1."
  ],
  [
   "Com um aliado adjacente em formação real, escolha quem seguirá seus movimentos defensivos antes do próximo ataque.",
   "Esse aliado soma +1 ao próximo teste de Aparo ou Esquiva contra uma fonte frontal compartilhada.",
   "Uma vez por cena; cada um ainda paga seus próprios custos de Reação; requer formação mantida.",
   "Dois escudos lado a lado: seu parceiro usa o alinhamento e rola Aparo com +1."
  ],
  [
   "Quando um aliado precisa abandonar uma cobertura, anuncie que sustentará a borda até ele concluir seu Movimento.",
   "O aliado recebe +1 no próximo teste físico para deixar a cobertura sob pressão inimiga.",
   "Uma vez por cena; a proteção precisa existir e você deve permanecer exposto no ponto de passagem.",
   "Você segura a porta enquanto o ferido escapa, dando +1 à travessia dele."
  ],
  [
   "Ao proteger um aliado adjacente com escudo ou obstáculo rígido, declare a técnica antes da redução de dano.",
   "Reduza em 1 ponto o dano final do ataque protegido, após armadura e Aparo aplicáveis.",
   "Uma vez por cena; exige cobertura material válida, não reduz dano de área sem barreira apropriada.",
   "Seu escudo recebe parte do golpe contra o aliado; o dano final de 3 cai para 2."
  ],
  [
   "Use sua Reação para interceptar a aproximação de um inimigo ao aliado que está recuando, declarando a rota a proteger.",
   "Ganhe +1 na oposição física para impedir a passagem do perseguidor.",
   "Uma vez por cena; consome sua Reação normal e exige alcance real; não causa dano nem ação extra.",
   "O inimigo tenta seguir o socorrista; sua lança bloqueia a porta com +1 na oposição."
  ],
  [
   "Depois de suportar um golpe protegendo alguém, declare que manterá a cobertura até o primeiro atendimento naquela posição.",
   "O próximo aliado que tentar um atendimento com material adequado atrás dessa cobertura recebe +1 no teste de Medicina.",
   "Uma vez por cena; precisa permanecer entre a ameaça e o paciente; não estabiliza automaticamente.",
   "Você mantém o escudo erguido; o médico trabalha atrás dele com +1 no teste."
  ]
 ],
 "1": [
  [
   "Assista a dois ataques com o mesmo desenho; antes de Aparar uma nova repetição, identifique o ângulo que aprendeu.",
   "Acrescente +1 ao resultado do dado único de Aparo contra aquele padrão.",
   "Uma vez por cena; gasta Reação e 1 Fôlego como Aparo normal; mudança de padrão anula a vantagem.",
   "Você reconhece o terceiro corte horizontal e soma +1 no dado de Aparo."
  ],
  [
   "Se seu Aparo reduzir dano de um ataque corpo a corpo, anuncie imediatamente a abertura que observou no oponente.",
   "Receba +1 na primeira manobra ofensiva contra esse atacante em seu próximo turno.",
   "Uma vez por cena; não concede riposta instantânea nem nova Reação; abertura precisa continuar acessível.",
   "Você desvia a espada e no turno seguinte usa +1 para tentar desarmar seu oponente."
  ],
  [
   "Vença uma oposição de armas; indique antes da ação seguinte como orientará o punho para proteger a própria retirada.",
   "Some +1 ao próximo teste físico para se afastar do mesmo inimigo até seu próximo turno.",
   "Uma vez por cena; exige disputa vencida e um trajeto desobstruído; não desloca arma do inimigo de graça.",
   "Você domina o cabo da lança e se retira da distância de ameaça com +1 na manobra."
  ],
  [
   "Tenha adquirido este nó. Quando um ataque corpo a corpo interceptável o atingir, antes do dano declare «Parry» e gaste sua Reação conforme o protocolo experimental aprovado em mesa.",
   "Desbloqueia a tentativa exclusiva de Parry/Defesa Perfeita como alternativa ao Aparo e à Esquiva. Sem este nó, o personagem não tem acesso ao Parry.",
   "Não é uma reação universal. Exige Reação disponível, arma apropriada e custo de Fôlego definido no protocolo. Os dados, critério de sucesso e eventual consequência do Parry ainda precisam de aprovação; nenhuma riposta gratuita é presumida.",
   "O duelista com este nó declara Parry contra uma espada. O mestre aplica a regra experimental acordada antes da rolagem; sem este nó, só Aparo ou Esquiva usuais."
  ],
  [
   "Depois de uma Esquiva bem-sucedida que custou 1 Fôlego, indique o flanco desguarnecido que encontrou.",
   "Some +1 à sua primeira manobra de aproximação contra o atacante até o fim do próximo turno.",
   "Uma vez por cena; não movimenta o personagem automaticamente nem concede Reação extra.",
   "Você escapa da machadada e, na rodada seguinte, se aproxima pelo flanco com +1."
  ],
  [
   "Após vencer uma oposição de armas defensiva, anuncie como fecha seu punho ou trava o escudo antes de um desarme seguinte.",
   "Se o inimigo tentar desarmá-lo antes do seu próximo turno, receba +1 na oposição.",
   "Uma vez por cena; não recupera a Reação gasta e exige que continue segurando a arma/escudo.",
   "O golpe foi aparado; você fecha a guarda e soma +1 contra a tentativa de desarme."
  ]
 ],
 "x": [
  [
   "Ao declarar Aparo válido com arma ou escudo, indique antes da rolagem como estabiliza sua base para a próxima defesa.",
   "Receba +1 no primeiro teste de oposição de armas que realizar contra esse atacante até seu próximo turno.",
   "Uma vez por cena; o Aparo ainda consome sua Reação e 1 Fôlego; não aumenta a redução do golpe atual.",
   "Você segura a primeira lâmina com o escudo e soma +1 ao disputar o próximo controle de arma."
  ],
  [
   "Sofra um golpe físico visível; antes de Aparar uma repetição do mesmo tipo de ataque, anuncie o padrão que memorizou.",
   "Some +1 ao dado único de Aparo contra a repetição, antes de calcular a redução do dano.",
   "Uma vez por cena; exige mesmo atacante, padrão reconhecível, Reação livre e pagamento de 1 Fôlego.",
   "Após observar o martelo vertical, você rola o Aparo de sua competência com +1."
  ],
  [
   "Com escudo ou obstáculo que cubra um aliado adjacente, declare antes do ataque de onde virá a proteção.",
   "Dê +1 ao próximo teste de Esquiva do aliado contra a fonte coberta, se ele gastar a própria Reação.",
   "Uma vez por cena; não intercepta golpes pelas costas nem substitui cobertura real.",
   "Você ergue o escudo na linha do arqueiro; o aliado faz a Esquiva com +1."
  ],
  [
   "Antes de realizar oposição física numa passagem que seu corpo realmente bloqueia, anuncie «Âncora de Guarda».",
   "Ganhe +1 na disputa para impedir a passagem de um adversário.",
   "Uma vez por cena; segura uma passagem por vez; não paralisa criaturas que não sejam fisicamente contidas.",
   "Na porta estreita, você usa a própria base como obstáculo e soma +1 na oposição."
  ],
  [
   "Depois de ser empurrado, anuncie a recuperação usando seu Movimento normal antes do próximo teste de equilíbrio.",
   "Receba +1 no teste de equilíbrio necessário para firmar os pés no terreno onde caiu.",
   "Uma vez por cena; sem movimento extra, requer apoio material e não cura condição ou Ferimento.",
   "Você é empurrado para cascalhos, gira o calcanhar e recupera a base com +1."
  ],
  [
   "Gaste sua Ação Principal assumindo uma guarda defensiva explícita. Na próxima Reação de Aparo até seu turno seguinte, declare o preparo.",
   "Acrescente +1 ao dado de Aparo dessa Reação, antes de dividir por dois para reduzir dano.",
   "Uma vez por cena; o Aparo ainda custa 1 Fôlego e a Reação; sem reação livre não há benefício.",
   "Você prepara o escudo em vez de atacar; quando a lança chega, rola o Aparo com +1."
  ]
 ]
},
  precisao:{
 "0": [
  [
   "Observe por uma rodada uma característica de marcha ou postura do alvo; declare esse sinal antes do próximo disparo.",
   "Some +1 no próximo teste de ataque à distância contra o mesmo inimigo identificado.",
   "Uma vez por cena; perde o ajuste se perder o alvo ou mudar radicalmente de distância.",
   "Você acompanha a passada irregular do sentinela e dispara com +1."
  ],
  [
   "Confirme um ponto desprotegido numa armadura e anuncie essa falha antes de rolar o ataque à distância.",
   "Ignore 1 ponto de Absorção da armadura no acerto, respeitando mínimo zero.",
   "Uma vez por cena; não atravessa cobertura nem armadura totalmente fechada.",
   "Você mira a fenda da ombreira: uma Absorção 3 passa a 2 nesse tiro."
  ],
  [
   "Ataque à distância a partir de Latebra válida e declare que vai amortecer o disparo com cobertura ou equipamento real.",
   "Caso o ataque gere apenas ruído fraco plausivelmente amortecido, conserve uma Marca de Latebra que seria perdida.",
   "Uma vez por cena; ruído forte, alvo que viu o atirador ou falta de cobertura anulam o efeito.",
   "A besta leve dispara atrás de cortina pesada; você conserva uma Marca que o estalo fraco retiraria."
  ],
  [
   "Depois de um tiro falhar por interferência física, identifique a borda do obstáculo antes de corrigir o próximo disparo.",
   "Some +1 ao próximo teste de ataque ao mesmo alvo por uma linha adaptada.",
   "Uma vez por cena; exige mudança concreta de ângulo e linha de tiro viável.",
   "A flecha atinge a grade; você ajusta o ângulo e soma +1 ao próximo disparo."
  ],
  [
   "Depois de observar a locomoção comprometida de um inimigo, declare ataque de contenção em lugar de dano.",
   "Ganhe +1 na oposição da manobra para imobilizar temporariamente um membro alcançável, se o ataque acertar.",
   "Uma vez por cena; não amputa, não ignora proteção e nunca soma dano ao controle.",
   "Você mira uma bota presa no entulho e usa +1 na manobra de contenção."
  ],
  [
   "Ataque o mesmo alvo por três turnos consecutivos sem perdê-lo de vista; anuncie a cadência aprendida antes do terceiro ataque.",
   "O terceiro ataque contra esse alvo recebe +1 no teste.",
   "Uma vez por cena; reinicia contagem se mudar de alvo, perder linha de tiro ou não realizar o ataque.",
   "Você acompanha dois desvios do guarda e soma +1 no terceiro disparo."
  ]
 ],
 "1": [
  [
   "Dedique uma Ação Principal a comparar duas trajetórias de tiro visíveis; escolha uma antes de lançar o ataque seguinte.",
   "Some +1 ao primeiro ataque realizado pela trajetória escolhida até seu próximo turno.",
   "Uma vez por cena; precisa haver duas linhas reais e não revela alvos ocultos.",
   "Você compara a janela e o arco da porta e atira pela janela com +1."
  ],
  [
   "Antes de um aliado atacar por uma linha que você estudou, aponte a interferência real e anuncie a correção.",
   "O aliado soma +1 ao teste de um ataque à distância por aquela linha.",
   "Uma vez por cena; você deve observar a cena e comunicar-se; não remove cobertura.",
   "Você avisa que o vento desvia flechas à direita; o arqueiro soma +1."
  ],
  [
   "Prepare o disparo para a passagem de um inimigo; ao acioná-lo, declare cobertura em lugar de dano.",
   "Se acertar, a manobra de impedir travessia pela passagem recebe +1 na oposição aplicável.",
   "Uma vez por cena; usa ação preparada normal e não gera segundo tiro.",
   "O inimigo corre para a escada; seu disparo de cobertura ganha +1 na contenção."
  ],
  [
   "Com um aliado ameaçando um lado de um corredor, anuncie qual linha cruzada você manterá durante uma Ação Principal de preparação.",
   "O primeiro aliado que opuser fisicamente o avanço pelo cruzamento recebe +1 nesse teste.",
   "Uma vez por cena; demanda linha de tiro visível, arma adequada e posição mantida.",
   "Vocês dominam lados opostos da porta; o defensor soma +1 para barrar a travessia."
  ],
  [
   "Estude cobertura e obstáculos de uma área por uma Ação Principal e indique a um aliado onde apoiar o próximo disparo.",
   "O aliado recebe +1 na primeira tentativa de ataque à distância dessa posição até seu próximo turno.",
   "Uma vez por cena; a posição deve existir e ser alcançada com Movimento normal.",
   "Você marca a altura certa da muralha; seu companheiro atira dali com +1."
  ],
  [
   "Monitore uma passagem visível até seu próximo turno e passe ao aliado a leitura de um obstáculo móvel antes de ele disparar.",
   "O aliado recebe +1 no ataque à distância feito no momento em que o obstáculo deixa a linha.",
   "Uma vez por cena; exige visibilidade contínua e comunicação; não concede disparos extras.",
   "Você avisa quando a carroça passa; o arqueiro dispara no instante certo com +1."
  ]
 ],
 "x": [
  [
   "Dedique uma Ação Principal a estudar a linha entre você e um alvo visível. Declare qual cobertura ou obstáculo mediu antes do ataque seguinte.",
   "Receba +1 no primeiro teste de ataque à distância feito pela linha observada até seu próximo turno.",
   "Uma vez por cena; se a linha mudar ou o alvo ficar oculto, perde o bônus; não atravessa cobertura.",
   "Você mede o espaço entre duas colunas e dispara pela fresta com +1."
  ],
  [
   "Gaste sua Ação Principal preparando mira num alvo que continua visível; declare o disparo preparado antes da rolagem seguinte.",
   "Some +1 no próximo ataque à distância contra esse alvo até o início do seu próximo turno.",
   "Uma vez por cena; mover a mira para outro alvo ou perder linha de visão desfaz o preparo.",
   "Você estabiliza a besta atrás do parapeito e soma +1 no tiro seguinte."
  ],
  [
   "Prepare uma ação ofensiva para quando um inimigo cruzar uma passagem visível; ao acioná-la, declare contenção em vez de dano.",
   "Se o ataque acertar, reduza em até 1 m o deslocamento restante do alvo naquela travessia.",
   "Uma vez por cena; gasta a ação normalmente e exige ataque que possa interromper o movimento; sem dano adicional.",
   "O batedor atravessa o corredor e seu disparo de contenção reduz sua corrida em 1 m."
  ],
  [
   "Observe durante uma rodada uma proteção física; antes de atacar a junta que enxergou, declare a abertura real.",
   "Ignore 1 ponto de Absorção dessa peça no ataque bem-sucedido, mínimo de proteção zero.",
   "Uma vez por cena; depende de ponto exposto confirmado e não ignora cobertura ou toda a armadura.",
   "Você observa a couraça e dispara na emenda, reduzindo a Absorção de 2 para 1."
  ],
  [
   "Após alcançar uma posição protegida, marque um trajeto seguro de saída antes de atirar.",
   "Receba +1 no primeiro teste físico para deixar a posição sob ameaça até seu próximo turno.",
   "Uma vez por cena; exige caminho visível e Movimento disponível; não concede deslocamento de graça.",
   "Você dispara do telhado e usa +1 para descer pelo acesso que já mediu."
  ],
  [
   "Prepare mira por duas Ações Principais sobre um mesmo ponto; antes do tiro, declare que trocará dano por precisão de controle.",
   "Se o ataque acertar, a manobra para prender um objeto pequeno acessível recebe +1 na oposição pertinente.",
   "Uma vez por cena; substitui dano, não impede todo Movimento e não cumula com bônus de mira.",
   "Você prende a correia do inimigo na madeira; a manobra ganha +1, sem dano no alvo."
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
