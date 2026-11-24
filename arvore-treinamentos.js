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
},
  mobilidade:{
 "0": [
  [
   "Com ao menos uma Marca de Latebra e cobertura contínua, declare o movimento discreto antes de mudar de posição.",
   "Conserve uma Marca que o deslocamento curto normalmente comprometeria, após um teste de Furtividade bem-sucedido.",
   "Uma vez por cena; nunca preserva marcas diante de visibilidade direta ou ruído forte.",
   "Você troca de esconderijo entre cortinas e mantém uma das Marcas que perderia."
  ],
  [
   "Quando gastar uma Ação Principal para reforçar seu esconderijo, anuncie o ajuste de respiração ou sombra escolhido.",
   "Some +1 à rolagem usada para reforçar uma Marca de Latebra.",
   "Uma vez por cena; só funciona em esconderijo possível; não cria Marca sem teste válido.",
   "Você recua da fresta de luz e faz o reforço de Latebra com +1."
  ],
  [
   "Confirme um ponto cego de um observador e declare a travessia antes de usar seu Movimento normal.",
   "Some +1 ao teste de Furtividade feito para atravessar aquele ponto cego.",
   "Uma vez por cena; a área precisa realmente estar fora do campo visual e não pode haver ruído denunciador.",
   "Você passa pelas costas do sentinela durante a virada e soma +1 no teste."
  ],
  [
   "Antes de percorrer uma superfície que faria um ruído fraco, declare o apoio especial que aprendeu a usar.",
   "Evite a perda de uma Marca de Latebra causada apenas por esse ruído fraco, se vencer um teste de Furtividade.",
   "Uma vez por cena; não elimina ruído forte, fala, ataque ou barulho de queda.",
   "Você pisa sobre a viga em vez da tábua frouxa; vence o teste e conserva a Marca."
  ],
  [
   "Quando interromper uma perseguição e entrar em cobertura válida, marque previamente uma posição de retorno no mesmo local.",
   "Seu primeiro teste para reforçar Latebra ao voltar à posição marcada recebe +1.",
   "Uma vez por cena; sem esconderijo real, não há teste nem benefício; não restaura Marcas automaticamente.",
   "Você volta ao nicho escuro já preparado e reforça a ocultação com +1."
  ],
  [
   "Depois de alcançar cobertura completa, gaste Ação Principal para criar uma Marca conforme Latebra e anuncie a técnica.",
   "Some +1 ao teste de Furtividade necessário para conquistar a nova Marca.",
   "Uma vez por cena; continua limitado ao número máximo de Marcas e às regras de busca.",
   "Você se esconde atrás da tapeçaria e tenta formar a Marca com +1."
  ]
 ],
 "1": [
  [
   "Ao trocar um ataque corpo a corpo por uma manobra de desvio permitida, declare a direção da esquiva de corpo antes do teste.",
   "Some +1 ao teste da manobra de desvio que o deslocará para uma posição adjacente alcançável.",
   "Uma vez por cena; não ataca e se desloca gratuitamente no mesmo lance; usa sua ação normal.",
   "Você evita a linha da alabarda com uma manobra de desvio rolada com +1."
  ],
  [
   "Depois de identificar um apoio instável, declare como distribuirá o peso antes de testar equilíbrio nesse apoio.",
   "Some +1 ao teste de Destreza ou Atletismo pertinente à travessia.",
   "Uma vez por cena; só vale para o apoio observado; não substitui cordas ou ferramentas necessárias.",
   "Você usa a borda de pedra como apoio e soma +1 ao teste de equilíbrio."
  ],
  [
   "Sob perseguição por uma rota aberta, escolha uma curva real antes de gastar seu Movimento.",
   "Receba +1 na primeira oposição de posicionamento feita para despistar o perseguidor naquela curva.",
   "Uma vez por cena; requer curva existente e espaço; não cancela perseguição automaticamente.",
   "Você dobra o beco e testa com +1 para escapar da linha de avanço do guarda."
  ],
  [
   "Ao carregar objeto pesado ou aliado, declare a técnica de distribuição de peso antes do primeiro teste de deslocamento.",
   "Reduza em 1 a DT desse teste de deslocamento sob carga (mínimo DT 5).",
   "Uma vez por cena; não elimina o peso, penalidades graves ou exigências de força plausíveis.",
   "Você equilibra o ferido nos ombros; a DT da travessia cai de 9 para 8."
  ],
  [
   "Escolha um ponto de apoio que você ocupa e explique ao aliado como usá-lo na próxima manobra de travessia.",
   "O aliado recebe +1 no teste de saltar ou atravessar utilizando o apoio que você manteve.",
   "Uma vez por cena; exige contato possível e você não pode abandonar o apoio antes da tentativa.",
   "Você firma o braço no muro; o companheiro usa seu ombro e soma +1 no salto."
  ],
  [
   "Após perceber que a saída original foi bloqueada, identifique uma rota alternativa visível e declare o desvio antes da corrida.",
   "Some +1 ao primeiro teste de deslocamento para escapar por essa segunda rota.",
   "Uma vez por cena; não revela saídas secretas nem cria passagens.",
   "Você vê uma janela livre ao lado da porta trancada e testa a fuga por ela com +1."
  ]
 ],
 "x": [
  [
   "Antes de cruzar até 2 m entre duas coberturas reais, declare a travessia silenciosa e gaste o Movimento normal.",
   "Some +1 ao teste de Furtividade que sustenta as Marcas de Latebra nessa travessia.",
   "Uma vez por cena; não oculta movimento em campo aberto ou sob observação direta.",
   "Você cruza os dois metros entre caixas; seu teste para manter as Marcas recebe +1."
  ],
  [
   "Estude os apoios de um trecho de terreno difícil por uma Ação Principal. No Movimento seguinte, declare o trajeto que memorizou.",
   "Reduza em 1 a DT de um único teste de travessia desse trecho (DT mínima 5).",
   "Uma vez por cena; apenas para o trecho observado e com terreno ainda nas mesmas condições.",
   "Você estuda os degraus molhados; a DT de sua travessia cai de 8 para 7."
  ],
  [
   "Observe por uma ação a aproximação a um alvo ou cobertura; antes do próximo teste de movimentação, escolha uma curva de até 2 m.",
   "Some +1 à manobra de deslocamento por essa curva quando houver oposição.",
   "Uma vez por cena; usa Movimento disponível e não atravessa um inimigo ou parede.",
   "Você escolhe contornar a coluna e testa o movimento de aproximação com +1."
  ],
  [
   "Ao deixar uma cobertura, declare que apagará um único indício físico de sua passagem e faça o teste de Furtividade apropriado.",
   "Some +1 ao teste para ocultar pegadas, marcas de barro ou outro vestígio pequeno.",
   "Uma vez por cena; requer tempo e material plausíveis; não apaga uma trilha inteira nem som alto.",
   "Você arrasta um pano sobre uma pegada; soma +1 para disfarçar o vestígio."
  ],
  [
   "Depois de avaliar uma parede e seus apoios por uma Ação Principal, declare a sequência de pegadas antes da escalada.",
   "Receba +1 no primeiro teste de escalada pela rota estudada.",
   "Uma vez por cena; se os apoios mudarem, você perde a preparação; não aumenta o alcance sem subir.",
   "Você avalia três saliências e escala usando +1 no teste."
  ],
  [
   "Após passar silenciosamente por um corredor, indique um ruído mínimo que amortecerá ao voltar pelo mesmo trecho.",
   "Some +1 à próxima rolagem de Furtividade para refazer a passagem com os mesmos apoios.",
   "Uma vez por cena; o percurso não pode estar alterado nem vigiado diretamente.",
   "Você retorna pelo assoalho cujo rangido aprendeu a evitar e testa com +1."
  ]
 ]
},
  sobrevivencia:{
 "0": [
  [
   "Com material adequado, declare a técnica de compressão ou imobilização antes de rolar Medicina.",
   "Some +1 ao teste de Medicina para estabilizar o ferimento físico daquele paciente.",
   "Uma vez por cena; sem cura de Integridade e sem dispensar a Ação Principal.",
   "Você aplica pressão sobre o corte e testa Intelecto + Medicina com +1."
  ],
  [
   "Avalie pulso e respiração durante uma Ação Principal e anuncie o sinal que acompanhará.",
   "Some +1 ao próximo teste de estabilização do mesmo paciente até seu turno seguinte.",
   "Uma vez por cena; requer reavaliar a vítima; não converte falha anterior em sucesso.",
   "O pulso acelera; você muda a compressão e recebe +1 no teste seguinte."
  ],
  [
   "Com material apropriado, declare o protocolo de estabilização antes do teste de Medicina.",
   "Reduza em 1 a DT da tentativa de estabilização (mínimo DT 5).",
   "Uma vez por cena; gasta Ação Principal e não soma com outra redução de DT da árvore.",
   "A estabilização externa exige DT 7; seu protocolo a reduz para DT 6."
  ],
  [
   "Antes de deslocar uma vítima com aliado, indique quem sustenta cabeça e pernas e declare o levantamento.",
   "Um participante recebe +1 no teste de transporte realizado pela equipe.",
   "Uma vez por cena; ambos precisam conseguir agir e carregar peso plausível.",
   "Vocês erguem o ferido da escada; o teste de transporte recebe +1."
  ],
  [
   "Depois de uma rodada de vigília, identifique uma deterioração observável antes do próximo atendimento.",
   "Some +1 ao primeiro teste de Medicina para reagir à complicação até seu turno seguinte.",
   "Uma vez por cena; não previne deterioração sem teste e não inventa sintomas.",
   "Você nota a respiração enfraquecer e ajusta o curativo com +1."
  ],
  [
   "Com duas vítimas, gaste uma Ação Principal organizando instrumentos apropriados para ambas.",
   "O próximo teste de Medicina na segunda vítima recebe +1 se o mesmo procedimento servir.",
   "Uma vez por cena; não dá dois atendimentos na mesma ação; requer material suficiente.",
   "Você organiza as talas e ganha +1 quando atende o segundo acidentado."
  ]
 ],
 "1": [
  [
   "Quando um Ferimento limitar uma ação, declare uma alternativa que usa uma região ilesa antes de rolar.",
   "Receba +1 no teste físico da alternativa plausível que evita a área lesionada.",
   "Uma vez por cena; não remove Ferimento ou penalidade que também se aplique à alternativa.",
   "Com o braço ferido, você apoia com o ombro bom e soma +1 na travessia."
  ],
  [
   "Gaste uma Ação Principal preparando um abrigo real para atendimento: ventilação, piso e acesso.",
   "O próximo teste de Medicina dentro do abrigo recebe +1 se o preparo persistir.",
   "Uma vez por cena; proteção material deve existir; repouso não cura automaticamente.",
   "Você afasta o paciente do piso úmido e o estabiliza na tenda com +1."
  ],
  [
   "Depois de estudar uma rota, declare os apoios que usará apesar da dor antes da travessia.",
   "Some +1 no teste físico para completar a travessia pela rota estudada.",
   "Uma vez por cena; Ferimentos continuam ativos e Movimento não aumenta.",
   "Você escolhe apoios para a perna machucada e soma +1 para cruzar a ponte."
  ],
  [
   "Observe coberturas reais durante uma Ação Principal e escolha um refúgio alcançável.",
   "Some +1 ao teste de deslocamento para chegar a esse refúgio até seu próximo turno.",
   "Uma vez por cena; não revela esconderijo secreto nem protege de ameaças que atravessem a cobertura.",
   "Você encontra uma vala seca e corre para lá com +1 no teste."
  ],
  [
   "Identifique medo num aliado que consiga ouvi-lo e indique antes da reação uma rota de abrigo visível.",
   "O aliado recebe +1 no próximo teste físico de retirada do perigo, nunca no teste de Metus.",
   "Uma vez por cena; não elimina pavor ou dá imunidade; rota precisa existir.",
   "O companheiro hesita diante do rugido; você o guia à porta e ele rola fuga com +1."
  ],
  [
   "Depois de sobreviver a ameaça concreta, anote no descanso qual preparo técnico evitaria uma repetição.",
   "Receba +1 no primeiro teste de Sobrevivência para preparar proteção contra esse tipo de ameaça numa cena futura.",
   "Uma vez por sessão; exige aprendizado registrado; não concede Vivência ou dado maior automaticamente.",
   "Após a nevasca, você registra como montou abrigo e soma +1 na proteção contra outra."
  ]
 ],
 "x": [
  [
   "Examine sinais físicos de uma vítima ou ambiente durante uma Ação Principal; declare o risco concreto antes do próximo atendimento.",
   "Receba +1 no primeiro teste de Medicina ou Sobrevivência diretamente ligado ao risco observado.",
   "Uma vez por cena; não revela diagnóstico invisível nem substitui material apropriado.",
   "Você examina a respiração do ferido e soma +1 ao teste de estabilização."
  ],
  [
   "Antes do teste de Medicina, anuncie o substituto de ferramenta que preparou e apresente material plausível.",
   "Reduza em 1 a DT do teste com essa ferramenta improvisada (mínimo DT 5).",
   "Uma vez por cena; não substitui material indispensável nem cura automaticamente.",
   "Faltou uma tala; você adapta madeira limpa e a DT da imobilização cai de 8 para 7."
  ],
  [
   "Identifique a lesão e ensine uma cadência de respiração antes da movimentação física da vítima.",
   "Conceda +1 ao teste físico da vítima para um movimento curto sem agravar o esforço.",
   "Uma vez por cena; requer vítima consciente e capaz de seguir instruções; não elimina Ferimentos.",
   "Você ensina o ferido a expirar ao levantar; ele rola o movimento com +1."
  ],
  [
   "Antes de transportar um aliado caído, escolha o apoio real e declare o levantamento antes do teste.",
   "Some +1 no primeiro teste físico para arrastar ou carregar a pessoa até cobertura próxima.",
   "Uma vez por cena; não recupera o paciente nem concede Movimento extra.",
   "Você segura o ferido pelos ombros e o arrasta atrás do balcão com +1."
  ],
  [
   "Antes de um aliado auxiliar seu atendimento, divida duas tarefas e indique as ferramentas de cada um.",
   "O teste principal de Medicina recebe +1 pelo auxílio coordenado.",
   "Uma vez por cena; requer aliado presente e material real; não soma com outro bônus de auxílio.",
   "Você pede que segurem a compressa enquanto aplica a tala, somando +1."
  ],
  [
   "Observe uma ameaça ambiental próxima de uma vítima e declare a proteção antes do socorro.",
   "O próximo teste físico para retirar a vítima do perigo recebe +1, se você coordenar a retirada.",
   "Uma vez por cena; não atrasa a ameaça de graça e precisa existir passagem acessível.",
   "Você percebe a fumaça e orienta a retirada do ferido com +1 no teste."
  ]
 ]
},
  conhecimento:{
 "0": [
  [
   "Observe por uma Ação Principal até três rotas reais e escolha uma antes do teste de exploração ou infiltração.",
   "Some +1 no teste inicial de deslocamento ou reconhecimento da rota escolhida.",
   "Uma vez por cena; rotas precisam estar à vista ou documentadas; não cria caminho inexistente.",
   "Você compara escada, janela e corredor, escolhe a escada e reconhece a subida com +1."
  ],
  [
   "Analise perigo material visível antes de uma tarefa e descreva o cuidado que preparou para evitá-lo.",
   "Reduza em 1 a DT do teste de preparação contra esse perigo (mínimo DT 5).",
   "Uma vez por cena; a ameaça deve ser observável e prevenível; não suprime armadilhas sem ação.",
   "Você protege o cabo contra atrito; a DT do preparo cai de 8 para 7."
  ],
  [
   "Observe o ciclo de um mecanismo ou patrulha durante uma rodada e indique a janela exata para um aliado agir.",
   "O aliado soma +1 no teste da ação realizada durante a janela observada.",
   "Uma vez por cena; ritmo deve se repetir e aliado precisa agir a tempo, sem ação extra.",
   "Você mede a rotação da engrenagem e o aliado ajusta a peça com +1."
  ],
  [
   "Antes da missão, gaste Ação Principal preparando uma segunda ferramenta ou rota adequada. Quando a primeira falhar, declare a reserva.",
   "Receba +1 no primeiro teste da alternativa previamente preparada, ao executá-la com ação normal.",
   "Uma vez por cena; a alternativa precisa ter sido preparada antes da falha; sem turno gratuito.",
   "A ponte improvisada rompe; você usa o cordame reserva e soma +1 no teste."
  ],
  [
   "Compare dois elementos de um problema durante uma Ação Principal e indique qual interromperá o mecanismo adversário.",
   "Some +1 no teste técnico ou de manobra para interferir no ponto identificado.",
   "Uma vez por cena; exige sinais verificáveis e acesso real ao elemento; não desliga inimigos de graça.",
   "Você identifica a haste que trava o portão e soma +1 ao teste para soltá-la."
  ],
  [
   "Antes de uma ação coordenada, defina comando curto e ensaie o momento de execução com pelo menos um aliado.",
   "Um aliado soma +1 ao próximo teste relacionado à ordem ensaiada.",
   "Uma vez por cena; não é ordem mental ou ação gratuita; não acumula com bônus de auxílio.",
   "Você sinaliza a abertura da ponte; o aliado rola a manobra sincronizada com +1."
  ]
 ],
 "1": [
  [
   "Escolha instrumento técnico adequado e declare a calibração específica antes do teste de Engenharia ou ofício.",
   "Some +1 no teste de execução daquele ajuste técnico, usando a ferramenta que você calibrou.",
   "Uma vez por cena; exige ferramenta material; não resolve por magia um dispositivo desconhecido.",
   "Você calibra a chave antes de soltar o pino e testa Engenharia com +1."
  ],
  [
   "Abra registro físico que você possua e localize a anotação relacionada à falha antes de tentar solucioná-la.",
   "Some +1 ao próximo teste para reproduzir uma solução documentada no registro.",
   "Uma vez por cena; a anotação precisa existir; não conjura informação ausente.",
   "Você encontra desenho de uma roda dentada semelhante e soma +1 ao reparo."
  ],
  [
   "Depois de uma primeira tentativa técnica malsucedida, registre concretamente o que mudou no mecanismo e anuncie correção.",
   "Some +1 ao teste seguinte para repetir o procedimento com alteração material plausível.",
   "Uma vez por cena; não pode repetir sem mudar nada e o erro não é apagado retroativamente.",
   "Você identifica pressão excessiva na alavanca, a reduz e tenta outra vez com +1."
  ],
  [
   "Inspecione uma peça acessível durante uma Ação Principal e indique o ponto real que precisa de manutenção.",
   "Reduza em 1 a DT do primeiro teste de reparo desse ponto com ferramenta adequada (DT mínima 5).",
   "Uma vez por cena; não inventa peças de reposição ou substitui a perícia necessária.",
   "Você encontra a bucha desgastada e a DT de troca cai de 9 para 8."
  ],
  [
   "Examine marcas de ruptura em material físico e declare o sinal que diferencia corte, carga ou atrito.",
   "Some +1 no teste usado para classificar corretamente a origem do dano.",
   "Uma vez por cena; não revela sabotador sem pistas; exige acesso à superfície danificada.",
   "Você vê fibras torcidas no cabo e soma +1 para identificar o tipo de ruptura."
  ],
  [
   "Após completar com sucesso uma tarefa técnica, registre a sequência exata e repita-a com os mesmos materiais.",
   "Some +1 ao teste da primeira repetição do procedimento anotado.",
   "Uma vez por cena; precisa de repetição equivalente, sem somar a Método Repetível.",
   "Você monta o segundo filtro igual ao primeiro, usando o protocolo para ganhar +1."
  ]
 ],
 "x": [
  [
   "Gaste uma Ação Principal formulando hipótese sobre vestígio observável; diga qual evidência poderia refutá-la antes do teste de investigação.",
   "Receba +1 no teste de investigação usado para confrontar a hipótese com essa evidência.",
   "Uma vez por cena; não exige que o mestre invente uma pista nem confirma algo sem teste.",
   "Você compara cera da vela e fuligem da janela, somando +1 ao teste para verificar a hipótese."
  ],
  [
   "Examine ferramentas existentes e anuncie qual usará para uma tarefa técnica antes de iniciar o teste.",
   "Reduza em 1 a DT de um teste técnico feito com a ferramenta correta (DT mínima 5).",
   "Uma vez por cena; o instrumento precisa estar disponível e não resolve tarefa por si só.",
   "Você usa um calibre na dobradiça; a DT do ajuste cai de 9 para 8."
  ],
  [
   "Antes de uma ação arriscada, gaste Ação Principal para mapear duas consequências observáveis da falha.",
   "Receba +1 no teste de preparação para reduzir um desses riscos no próximo turno.",
   "Uma vez por cena; não revela riscos secretos ou dispensa fazer o teste da ação principal.",
   "Você identifica a queda da roldana e reforça o cabo, rolando o preparo com +1."
  ],
  [
   "Compare duas fontes materiais disponíveis durante uma Ação Principal e anuncie a contradição a verificar.",
   "Some +1 no teste de análise para detectar a discrepância entre as fontes.",
   "Uma vez por cena; ambas fontes devem existir e poder ser examinadas; não cria informação.",
   "Você confronta duas plantas e soma +1 para localizar a medida inconsistente."
  ],
  [
   "Prepare um plano com um aliado usando Ação Principal e defina a tarefa técnica de cada um antes da execução.",
   "Conceda +1 ao próximo teste de um aliado diretamente ligado ao plano que vocês ensaiaram.",
   "Uma vez por cena; o aliado deve conseguir receber instruções e não soma com outro auxílio.",
   "Você marca a sequência de abrir a comporta; o responsável pela alavanca soma +1."
  ],
  [
   "Depois de executar um procedimento técnico com sucesso, anote condições e ferramentas necessárias para repetição.",
   "Receba +1 na primeira repetição do mesmo teste com ferramentas e condições equivalentes.",
   "Uma vez por cena; não serve para tarefas diferentes ou ambientes que mudaram muito.",
   "Você repete o alinhamento de engrenagens idênticas e soma +1 ao segundo ajuste."
  ]
 ]
},
  regencias:{
 "0": [
  [
   "Diante de uma âncora aprovada em playtest, declare o apoio ou barreira material que instalará antes de nova sustentação.",
   "Reduza em 1 a DT do teste experimental para protegê-la (DT mínima 5), se o mestre usar DT nessa prova.",
   "Uma vez por cena; só proteção material, sem campo sobrenatural adicional.",
   "Você prende a âncora ao suporte e diminui a DT do próximo teste de sustentação."
  ],
  [
   "Prepare a mesma âncora e as mesmas condições por uma Ação Principal; declare o pulso que repetirá.",
   "Some +1 no teste experimental de sustentação da manifestação autorizada.",
   "Uma vez por cena; mudanças de âncora ou efeito cancelam o preparo; não amplia a manifestação.",
   "Você ajusta a cadência à mesma peça e rola a sustentação com +1."
  ],
  [
   "Antes de realizar teste de controle experimental, declare o elemento secundário que deseja preservar do efeito autorizado.",
   "Some +1 no teste experimental para evitar que o efeito incida sobre esse detalhe material próximo.",
   "Uma vez por cena; depende de efeito realmente permitido; não reduz dano nem anula alvo deliberado.",
   "Você tenta impedir que a vibração alcance o vidro ao lado, somando +1 ao controle."
  ],
  [
   "Com aliado junto à âncora autorizada, divida as tarefas físicas de manutenção antes do teste.",
   "Um participante soma +1 ao teste experimental de proteção da âncora pelo auxílio coordenado.",
   "Uma vez por cena; apoio real necessário; não acumula com outro bônus de auxílio.",
   "Enquanto você sustenta a haste, o aliado verifica o encaixe e soma +1 no teste."
  ],
  [
   "Antes de uma experiência aprovada, monte e inspecione os apoios físicos da âncora com Ação Principal.",
   "Reduza em 1 a DT do teste experimental de preparação (DT mínima 5), se houver DT definida.",
   "Uma vez por cena; não altera a consequência de uma falha depois de ela ocorrer.",
   "Você confere a base e a DT do preparo da âncora cai de 8 para 7."
  ],
  [
   "Depois de um teste experimental bem-sucedido sob condições estáveis, registre o mesmo protocolo antes de repeti-lo.",
   "Some +1 à primeira repetição autorizada do teste com a mesma âncora e intensidade.",
   "Uma vez por cena; não dispensa rolagem quando houver risco; não aumenta o efeito.",
   "Você repete o ajuste de baixa intensidade e soma +1 no mesmo teste."
  ]
 ],
 "1": [
  [
   "Com Eco experimental autorizado, declare a direção e a âncora física antes da tentativa de condução.",
   "Some +1 no teste de condução desse Eco na direção que já foi aprovada.",
   "Uma vez por cena; não concede Eco novo nem expande alcance permitido.",
   "Você mantém a mesma haste e direciona o Eco pelo corredor, rolando +1."
  ],
  [
   "Após observar refluxo de uma tentativa aprovada, declare qual reforço material corrigirá antes de repetir.",
   "Some +1 no próximo teste de controle do refluxo sob condições corrigidas.",
   "Uma vez por cena; não apaga instabilidade já causada ou danos prévios.",
   "Você troca a fixação desgastada e testa o fluxo outra vez com +1."
  ],
  [
   "Antes do teste de identificação do Eco, aponte duas fontes visíveis de matéria ou estímulo que poderiam alimentá-lo.",
   "Receba +1 no teste experimental para distinguir qual fonte realmente participa da condução.",
   "Uma vez por cena; não detecta fontes ocultas ou inventa reservas de energia.",
   "Você compara o cristal e a lâmina próxima, somando +1 para identificar a fonte do Eco."
  ],
  [
   "Ao realizar preparação leve para Eco autorizado, indique a ferramenta já disponível e declare a sequência breve antes de agir.",
   "Some +1 no teste experimental de preparar o Eco usando essa ferramenta.",
   "Uma vez por cena; não reduz o tempo de Ação Principal obrigatória nem permite mais uma conjuração.",
   "Você alinha a ferramenta à âncora e soma +1 ao teste de preparação."
  ],
  [
   "Com um aliado observando o mesmo Eco, divida antecipadamente os sinais materiais que cada um acompanhará.",
   "Some +1 ao teste experimental de análise realizado por um participante após comparar as duas observações.",
   "Uma vez por cena; exige observações reais, não produz descoberta automática ou poder.",
   "Vocês anotam variações opostas e o analista soma +1 para interpretar o padrão."
  ],
  [
   "Quando Eco experimental autorizado começar a gerar efeito secundário observável, declare interrupção antes do próximo teste de controle.",
   "Some +1 no teste experimental para interromper o fluxo dentro do limite já permitido.",
   "Uma vez por cena; não reverte dano já aplicado nem permite interromper algo que não possa ser parado.",
   "Você percebe vibração excessiva, encerra a condução e rola o controle com +1."
  ]
 ],
 "x": [
  [
   "Após Despertar autorizado, observe uma manifestação da própria Sintonia e descreva uma sensação verificável antes do teste experimental de observação.",
   "Some +1 ao teste autorizado para reconhecer um padrão dessa mesma ressonância.",
   "Uma vez por cena em playtest; não concede manifestação, poder ou Sintonia sem autorização do mestre.",
   "Você percebe a mesma vibração na pedra e usa +1 para reconhecer seu padrão."
  ],
  [
   "Com uma manifestação experimental autorizada e âncora física visível, declare qual detalhe da âncora examinará durante a preparação.",
   "Some +1 ao teste experimental para manter o contato correto com essa âncora.",
   "Uma vez por cena; a âncora deve existir e ser acessível; não cria energia ou matéria.",
   "Você examina a fissura da haste e testa a sustentação experimental com +1."
  ],
  [
   "Após falha numa tentativa experimental permitida, indique uma alteração concreta de âncora ou postura antes de repetir o teste.",
   "Some +1 na primeira nova tentativa sob condições corrigidas.",
   "Uma vez por cena; não repete sem mudar a condição e não apaga consequências da falha anterior.",
   "A âncora escorregou; você fixa a base e tenta novamente com +1."
  ],
  [
   "Depois de obter leitura confiável de uma âncora, registre um sinal material e declare que usará o mesmo sinal em teste posterior.",
   "Some +1 no próximo teste experimental de identificação da mesma âncora naquela cena.",
   "Uma vez por cena; perde utilidade se a âncora for removida ou alterada.",
   "Você registra o brilho na incisão e soma +1 ao identificá-la novamente."
  ],
  [
   "Durante um teste de Sintonia experimental autorizado, anuncie antes da leitura qual dos três dados observará com maior atenção.",
   "Após a rolagem, receba uma informação objetiva sobre o dado indicado, sem alterar o resultado.",
   "Uma vez por cena; não permite rerrolar ou modificar dados; interpretação cabe ao protocolo de mesa.",
   "Você observa o segundo d4 e o mestre informa o sinal de desalinhamento já previsto no teste."
  ],
  [
   "Ao preparar manifestação autorizada, indique a condição visível que poderia interromper a conexão com a âncora.",
   "Some +1 no teste experimental para prevenir essa interrupção com medida material válida.",
   "Uma vez por cena; não prevê riscos invisíveis, cancela fracasso ou torna a âncora invulnerável.",
   "Você reforça a fiação da âncora e soma +1 à tentativa de mantê-la estável."
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
