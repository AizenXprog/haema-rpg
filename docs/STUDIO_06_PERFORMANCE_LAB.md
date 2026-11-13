# HÆMA Estúdio 0.6 LAB — resposta de interface e custo de renderização

**Status:** apenas experimento em branch e PR draft. Não publicar no domínio oficial sem autorização explícita.

## Diagnóstico baseado no código 0.5

1. O editor chama `drawScene()` sincronamente para cada evento de movimento, mesmo quando já há outros eventos pendentes do mesmo quadro.
2. Cada árvore ilustrada é redesenhada do zero com dezenas de caminhos Canvas 2D a cada quadro; um mapa com centenas de árvores repete essa geometria em cada movimento.
3. `renderFog` cria uma máscara em resolução nativa e varre cada pixel. Em 80×80 células de 48 px a máscara tem 3840×3840 = 14.745.600 pixels, mesmo se todo o mapa estiver revelado.
4. O editor redesenha objetos fora da área visível quando há zoom ou deslocamento da câmera.
5. Com uma segunda janela, cada transmissão de projeção também re-renderiza o mapa completo e codifica uma imagem WebP. O fluxo da projeção já possui limitação de cadência; esta etapa não altera a segurança da transmissão.

Essas conclusões são **leitura estática do código**; não são medições de FPS em dispositivos reais.

## Implementado

- `studio/render-scheduler.js`: o editor consolida eventos de renderização em uma pintura por `requestAnimationFrame`, reduzindo trabalho redundante no mesmo quadro. Salvar, pintar, desfazer e projetar mantêm seus próprios ciclos.
- `studio/fog-renderer.js`: máscaras completamente abertas dispensam alocação e varredura; completamente fechadas usam preenchimento opaco único. Máscaras parciais têm resolução de trabalho com teto ~1,2 milhão de pixels, sem modificar coordenadas de neblina nem arquivos JSON.
- **Privacidade em mapas grandes:** qualquer célula oculta é reforçada com retângulo opaco nas coordenadas lógicas exatas da projeção, de modo que a redução de resolução da máscara orgânica não revela pixels secretos.
- `studio/prop-art.js`: sprites gerados localmente e guardados em cache LRU limitado a 560 variações (112×112 pixels). Arte e variação determinística dos objetos permanecem, sem serviços ou assets adicionais.
- `studio/scene.js`: na área de trabalho do mestre, a renderização elimina props e tokens fora do viewport com margem de segurança. A exportação integral e a projeção não recebem o parâmetro viewport e continuam renderizando todos os elementos visíveis aos jogadores.
- `tests/studio-render-performance-06.cjs`: teste do coalescimento de eventos, máscara completa/variável, tamanho máximo da máscara, recorte de visão, cache de objetos e segurança de neblina. Suíte anterior permanece via GitHub Actions.

## O que não está comprovado

- Não foram medidos FPS, latência de arrasto, memória da GPU ou tempo para abrir mapas em navegadores reais. O teste sintético de 200 eventos em um quadro verifica coalescimento, **não** um ganho percentual de FPS.
- O terreno orgânico ainda possui geração de pixels na thread principal e pode bloquear a abertura de um mapa muito grande. Migração do raster para processamento fatiado/Worker é uma evolução futura prioritária.
- O desenho de pontes e objetos vetoriais em mapas muito densos ainda requer profiling com Performance API e execução visual.

## Próxima validação

Testar mapas 28×18, 60×40 e 80×80; arrastar tokens e pincéis em 30%, 100% e 200%; abrir projeção em outro monitor, verificar blackout e neblina; medir frame timing e pico de memória. Só após isso aprovar eventual produção.

**Autoria:** Site e Sistema criado por Vitor Monte.
