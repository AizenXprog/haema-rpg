# HÆMA Estúdio 0.3 — Marco 01 / Terreno contínuo e interiores

Estado: prévia experimental em branch separada. Não declarar o Estúdio 0.3 completo sem testes visuais reais.

## Motivo
No Mapmaker 0.2, esconder a grade removia apenas o overlay. O terreno, as elevações e a neblina ainda eram desenhados em retângulos de 48 pixels, denunciando a estrutura lógica.

## Implementado
- studio/terrain-renderer.js: superfície contínua, coordenadas globais, ruído determinístico, mistura irregular nas margens, cores de água, grama, areia, pisos e relevo. Cache por cena com atualização apenas das regiões pintadas e limite de rasterização para mapas grandes.
- studio/fog-renderer.js: bordas suavizadas apenas para dentro do terreno revelado. Pixels de regiões ocultas permanecem completamente opacos na tela dos jogadores. Projeção recebe somente a imagem já mascarada.
- studio/scene.js e studio/editor.js: integração dos novos renderizadores; invalidação do cache dos pincéis, cômodos e neblina; módulos versionados consistentemente.
- Edição de props por seleção e arraste, rotação de 15 graus, duplicação e exclusão.
- Geração por arraste de cômodos com mobiliário editável opcional: quarto, biblioteca ou estalagem. Preserva a geração procedural anterior.
- Régua de distância em células, independente da exibição visual da grade e sem modificar a cena.
- Interface clean e acesso individual do Estúdio preservados.
- Compatibilidade dos mapas JSON 0.1 e 0.2 mantida, sem migração de banco ou serviços pagos.

## Testes sintéticos
- tests/studio-core.cjs — 23 verificações.
- tests/studio-mapmaker.cjs — 34 verificações.
- tests/studio-ui.cjs — 74 verificações.
- tests/studio-organic.cjs — 38 verificações.
- tests/studio-interiors-03.cjs — 28 verificações.
Total: 197 verificações aprovadas em execução isolada. NÃO substituem testes E2E e inspeção visual com login real.

## Limitações e pontos a verificar antes de publicar
- Texturas ainda são procedurais em 2D; não são atlas em alta resolução nem modelos 3D.
- Imagens importadas que já possuem grade impressa nos próprios pixels não são corrigidas pelo toggle de grade.
- O primeiro quadro de mapas grandes pode demorar a rasterizar; avaliar latência e FPS no navegador.
- A neblina ainda usa células lógicas com bordas suavizadas; ainda não implementa linhas de visão complexas.
- A seleção é individual; multisseleção, camadas avançadas, portas inteligentes e geração por prompts permanecem na fila.
- Verificar a grade oculta em 3 níveis de zoom, a costa com água/grama, o PNG, a TV, importação 0.1/0.2, móveis e undo/redo, responsividade e segurança do player.
- Não integrar à main antes de aprovar esses testes visuais.

Nenhuma alteração na Biblioteca, lore, Manual ou banco.
Site e Sistema criado por Vitor Monte.
