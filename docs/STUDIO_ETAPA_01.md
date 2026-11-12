# HÆMA Estúdio — Etapa 01 / Fundação (alfa experimental)

**Status:** implementação inicial em branch de desenvolvimento. Não declarar o Estúdio profissional completo nesta etapa.

## Objetivo

Ferramenta reservada a contas Google aprovadas com área "studio" (ou administradores), acessível pela Minha Conta. Projetada **exclusivamente para mesa física digital**, com uma janela para o mestre e outra projetada na TV/monitor; jogadores não precisam acessar o site.

## Conteúdo implementado na Etapa 01

- Página isolada em \`estudio.html\`: ferramentas do mestre, renderização 2D Canvas sem frameworks pagos.
- Terreno vetorial autoral: vegetação, pedra, terra e água; pincel de tamanho variável.
- Objetos iniciais: árvores, rochas, tochas e colunas; paredes desenhadas por segmento.
- Tokens movimentáveis, marcação de tokens ocultos, neblina de guerra por área e grade.
- Controle de câmera: mover, roda do mouse para zoom, ajustar mapa; desfazer/refazer.
- Importação de mapa por PNG/JPEG/WebP até 6 MB; importação/exportação JSON e exportação PNG com a visão dos jogadores.
- Salvamento local IndexedDB com nome de projeto, sem upload de mapas ou fichas ao servidor.
- \`projecao.html\`: janela independente somente de visualização, sincronizada no **mesmo computador/navegador/origem** usando BroadcastChannel. Tela cheia pelo navegador.
- Projeção contém somente **pixels já renderizados e mascarados pela neblina**, sem dados do mestre, posições de criaturas escondidas, texto privado ou objetos não revelados.
- Botão para apagar temporariamente a projeção.
- Verificação de acesso no servidor por \`/api/studio-access\`, consultando \`haema_has_area('studio')\` sob sessão Google validada.
- Concessão de "HÆMA Estúdio" na Administração do Portal e entrada contextual no hub somente para contas com autorização.

## Limites da versão alfa

- Uma cena local; ainda não há múltiplas cenas, biblioteca de arte grande, sistema de luz dinâmica, efeito de chuva/vento, linhas de visão avançadas, áudio de mesa ou integração de fichas.
- Pincéis/props vetoriais são temporários e autorais. Não são assets de Crosshead ou outros autores protegidos.
- A posição da janela no segundo monitor é manual; usar o comando de tela cheia após arrastá-la.
- A troca de frames via BroadcastChannel funciona em contextos da **mesma origem e partição de armazenamento**, não entre computadores diferentes.
- Projetos salvos ficam vinculados ao perfil de navegador/dispositivo: faça backup JSON. Privacidade do armazenamento local depende do dispositivo físico.
- Não substitui o Owlbear Rodeo nem oferece colaboração remota.
- Textos da Lore, Bestiário e regras do Manual são completamente independentes.

## Controle de acesso

Migração aditiva: \`docs/STUDIO_01_ACCESS.sql\` expande a lista de áreas aceitas para "studio", sem criar **qualquer concessão**. A função administrativa mantém aprovação explícita, controle de revisão, auditoria e sincronização da Mesa antiga. Nenhuma conta nova ganha Estúdio por ter Biblioteca, Mesa ou Portal.

**Importante:** as páginas HTML/JS vazias são recursos estáticos públicos porque o repositório é público. O editor só inicia após a verificação de autorização no servidor, e nenhum projeto privado é servido desses arquivos. A tela de jogadores não mostra nada sem um canal aleatório ativo originado por uma instância autorizada do editor.

## Sequência planejada

1. **Etapa 01 — Fundação:** acesso individual, editor de cena, fog, tokens e monitor projetado.
2. **Etapa 02 — Mapmaker:** camadas editáveis, seleção múltipla, paredes/portas, biblioteca de imagens próprias/licenciadas, texturas avançadas, iluminação e mais formatos.
3. **Etapa 03 — Cinematografia:** água e fogo animados, chuva, neve, vento, poeira, tempestades, tornados, folhas, iluminação e compositor visual de efeitos reutilizáveis.
4. **Etapa 04 — Tabletop vivo:** integração com fichas/permissões, barras de recursos, condições, efeitos de poderes e controle avançado do mestre, sem conta por jogador.

## Testes necessários antes da publicação

1. Sintaxe dos módulos, integridade dos assets e endpoints.
2. Supabase: usuário pendente negado, concessão studio isolada, revogação efetiva e privilégios de admin preservados.
3. Navegador com login real autorizado: abrir o Estúdio pelo Portal, desenhar, salvar/reabrir, exportar/importar JSON e PNG.
4. Tela física: abrir o projetor, arrastá-lo ao segundo monitor, revelar e ocultar áreas e mover tokens sem vazar tokens ocultos.
5. Recarregar página, bloquear pop-up, movimento reduzido, tela pequena e dados locais.
6. Fazer teste de uso real com cinco tokens e cenas medianas antes de declarar desempenho aprovado.

**Não publicar automaticamente em produção** se a autorização real, os controles da projeção ou o visual falharem. Nenhuma alteração do Manual 0.1, da Lore ou dos leitores da Biblioteca foi autorizada.

Site e Sistema criado por Vitor Monte.
