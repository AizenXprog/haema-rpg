# HÆMA Estúdio 0.5 — laboratório (não publicar)

## Escopo
- Seleção de dimensões 8–80 células com presets 12×8, 20×12, 28×18, 40×26, 60×40 e 80×80.
- Novo mapa usa o tamanho selecionado, sem afetar mapas anteriores.
- Expansão de mapas mantém coordenadas e dados intactos; novas células ficam cobertas pela neblina para os jogadores.
- Redução exige confirmação, indica itens cortados e permite Desfazer. Não junta trechos de caminhos e pinceladas que ficaram parcialmente fora do mapa.
- JSON continua na versão 1, sem migração do IndexedDB ou Supabase.
- Geração procedural usa as dimensões do mapa aberto, com relevo/vegetação proporcional e layouts compactos quando necessário.

## Projeção realmente contínua para segunda tela
- O debounce de 100 ms impedia atualizações durante arrastos contínuos.
- A fila agora transmite quadros em cadence limitada (85 ms, aproximadamente 12 FPS no máximo), sem resetar o timer a cada movimento, e descarta trabalho visual obsoleto.
- Imagem WebP via `canvas.toBlob` assíncrono, enviada por BroadcastChannel como Blob em vez de base64.
- Limite de resolução de 2560 px no maior lado ajuda a proteger memória e latência de mapas grandes.
- Blackout cancela quadros pendentes, invalida codificações em andamento e descarta a decodificação de imagens anteriores.
- Somente a imagem já filtrada pelo `drawScene(...,{player:true})` chega à janela dos jogadores; nenhum JSON ou token secreto é enviado.
- Compatibilidade temporária com frames WebP em data URL da 0.4.
- Sincronização local no mesmo navegador/origem, não remota. Uma sala distribuída entre dispositivos exige canal autenticado e estado de sessão isolado.

## Validações
- `tests/studio-map-size-05.cjs` verifica criação, limites, expansão, preservação e recorte.
- `tests/studio-live-projection-05.cjs` verifica cadência, atualização durante movimento, blackout e renderização isolada.
- Workflow `studio-lab-05.yml` testa a suíte do Estúdio em PRs, sem variáveis secretas.
- Não há aprovação visual em duas janelas ou benchmark de FPS até execução específica num navegador real.

## Publicação
Branch separada e PR draft. Não integrar à `main`, publicar em produção ou alterar Portal, Biblioteca, Manual, lore ou Supabase sem nova autorização.

Site e Sistema criado por Vitor Monte.

## Marco seguinte — paredes conectadas e materiais orgânicos

Estudo de arquitetura e comportamento (sem reutilizar código ou assets):
- Mapwright TTRPG, repositório público `LeoMelnyk/Mapwright`, licença MIT: edição de paredes e portas, temas, dados independentes do render e visão do mestre. Estudo conceitual da separação de operações e geometria; nenhuma parte do código copiada.
- Nimblehold/Crosshead: referência de comportamentos públicos das ferramentas para construções editáveis, relevo, rios e caminhos; código e ilustrações permanecem proprietários.
- Owlbear Rodeo: referência de UX contextual, ferramentas de desenho ajustáveis e distinção de camadas/visibilidade dos jogadores.

### Novo motor de paredes de cômodos

- Arquivo próprio `studio/room-topology.js`: segmenta paredes arquitetônicas alinhadas às células em arestas unitárias, une segmentos contíguos e evita duplicação em limites compartilhados.
- Portas viram aberturas reais: uma porta nova recorta o segmento pré-existente. Se outra sala já tiver uma porta no trecho compartilhado, a nova sala reutiliza a passagem, sem duplicar a porta.
- No modo Automático, o lado da nova entrada considera a maior borda em contato com as paredes existentes (com prioridade determinística). Também são oferecidos os quatro lados e opção sem porta.
- Paredes diagonais e livres legadas permanecem intactas. Sem mudanças no formato de JSON, autenticação, neblina ou IndexedDB.
- Construção computa e valida topologia antes de modificar células. Limites de 400 paredes e 500 objetos continuam observados.

### Materiais detalhados de forma procedural

- O raster de terreno `studio/terrain-renderer.js` ganha detalhes estáveis em coordenadas globais para vegetação, terra, areia, pedra, madeira, tijolos e mármore.
- Grãos, veios e juntas usam funções próprias de baixo custo, sem pacotes de textura, serviço pago, recursos externos ou informação de IA.
- A água mantém seu sistema anterior de mistura, profundidade e espuma; não muda o cálculo de neblina.

### Testes novos
- `tests/studio-room-topology-05.cjs`: compartilhamento de paredes, aberturas, autoentrada, portas existentes, compatibilidade com paredes livres e limites.
- `tests/studio-materials-05.cjs`: estabilidade do relevo, limites numéricos, diversidade de materiais, RGB seguro na costa.
- Além dos testes automatizados, ainda é necessário verificar aparência real em navegador com autorização, sobretudo mapas densos de 80 × 80 e projetor simultâneo.

**Publicação:** permanecer somente na PR experimental; `main` e site oficial intocados.
