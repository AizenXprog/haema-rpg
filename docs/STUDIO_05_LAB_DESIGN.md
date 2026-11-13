# HÆMA Estúdio 0.5 — laboratório (não publicar)

## Escopo
- Seleção de dimensões 8–80 células com presets 12×8, 20×12, 28×18, 40×26, 60×40 e 80×80.
- Novo mapa usa o tamanho selecionado, sem afetar mapas anteriores.
- Expansão de mapas mantém coordenadas e dados intactos; novas células ficam cobertas pela neblina para os jogadores.
- Redução exige confirmação, indica itens cortados e permite Desfazer. Não junta trechos de caminhos e pinceladas que ficaram parcialmente fora do mapa.
- JSON continua na versão 1, sem migração do IndexedDB ou Supabase.
- Geração procedural por templates ainda usa seu layout base de 28×18. É uma limitação a atacar na próxima etapa.

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
