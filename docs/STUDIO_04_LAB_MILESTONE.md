# HÆMA Estúdio 0.4 — laboratório (não publicar)

Branch de desenvolvimento separada de main. Publicação e merge proibidos até a validação visual e funcional no navegador com uma conta autorizada.

## Evidências que motivaram a atualização
A captura enviada em 13/11/2026 mostrou:
- marginhos de água com aspecto quadrado / repetitivo,
- árvores idênticas em formas e detalhes,
- props pouco expressivos,
- o mapa pequeno em relação à área do editor,
- falta de gerenciamento de mapas locais,
- pincel que não acompanha o gesto de arrastar de forma confiável.

## Entrega do marco 01
1. Cena aceita módulo de ilustrações top-down mais detalhado para árvores, arbustos, rochas e mobiliário (fallback permanece para outras props). As variações são reprodutíveis por coordenada: nenhum ruído muda entre quadros.
2. Pintura contínua por ponteiro com amostragem coalescida, espaçamento de 0.15 célula, finalização na posição real de soltura, operações pontuais separadas de pincéis contínuos e cancelamento seguro.
3. Biblioteca local de mapas identificados, listagem, abrir, criar, duplicar, excluir com confirmação, importar JSON como novo mapa; uso do IndexedDB existente, preservando registro legado owner:UUID e isolando chaves por usuário autenticado.
4. Atalho “Meus mapas” no topo, gerenciamento dentro do painel Projeto sem criar barra permanente. Pequeno ajuste de espaço útil do canvas.
5. Correção de marcação HTML incompleta no rótulo da seleção.

## Limitações
- Estes mapas são locais no navegador/dispositivo atual. Exportar JSON é essencial para backup entre dispositivos e quando limpar dados do navegador. Não confundir com sincronização online do Supabase.
- O terreno continua baseado em células lógicas com um raster visual suave. Pincel de precisão subpixel real e texturas premium ainda são metas futuras.
- O renderizador e o desempenho em cenas grandes não foram aprovados sem testes reais de navegador.
- A etapa seguinte deverá focar em margens de água verdadeiramente orgânicas, mais qualidade dos objetos ainda no fallback, e composição de interiores.

## Aceitação mínima antes de merge
1. Crie 3 mapas e alterne entre eles, recarregue e confirme que cada um manteve suas alterações.
2. Abra projeto salvo antes da 0.4: ele deve aparecer na biblioteca sem perder conteúdo.
3. Teste duplicação, exclusão, importação JSON e exportação sem vazamento de dados de usuários diferentes.
4. Arraste grama, água, borracha, vegetação e neblina rapidamente; a pincelada deve acompanhar o mouse sem falhas ou repetições de objetos.
5. Confira variedade das árvores e legibilidade dos móveis com zoom de 40%, 100% e 150%.
6. Valide edição, salvamento, projeção (sem vazar elementos secretos) e permissões.
7. Revise mobilidade, acessibilidade e 0.1-0.3 regression tests.

Site e Sistema criado por Vitor Monte.
