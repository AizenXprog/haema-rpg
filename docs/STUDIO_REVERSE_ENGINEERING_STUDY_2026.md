# HÆMA Estúdio — auditoria técnica de referências (LAB, 13/11/2026)

## Estudos e licenças
- Nimblehold / Crosshead: https://crossheadstudios.com/nimblehold/ . Referência de UX para estradas e rios ajustáveis e ponte automática; código e arte não presumidos livres.
- Owlbear Rodeo: https://docs.owlbear.rodeo/docs/drawing/ . Edição dos pontos, formas e camadas; desenho funcional original.
- Mapwright: https://github.com/LeoMelnyk/Mapwright (MIT no código; texturas CC0 externas). APIs espaciais, composição por fases, análise de colisões e bibliotecas de materiais.
- Dungeon Mapper: https://github.com/evillollive/Dungeon-Mapper (AGPL-3.0). Separação Editar/Preparar/Jogar, camadas, exportação segura, salvamento de sessões; APENAS estudo de conceito, sem copiar código para HÆMA.

## Avanço concreto deste marco experimental
- Geometria própria identifica cruzamentos entre estradas e rios e desenha pontes adaptadas às larguras e direção dos caminhos, com tábuas e guarda-corpos.
- Cada ponte acompanha ao vivo as mudanças do rio e da estrada. Uma estrada pode desligar a criação automática da ponte.
- Edição de estradas e rios pelos pontos da curva: arrastar handles, duplo clique para inserir ponto, Alt + clique para remover, e controle de simplificação de curva.
- Controle visual contextual, sem nova barra flutuante permanente. Limite de handles para desempenho e legibilidade.
- Compatibilidade de JSON: flag de ponte é opcional e assume ativado em mapas antigos.
- Projeção continua a enviar somente pixels revelados; pontes desenhadas antes da neblina.

## Próximos saltos técnicos
1. Pintura subcelular verdadeiramente contínua via máscaras globais, com pincel de suavidade e pressão.
2. Orlas naturais, profundidades da água, reflexos e margens adaptativas; não usar blocos visíveis.
3. Cômodos com paredes compartilhadas, portas com área livre e composição automática de móveis por acessibilidade.
4. Separar mapa preparado de estado da sessão de mesa, mantendo dados secretos no mestre.
5. Testes visuais de mapas grandes, Canvas, memória, mobile e TV em duas janelas reais.

## Regra de publicação
PR de laboratório apenas. Não integrar à main nem publicar em haema-rpg.vercel.app sem autorização explícita do proprietário. Sem assets pagos, código proprietário, GPL ou AGPL incorporado. Autoria: Site e Sistema criado por Vitor Monte.
