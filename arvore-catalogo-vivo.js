/* HÆMA · Catálogo autoral da Constelação Viva (revisão experimental).
 * Cada uma das 126 conquistas iniciais foi escrita para o ramo correspondente.
 * Gerações posteriores são espaços editoriais deliberadamente bloqueados.
 * Site e Sistema criado por Vitor Monte.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.HaemaTreeCatalogVivo=api;})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 // Formato: título, gatilho, efeito, limitação, exemplo em mesa.
 const C={
 combate:{
  base:[
   ['Primeiro Sangue','Ao acertar seu primeiro ataque de uma cena.','Pode declarar uma brecha visível na postura do adversário; o próximo aliado que a explorar recebe +1 em sua ação pertinente.','Uma vez por cena; não acrescenta dano ao ataque original.','Você atinge o ombro do guarda e avisa que ele deixou o flanco aberto.'],
   ['Aço Memorizado','Após observar um ataque corpo a corpo do mesmo inimigo.','Reconheça sua cadência e receba +1 em uma manobra ofensiva posterior contra ele.','Uma vez por cena; exige ter visto o movimento e não modifica Defesa.','Você aprende o ritmo de três golpes e usa o intervalo para desequilibrá-lo.'],
   ['Pressão de Lâmina','Depois de vencer uma manobra contra uma arma empunhada.','Pode forçar a arma inimiga a uma posição desfavorável, dando a um aliado uma abertura de aproximação.','Sem desarme gratuito e sem dano simultâneo.','A espada adversária é pressionada para baixo enquanto um aliado passa.'],
   ['Ritmo de Duelo','Ao terminar seu turno adjacente a um oponente que atacou.','Marque sua posição de pressão; no próximo turno, sua primeira manobra contra ele recebe +1 se ninguém se afastou.','Uma vez por cena; exige permanecer exposto.','Você não recua após o choque e retoma a ofensiva.'],
   ['Corte de Interrupção','Quando interromper fisicamente uma ação com manobra válida.','Escolha impedir o deslocamento planejado de um alvo por um instante, em lugar de causar dano.','Uma vez por cena; não cancela automaticamente magia, ataque ou ações já concluídas.','O inimigo tenta passar pela porta e sua lâmina força um recuo.'],
   ['Oportunidade Conquistada','Após uma manobra ofensiva bem-sucedida que mudou a cena.','Seu próximo ataque contra a abertura criada recebe +1 se ocorrer até o seu próximo turno.','Não acumula com outro +1 de técnicas da árvore; nenhuma ação gratuita.','Você desloca o escudo e busca o espaço na rodada seguinte.']
  ],
  branches:{
   '0':[
    ['Marca do Executor','Quando um inimigo real já está ferido e você o observa de perto.','Reconheça qual postura dele está comprometida e obtenha +1 na próxima tentativa de finalização técnica.','Uma vez por cena; não concede execução automática.','Você vê a perna cedendo e adapta a aproximação.'],
    ['Golpe de Conclusão','Se o alvo perdeu a proteção de um flanco por ação anterior.','Ao acertá-lo, escolha aumentar em 1 o dano final ou realizar uma manobra de controle em vez do dano normal.','Uma vez por cena; requer abertura provocada, nunca ambos.','A guarda foi afastada por outro personagem e você aproveita a abertura.'],
    ['Pulso da Caçada','Após reduzir um inimigo a zero com um ataque legítimo.','Pode deslocar-se até 2 m para assumir posição diante de um segundo adversário.','Uma vez por cena; não ataca novamente nem atravessa obstáculos.','A queda do primeiro oponente abre espaço para se virar ao segundo.'],
    ['Precisão Terminal','Quando atacar um inimigo que já perdeu Integridade nesta rodada.','Receba +1 no ataque se você identificar a lesão explorada.','Uma vez por cena; respeita o teto global de modificadores.','Seu golpe busca o braço já machucado.'],
    ['Fim sem Exposição','Depois de incapacitar um oponente corpo a corpo.','Escolha manter uma cobertura ou posição defensiva acessível sem consumir movimento adicional além do disponível.','Uma vez por cena; não recupera Reação.','Você finaliza o duelo junto a uma coluna e permanece protegido.'],
    ['Sangue Frio','Quando uma finalização tentada falhar e deixar você exposto.','Pode identificar uma rota segura de retirada imediatamente visível, sem executá-la gratuitamente.','Uma vez por cena; informação útil, não teleporte.','A lâmina erra e você percebe espaço junto à parede.']
   ],
   '1':[
    ['Linha de Cerco','Quando dois aliados ameaçam um inimigo por lados distintos.','Você pode designar uma saída que o alvo não consegue usar sem enfrentar uma oposição de posicionamento.','Não impede toda fuga e exige posições reais.','Os aliados cercam o corredor e você fecha a passagem central.'],
    ['Ruptura de Postura','Quando um inimigo recua para proteger alguém.','Substitua seu dano por uma manobra para afastá-lo até 1 m, se houver espaço.','Uma vez por cena; exige teste ofensivo bem-sucedido.','Você empurra o escudeiro para separar a dupla.'],
    ['Cobertura de Avanço','Quando um aliado avança sob ameaça que você pode alcançar.','Declare pressão sobre um único adversário; seu aliado recebe +1 em um teste de deslocamento pertinente.','Uma vez por cena; não concede Reação extra.','Seu avanço força o arqueiro a escolher entre você e a passagem.'],
    ['Domínio do Espaço','Após vencer uma manobra em passagem estreita.','Pode preservar uma área de passagem livre para um aliado durante uma rodada.','Não bloqueia inimigos maiores que a capacidade real da posição.','A linha de frente se abre para o socorrista passar.'],
    ['Fôlego do Cerco','Se manteve a pressão no mesmo alvo por dois turnos.','Seu próximo teste de manobra de controle contra ele recebe +1.','Uma vez por cena; perde o benefício se mudar de alvo.','Você insiste na pressão até o guarda ceder terreno.'],
    ['Fechamento Tático','Depois de impedir uma rota com sucesso.','Pode indicar uma segunda rota que seus aliados já estejam em condição de proteger.','Não cria obstáculos e não acrescenta ataques.','Com a saída principal fechada, o grupo assegura a lateral.']
   ]
  }
 },
 defesa:{
  base:[
   ['Postura Medida','Antes de receber um ataque interceptável.','Ao declarar Aparo, reconheça se a posição oferece proteção real; ganhe +1 na próxima ação de Guarda relacionada.','Uma vez por cena; não reduz o ataque atual adicionalmente.','Você usa o ângulo do escudo para proteger sua próxima posição.'],
   ['Memória do Impacto','Após resistir a um golpe de um inimigo visível.','Identifique de onde veio a força e receba +1 em uma defesa apropriada contra uma repetição semelhante.','Uma vez por cena; não funciona contra golpe novo ou invisível.','Você ajusta a base contra o mesmo ataque descendente.'],
   ['Escudo Compartilhado','Com aliado adjacente e proteção física disponível.','Pode escolher oferecer a esse aliado uma cobertura parcial real para o próximo ataque.','Uma vez por cena; exige escudo ou obstáculo plausível.','Você se posiciona para a flecha atingir primeiro seu escudo.'],
   ['Âncora de Guarda','Quando defender uma passagem mais estreita que sua posição.','Uma manobra bem-sucedida impede o avanço de um único alvo naquele instante.','Não cria parede invisível nem permite novo ataque.','Seu corpo segura a porta enquanto alguém foge.'],
   ['Recuperação de Base','Após ser deslocado por uma manobra.','Use seu movimento normal para recuperar um apoio estável antes do próximo ataque.','Uma vez por cena; sem movimento extra e sujeito ao terreno.','Você recua um passo para o terreno firme em vez de cair no desnível.'],
   ['Pulso Defensivo','Ao escolher proteger em vez de atacar em um turno.','Receba +1 no próximo teste de Aparo ou proteção a aliado realizado até seu próximo turno.','Uma vez por cena; não concede Reação adicional.','Você prepara a guarda enquanto os outros recuam.']
  ],
  branches:{
   '0':[
    ['Bastião Vivo','Ao ocupar cobertura física entre perigo e aliado.','Você pode declarar qual linha de ataque realmente intercepta, protegendo a rota escolhida.','Uma vez por cena; ataques por outras direções continuam possíveis.','Você protege o curandeiro atrás da escada.'],
    ['Parede de Corpos','Com aliados formando uma linha defensiva real.','Escolha um deles para receber +1 em teste de Guarda enquanto a formação se sustentar.','Uma vez por cena; apenas uma pessoa recebe o bônus.','A linha de escudos mantém o corredor.'],
    ['Abrigo de Último Segundo','Se uma cobertura próxima está prestes a ser abandonada.','Permita que um aliado mantenha seu benefício defensivo até seu deslocamento seguinte.','Uma vez por cena; exige cobertura ainda presente.','Você segura a porta contra a pressão até o aliado sair.'],
    ['Peso Compartilhado','Ao absorver um impacto físico usando equipamento preparado.','Aponte a estrutura que recebe a carga e reduza em 1 o dano final a um aliado protegido.','Uma vez por cena; não funciona se não houver contato plausível.','Seu escudo distribui parte do golpe pela parede.'],
    ['Guarda de Retirada','Quando um aliado recua através de sua posição.','Pode impedir um único avanço adversário com uma manobra adequada em vez de causar dano.','Consome sua Reação normal; uma vez por cena.','Você coloca a lança entre perseguidor e aliado.'],
    ['Última Coluna','Depois de proteger alguém de golpe físico.','Pode manter sua posição como apoio para a próxima ação de socorro aliada.','Uma vez por cena; sem cura automática.','Você resiste próximo ao ferido para que seja atendido.']
   ],
   '1':[
    ['Leitura da Lâmina','Após observar duas vezes o mesmo padrão de ataque.','Receba +1 na próxima tentativa de Aparo contra esse padrão.','Uma vez por cena; um padrão só e ainda gasta Reação.','Você reconhece o golpe horizontal do espadachim.'],
    ['Ângulo de Riposta','Se um Aparo físico bloquear parte de um golpe.','Identifique uma abertura ofensiva que seu próximo turno pode explorar.','Uma vez por cena; não concede ataque fora de turno.','Seu punho desvia a lâmina e revela o flanco.'],
    ['Ferro que Retorna','Quando vencer uma disputa de armas em combate.','Pode reposicionar a arma adversária para tornar uma rota de retirada sua mais segura.','Uma vez por cena; não desarma automaticamente.','Você afasta a ponta da lança e se aproxima da coluna.'],
    ['Parry Estudado','Depois de uma Defesa Perfeita bem-sucedida, se a regra experimental estiver ativa.','Receba +1 numa manobra de controle posterior contra o mesmo alvo.','Uma vez por cena; não altera chance do Parry nem gera outra reação.','A coincidência dos dados ensina o ângulo de retirada.'],
    ['Troca de Ritmo','Ao escolher Esquiva em vez de Aparo.','Se a Esquiva for bem-sucedida, identifique uma linha de aproximação para o turno seguinte.','Uma vez por cena; sem deslocamento grátis.','Você sai do alcance do machado e enxerga o lado livre.'],
    ['Retorno da Guarda','Após vencer uma reação física em combate.','Pode proteger sua arma ou escudo contra uma pequena manobra de desarme imediatamente seguinte, com +1 na oposição.','Uma vez por cena; não repõe a Reação gasta.','Você mantém o punho firme depois do bloqueio.']
   ]
  }
 },
 precisao:{
  base:[
   ['Leitura de Distância','Ao gastar tempo observando um alvo visível.','Descubra se há cobertura parcial ou total no trajeto do ataque planejado.','Não revela fraquezas secretas nem concede ataque grátis.','Você percebe que a coluna intercepta parte da flecha.'],
   ['Linha Respirada','Depois de uma Ação Principal dedicada à mira.','Ganhe +1 no próximo ataque à distância naquela linha.','Uma vez por cena; perde ao mover a mira para outra direção.','Você espera a arma estabilizar antes de disparar.'],
   ['Mira de Interrupção','Se um alvo cruza uma passagem conhecida.','Pode preparar uma manobra de controle para impedir sua rota, em lugar do dano normal.','Uma vez por cena; requer alcance e ação preparados.','Seu disparo obriga o inimigo a interromper o avanço.'],
   ['Ponto Vulnerável','Após observar a proteção física por uma rodada.','Identifique um ponto realmente exposto que pode ser atacado sem ignorar toda a armadura.','Não revela informação invisível; exige linha de visão.','Você vê a abertura entre ombro e couraça.'],
   ['Distância de Segurança','Depois de alcançar uma posição elevada ou protegida.','Reconheça uma linha de retirada que preserve sua precisão no turno seguinte.','Uma vez por cena; sem movimento extra.','Você conhece onde se abaixar após o tiro.'],
   ['Disparo de Paciência','Quando atacar depois de estudar um mesmo alvo por duas ações.','Converta seu +1 de mira numa chance de manobra precisa sem dano, se acertar.','Uma vez por cena; deve escolher dano ou controle.','Você acerta a alça da bolsa para prendê-la ao obstáculo.']
  ],
  branches:{
   '0':[
    ['Assinatura do Alvo','Ao observar sinais físicos identificáveis do mesmo adversário.','Escolha uma característica de movimento para acompanhar e obtenha +1 em um ataque posterior.','Uma vez por cena; se perder o alvo, perde a leitura.','Você reconhece a inclinação da perna ferida.'],
    ['Fenda de Couraça','Quando o alvo usa armadura com ponto exposto confirmado.','Em ataque bem-sucedido, ignore 1 ponto de Absorção daquela peça.','Uma vez por cena; nunca ignora defesa inteira.','A ponta encontra a abertura na junta do braço.'],
    ['Silêncio antes do Disparo','Se permaneceu imóvel e oculto até atacar.','Sua primeira ação ofensiva pode manter uma Marca de Latebra que o barulho não revelaria, se o mestre julgar plausível.','Uma vez por cena; ruído e linha de visão ainda importam.','A besta dispara atrás de um pano pesado.'],
    ['Concentração de Caçador','Após um ataque à distância falhar por cobertura.','Reconheça qual obstáculo interrompeu o trajeto; obtenha +1 ao adaptar o próximo disparo.','Uma vez por cena; alvo e posição devem permitir adaptação.','Você desloca a mira acima do parapeito.'],
    ['Ferida Reconhecida','Quando um aliado já expôs uma vulnerabilidade do alvo.','Pode trocar o dano do próximo ataque por manobra de imobilização de um membro alcançável.','Uma vez por cena; requer acerto e material adequado.','Você acerta uma corda na articulação exposta.'],
    ['Foco Implacável','Se atacou o mesmo alvo por dois turnos consecutivos.','Receba +1 no terceiro ataque contra ele.','Uma vez por cena; perde ao trocar de alvo.','Você aprende o tempo entre as defesas adversárias.']
   ],
   '1':[
    ['Geometria do Campo','Ao inspecionar duas posições de tiro diferentes.','Identifique qual uma possui menos interferências físicas.','Sem bônus se ambas estiverem igualmente bloqueadas.','Você compara a janela e o parapeito.'],
    ['Alerta de Trajetória','Quando um aliado prepara um ataque à distância.','Aponte uma interferência visível e ofereça +1 numa correção pertinente.','Uma vez por cena; não substitui a ação do aliado.','Você avisa sobre a coluna próxima ao alvo.'],
    ['Disparo de Cobertura','Se uma passagem está desimpedida e sob sua mira.','Um tiro acertado pode ser manobra para deter o deslocamento em vez de causar dano.','Uma vez por cena; exige munição e linha de tiro.','Você força o invasor a voltar para trás da porta.'],
    ['Linha Cruzada','Quando dois aliados cobrem trajetórias distintas.','Pode designar um quadrante em que um alvo ficará pressionado se avançar.','Não provoca ataque automático ou alvo preso.','Duas bestas vigiam saídas opostas.'],
    ['Mapa Mental','Após observar um local de combate por uma rodada.','Indique uma posição segura para um ataque aliado na rodada seguinte.','Uma vez por cena; exige caminho acessível.','Você aponta a pedra que protege o arqueiro.'],
    ['Vigia da Passagem','Ao abandonar uma linha de tiro preparada.','Pode manter a informação sobre a passagem para um aliado sem perder sua própria ação seguinte.','Uma vez por cena; não dá bônus cumulativo.','Você orienta quem assumirá a guarda do arco.']
   ]
  }
 },
 mobilidade:{
  base:[
   ['Passo de Névoa','Ao sair de cobertura real sem fazer ruído.','Preserve uma pequena vantagem de ocultação numa travessia curta comprovadamente segura.','Uma vez por cena; não é invisibilidade.','Você atravessa duas pilastras quando ninguém observa.'],
   ['Solo Aprendido','Depois de explorar o piso de uma área.','Evite uma penalidade de terreno específica na próxima travessia bem preparada.','Uma vez por cena; não remove perigos desconhecidos.','Você encontra as pedras estáveis no caminho.'],
   ['Desvio Medido','Após Esquiva bem-sucedida com terreno livre.','Identifique uma rota de aproximação de até 2 m para seu próximo movimento.','Não move no mesmo instante sem gastar deslocamento.','Você enxerga espaço ao lado da mesa.'],
   ['Rastro Interrompido','Quando encerrar movimento atrás de cobertura real.','Pode tentar esconder uma evidência óbvia de sua passagem com teste adequado.','Uma vez por cena; não apaga rastros antigos.','Você cobre pegadas recentes com folhas soltas.'],
   ['Escalada Instintiva','Em superfície já estudada com apoio seguro.','Receba +1 num teste de escalada que use exatamente aqueles apoios.','Uma vez por cena; a superfície não pode ser impossível.','Você usa a fenda que viu antes do combate.'],
   ['Retorno Silencioso','Ao retornar por uma rota já percorrida sem alerta.','Poupe uma interação simples usada para esconder seus passos.','Uma vez por cena; sem movimento extra em combate.','Você recoloca a tábua sem outro ruído.']
  ],
  branches:{
   '0':[
    ['Sombra entre Marcas','Ao atravessar entre duas coberturas com Latebra ativo.','Mantenha uma Marca que seria comprometida por um movimento discreto, mediante teste de furtividade.','Uma vez por cena; barulho evidente ainda revela.','Você rola por trás de um carrinho sem ser notado.'],
    ['Sopro Oculto','Quando um alvo procura sua posição e você não fez barulho.','Receba +1 numa ação de reforçar escondimento permitida pelo ambiente.','Uma vez por cena; não anula descoberta por busca bem-sucedida.','Você controla a respiração atrás do tecido.'],
    ['Entrada Cega','Depois de mapear a visão de uma sentinela.','Pode passar por um ponto cego confirmado sem penalidade de iluminação naquele instante.','Uma vez por cena; não ignora outros observadores.','Você contorna a torre pelo lado sem janela.'],
    ['Fio do Silêncio','Ao atravessar material barulhento previamente estudado.','Anule apenas um ruído mínimo que normalmente denunciaria sua passagem.','Uma vez por cena; exige preparação real.','Você prende as correntes antes de cruzar.'],
    ['Guarda do Rastro','Quando deixar uma cobertura para salvar um aliado.','Pode conservar um indício de Latebra que permita voltar a ocultar-se no turno seguinte.','Uma vez por cena; sem furtividade automática.','Você retorna à sombra usando rota planejada.'],
    ['Ausência Breve','Ao perder uma Marca de Latebra por exposição rápida.','Pode preparar uma única nova Marca se alcançar cobertura válida.','Uma vez por cena; exige ação de ocultação, não é instantâneo.','Após cruzar a luz, você volta para trás da carroça.']
   ],
   '1':[
    ['Trajeto Quebrado','Quando um adversário bloqueia sua rota.','Troque seu ataque normal por uma manobra de desvio com até 1 m de reposicionamento plausível.','Uma vez por cena; não atravessa o corpo do alvo.','Você escapa pelo flanco após um empurrão.'],
    ['Apoio Relâmpago','Ao alcançar um ponto de apoio que foi observado.','Receba +1 numa manobra de equilíbrio ou travessia imediatamente relacionada.','Uma vez por cena; sem salto impossível.','Você pisa no corrimão para contornar o buraco.'],
    ['Recuo em Curva','Após um ataque corpo a corpo que não acertou.','Use seu movimento restante para se colocar fora de uma linha de perseguição previsível.','Uma vez por cena; movimento disponível apenas.','Você contorna a mesa em vez de recuar reto.'],
    ['Corrida com Carga','Quando transportar um aliado que possa ser arrastado.','Reduza a dificuldade de um teste de deslocamento específico em 1.','Uma vez por cena; não altera o máximo de 3 m para arraste por ação.','Você distribui o peso antes de puxá-lo.'],
    ['Ponte de Impulso','Ao alcançar uma passagem estreita com obstáculo baixo.','Permita que um aliado use seu ponto de apoio na manobra seguinte.','Uma vez por cena; exige cooperação e espaço.','Você segura a tábua para outro atravessar.'],
    ['Última Saída','Depois de completar uma travessia difícil sob risco.','Identifique um caminho de fuga alternativo que já seja visível.','Uma vez por cena; não revela passagem secreta.','Você percebe uma escada antes de ela ser bloqueada.']
   ]
  }
 },
 sobrevivencia:{
  base:[
   ['Olho Clínico','Ao examinar um ferido real e acessível.','Identifique um risco imediato observável antes de decidir a intervenção.','Não diagnostica doença secreta nem cura.','Você percebe que a hemorragia ainda não cessou.'],
   ['Recurso Preparado','Se reuniu materiais médicos antes da cena.','Pode tratar a ausência de uma ferramenta pequena como improvisação plausível para um único teste.','Uma vez por cena; não substitui medicina especializada.','Você usa tecido preparado para estancar.'],
   ['Respiração de Ferro','Após sofrer dano sem cair.','Reconheça qual postura física agrava uma lesão e adapte a próxima ação.','Uma vez por cena; não remove Ferimento.','Você passa a proteger o ombro danificado.'],
   ['Retirada do Caído','Ao tentar arrastar um aliado incapacitado.','Receba +1 no teste físico específico para levá-lo até cobertura acessível.','Uma vez por cena; não aumenta os 3 m por Ação.','Você se abaixa e escolhe o caminho curto.'],
   ['Aliança de Socorro','Ao coordenar dois aliados com funções distintas de atendimento.','O ajudante pode oferecer +1 ao atendimento principal, respeitando o teto de ajuda.','Uma vez por cena; assistência ocupa recurso real.','Um segura a luz enquanto outro aplica pressão.'],
   ['Um Minuto a Mais','Ao estabilizar alguém com sucesso.','Reconheça uma ameaça ambiental imediata e recomende cobertura antes que o perigo piore.','Não restaura Integridade nem impede novo dano.','Você move um anteparo para bloquear fagulhas.']
  ],
  branches:{
   '0':[
    ['Mãos sem Tremor','Ao tratar um Ferimento com instrumentos adequados.','Receba +1 em um teste pertinente de Medicina.','Uma vez por cena; não ignora gravidade ou repouso.','Você sutura com cuidado dentro de abrigo.'],
    ['Tempo do Coração','Ao examinar um paciente instável.','Identifique uma mudança perceptível que indique piora naquele instante.','Uma vez por cena; não prevê morte exata.','A respiração se torna irregular e você muda a conduta.'],
    ['Linha de Estabilização','Ao utilizar material preparado em socorro de um caído.','Reduza em 1 a DT de um atendimento específico, mínimo DT 5.','Uma vez por cena; somente com meios suficientes.','Seu kit adequado facilita estancar a lesão.'],
    ['Resgate Coordenado','Quando um aliado carrega um ferido sob sua orientação.','Ofereça +1 num único teste de deslocamento, desde que você ajude.','Uma vez por cena; não soma com outros auxílios acima do teto.','Você sustenta a cabeça durante a evacuação.'],
    ['Vigília Médica','Após estabilizar um paciente e mantê-lo protegido.','Identifique uma ação de cuidado necessária para impedir deterioração previsível.','Não acelera automaticamente os 10 minutos de cuidado seguro.','Você organiza a troca de compressas.'],
    ['Socorro sobre Cinzas','Depois de atender com sucesso sob perigo real.','Pode preparar uma rota de atendimento para outra vítima sem novo teste de diagnóstico da área.','Uma vez por cena; ainda exige ação e material.','Você memoriza onde a fumaça é menos intensa.']
   ],
   '1':[
    ['Carne Persistente','Quando um Ferimento reduz sua capacidade física.','Escolha uma ação não afetada pela região ferida e execute-a sem penalidade indevida.','Não ignora penalidade quando a ação realmente usa o membro.','Mesmo ferido na mão, você percebe um rastro.'],
    ['Abrigo de Urgência','Ao encontrar cobertura após combate.','Identifique uma posição segura adequada para atendimento durante 10 minutos.','Uma vez por cena; depende de não haver ameaça ativa.','Você usa a sala lateral isolada.'],
    ['Passo apesar da Dor','Quando deslocamento reduzido pelo ambiente dificulta socorro.','Receba +1 no teste de travessia por rota previamente conhecida.','Uma vez por cena; não cancela Ferimentos.','Você percorre o corredor que estudou.'],
    ['Instinto de Refúgio','Quando o grupo está perseguido e precisa recuar.','Revele uma proteção natural que já esteja ao alcance e seja perceptível.','Uma vez por cena; não cria cobertura nova.','Você percebe o vão sob a escada.'],
    ['Medo Conhecido','Após resistir a Metus numa situação relevante.','Reconheça uma condição de medo semelhante e oriente um aliado sobre um abrigo real.','Não concede imunidade a Metus.','Você indica um lugar fora da visão do horror.'],
    ['Sobreviver para Contar','Se terminar a cena vivo apesar de um Ferimento.','Registre uma Vivência apropriada para justificar treinamento de resistência futuro.','Não concede PE extra nem cura.','Você aprende a proteger o flanco na próxima luta.']
   ]
  }
 },
 conhecimento:{
  base:[
   ['Hipótese Rastreável','Depois de observar um fato concreto da cena.','Formule uma explicação testável e receba do mestre um dado acessível que a confirme ou conteste.','Uma vez por cena; não revela segredo inacessível.','Você compara marcas de ferramentas nas tábuas.'],
   ['Ferramenta Específica','Antes de tentar um ofício técnico sob risco.','Identifique qual instrumento existente resolveria a etapa principal.','Não faz surgir materiais gratuitamente.','Você reconhece a necessidade de uma pinça estreita.'],
   ['Mapa de Consequência','Após analisar obstáculo com tempo razoável.','O mestre aponta um risco visível de falha que deve ser considerado.','Uma vez por cena; não revela armadilhas ocultas.','Você percebe que a coluna pode cair.'],
   ['Pesquisa Cruzada','Quando duas pistas diferentes descrevem o mesmo evento.','Descubra uma contradição demonstrável, se houver.','Não força o mestre a inventar contradição.','Os horários dos relatos não combinam.'],
   ['Plano Compartilhado','Quando um aliado aceita preparação técnica útil.','Ele recebe +1 num teste específico do plano, respeitando limites de auxílio.','Uma vez por cena; a preparação precisa ser feita.','Você prende uma corda para a escalada.'],
   ['Método Repetível','Após concluir um experimento sem perigo.','Registre condições e ferramentas que permitem repetir aquele procedimento simples.','Não transforma hipótese em Descoberta Estável automaticamente.','Você escreve a sequência para desmontar o mecanismo.']
  ],
  branches:{
   '0':[
    ['Três Rotas','Ao planejar entrada num local conhecido.','Liste até três abordagens plausíveis que existam na cena.','Uma vez por cena; não garante êxito de nenhuma.','Você oferece força, conversa ou contorno.'],
    ['Risco Mapeado','Depois de um aliado detalhar a execução pretendida.','Indique um perigo material que pode ser evitado com preparação.','Uma vez por cena; depende de informação acessível.','Você percebe o chão quebradiço.'],
    ['Janela de Manobra','Ao observar rotina de um inimigo por uma rodada.','Descreva uma oportunidade temporal verificável para ação aliada.','Uma vez por cena; não concede ação extra.','A guarda vira para conferir a passagem.'],
    ['Plano de Segunda Linha','Se um caminho cuidadosamente planejado falhar.','Permita tentar uma alternativa já preparada sem perder tempo redescrevendo-a.','Uma vez por cena; ainda exige ação e testes.','O portão não abre; o grupo usa a escada deixada pronta.'],
    ['Alvo de Pressão','Quando dois obstáculos dependem do mesmo recurso visível.','Identifique qual deles é mais eficiente neutralizar primeiro.','Não revela valores numéricos secretos.','A corrente sustenta dois contrapesos.'],
    ['Voz de Comando','Quando você coordena aliado em ação preparada fora de combate.','Conceda +1 em um teste conjunto pertinente, sem ultrapassar o teto de ajuda.','Uma vez por cena; precisa comunicação real.','Você orienta a retirada de escombros.']
   ],
   '1':[
    ['Perícia de Bancada','Ao estudar equipamento com ferramentas corretas.','Receba +1 num único teste de Engenharia ou competência técnica aplicável.','Uma vez por cena; não altera limites de fabricação.','Você calibra o mecanismo de travamento.'],
    ['Arquivo Vivo','Quando reconhecer um símbolo documentado.','Encontre um vínculo provável com anotação que você efetivamente possui.','Não adivinha inscrição nunca estudada.','Você compara o selo com registros anteriores.'],
    ['Falha Reproduzida','Ao repetir experimento sob condições equivalentes.','Obtenha informação concreta sobre o que mudou na hipótese.','Uma vez por cena; sem sucesso automático.','A mesma pressão agora produz rachadura menor.'],
    ['Engrenagem Encontrada','Quando analisar máquina parcialmente acessível.','Identifique um ponto de manutenção real que permita intervenção.','Não permite desmontagem sem materiais.','Você localiza o pino oculto sob a tampa removível.'],
    ['Vestígio Técnico','Ao inspecionar dano recente numa estrutura.','Diferencie uma ruptura por carga de uma ruptura por corte, quando houver sinais.','Uma vez por cena; evidência pode ser inconclusiva.','As marcas mostram compressão e não serra.'],
    ['Prova de Método','Depois de demonstrar uma técnica em situação controlada.','Registre um protocolo que forneça +1 a uma única repetição preparada.','Uma vez por cena; não dá bônus à criação de poderes desconhecidos.','Você segue a ordem anotada para montar o dispositivo.']
   ]
  }
 },
 regencias:{
  base:[
   ['Escuta da Primeira Ressonância','Ao observar fenômeno compatível com Regência já Desperta.','Reconheça uma sensação ligada à sua Sintonia e formule hipótese de manifestação.','Uma vez por cena; sem novo Despertar gratuito.','Você percebe a vibração particular de Vraek.'],
   ['Âncora Visível','Ao preparar um Eco ou Ajuste aprendido.','Identifique uma condição física real que ancora a manifestação.','Não cria âncora inexistente; não elimina teste.','Você escolhe uma junta para conduzir Kórven.'],
   ['Erro que Ensina','Quando falhar numa tentativa legítima de Tanger.','Registre uma observação verificável útil à investigação posterior.','Uma vez por cena; não dá PE nem acerto automático.','A vibração quebra e você descobre o ponto de perda.'],
   ['Traço Mantido','Ao concluir uma manifestação Estável sem perigo.','Preserve a identificação da âncora para uma tentativa posterior na mesma cena.','Uma vez por cena; não sustenta efeito sem ação.','Você marca o suporte antes de sair.'],
   ['Sintonia Ressonante','Após duas práticas realmente distintas na história.','Peça ao mestre uma pista sobre qual dos seus três d4 ainda está desalinhado.','Uma vez por arco; não corrige o dado sozinho.','Um segundo fenômeno revela a diferença entre sentir e conduzir.'],
   ['Limite Reconhecido','Antes de tentar uma aplicação com consequências sérias.','Descubra qual condição visível interromperia a manifestação.','Uma vez por cena; ainda deve respeitar DT e Descoberta.','Você percebe que a âncora cairá se a viga soltar.']
  ],
  branches:{
   '0':[
    ['Guarda da Âncora','Quando uma manifestação contínua está ancorada em objeto vulnerável.','Pode identificar proteção material que ajude a preservar a âncora nesta rodada.','Uma vez por cena; manter exige ação normal.','Você usa um escudo para cobrir a junta de Kórven.'],
    ['Pulso de Sustentação','Ao sustentar uma manifestação Estável por outra Ação Principal.','Receba +1 no teste pertinente se condições e âncora permanecerem iguais.','Uma vez por cena; não prolonga duração máxima.','Você mantém a alteração por mais um instante.'],
    ['Forma Conservada','Quando a área de efeito é pequena e já estudada.','Evite que a manifestação afete um detalhe próximo fora do alvo definido.','Uma vez por cena; não amplia alcance ou dano.','Você direciona Sælir ao tecido machucado, não ao resto do braço.'],
    ['Âncora Protegida','Após aliado dedicar ação para proteger sua condição de Tanger.','O auxílio pode conceder +1, respeitando teto geral.','Uma vez por cena; não substitui as duas preparações da Maior.','Um aliado segura o apoio contra o vento.'],
    ['Ensaio Metódico','Quando repetir um Ensaio com informação nova e condições alteradas.','O mestre informa antecipadamente a consequência concreta de falha.','Uma vez por cena; não permite repetição proibida do mesmo Ensaio.','Você aprende o perigo antes de testar outra vez.'],
    ['Ajuste Fiel','Ao repetir um Ajuste Estável sob condição controlada.','Pode dispensar rolagem se não houver perigo, oposição ou efeito extra, conforme regra geral.','Não pode converter em intervenção ou dano.','O mesmo pequeno deslocamento acontece naturalmente.']
   ],
   '1':[
    ['Eco Direcionado','Quando uma manifestação aprendida possuir alvo e âncora precisos.','Receba +1 na tentativa de condução do Eco específico.','Uma vez por cena; não transforma Eco em Intervenção.','Você concentra a vibração numa única peça.'],
    ['Refluxo Conhecido','Depois de falhar em condução sob perigo.','Reconheça uma instabilidade material que poderá reduzir o risco numa tentativa futura preparada.','Uma vez por cena; sem segunda tentativa gratuita.','Você identifica onde a pressão retornou.'],
    ['Canal Consciente','Ao estudar um fenômeno ainda não dominado.','Pode distinguir duas possíveis origens de energia, matéria ou estímulo que já estejam visíveis.','Uma vez por cena; não concede Regência nova.','Você separa calor ambiental de calor gerado pelo atrito.'],
    ['Condução Rápida','Ao preparar uma Intervenção Estável com uma única âncora já posicionada.','Pode realizar a preparação material leve dentro da interação permitida pela cena.','Uma vez por cena; não concede segunda Ação Principal.','Você alinha o fio já preso antes do Tanger.'],
    ['Dupla Observação','Se duas influências diferentes sobre o mesmo fenômeno forem observadas.','Registre informação que fundamente uma nova hipótese de Descoberta.','Uma vez por cena; não concede uso duplo de Tanger.','Você compara dois modos de vibração numa chapa.'],
    ['Limite do Fluxo','Quando um Eco aprendido está prestes a comprometer âncora ou aliado.','Escolha interromper o Eco antes de uma consequência secundária previsível, se fisicamente possível.','Uma vez por cena; não impede consequência já resolvida.','Você para a condução antes que o suporte se solte.']
   ]
  }
 }
 };
 const apt={
  combate:['Ceifa Encadeada','Caçador de Últimos Golpes','Último Duelo','Vanguarda Incansável','Senhor do Cerco','Rompedor de Fileiras','Dança de Aço','Fome da Batalha'],
  defesa:['Sentinela do Último Limiar','A Fortaleza Humana','Escudo de Juramento','Parry da Eternidade','Última Interposição','Muralha de Ossos','Vigília Imóvel','Guarda do Sacrifício'],
  precisao:['Última Linha de Mira','Caçador de Brechas','Alvo Impossível','Lâmina de Distância','Vigia dos Sete Ângulos','Momento Exato','Olho sem Desvio','Disparo do Silêncio'],
  mobilidade:['Rastro que Desaparece','Sombra da Travessia','Dança sobre Ruínas','Salto Derradeiro','Inalcançável','Passagem Inaudível','Caminho de Ninguém','Último Desvio'],
  sobrevivencia:['Resgate Impossível','Pulso que Persiste','Médico entre Ruínas','Voto de Permanência','Último Abrigo','Fôlego do Sobrevivente','A Mão que Retorna','Guarda da Vida'],
  conhecimento:['Plano de Contingência','Mestre de Engrenagens','Hipótese Final','Arquiteto de Possibilidades','O Arquivo Vivo','Vigília do Estrategista','Método Impossível','Voz do Plano'],
  regencias:['Ressonância Dupla','Condutor das Âncoras','Mão do Primeiro Eco','Sétima Sintonia','Limiar de Manifestação','Ensaio Improvável','Mestre do Vínculo','Tanger Ininterrupto']
 };
 function describe(node){
  if(node.id==='origem')return {name:node.name,effect:node.effect,trigger:'Escolha a primeira direção.',limit:'Um único caminho contínuo por personagem.',example:'O mestre seleciona o próximo nó.',status:'ready',kind:'Origem'};
  const parts=/^s\d+:(x|[01]{1,3}):([1-6])$/.exec(node.id);
  if(!parts)return null;
  const bits=parts[1]==='x'?'':parts[1],step=Number(parts[2]),entry=C[node.sector];
  const published=bits.length===0?entry.base[step-1]:bits.length===1?entry.branches[bits][step-1]:null;
  if(published)return {name:published[0],trigger:published[1],effect:published[2],limit:published[3],example:published[4],status:'ready',kind:step===6?'Marco':step===3?'Técnica':'Especialização'};
  if(bits.length===3&&step===6){const i=parseInt(bits,2);return {name:apt[node.sector][i],trigger:'Conquista futura do caminho '+bits+'.',effect:'Ápice reservado para desenvolvimento e testes de combate. O efeito definitivo ainda não foi aprovado.',limit:'Em construção: não pode ser adquirido até aprovação do mestre.',example:'A ideia será desenvolvida neste espaço da árvore.',status:'draft',kind:'Ápice em criação'};}
  const focus=node.chapter||node.phase||'Estudo';
  return {name:`Em criação · ${focus} ${step}`,trigger:'A definir para esta bifurcação.',effect:`Lugar reservado à futura habilidade de ${node.label}, na rota ${bits} (${focus}).`,limit:'Este nó não pode ser comprado enquanto estiver em desenvolvimento.',example:'O mestre poderá editar, testar e liberar a habilidade.',status:'draft',kind:'Caminho futuro'};
 }
 return Object.freeze({describe,authored:126,reserved:504,capstones:apt});
});