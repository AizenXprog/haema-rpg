# HÆMA — Portal & Mesa Virtual (visão de produto)

**Objetivo:** um só lugar para jogar HÆMA — combinar a praticidade de gerenciamento de fichas, rolagens e campanha do C.R.I.S. com a leitura visual de cenas/mapas/tokens do Owlbear Rodeo. Inspirar-se na experiência, **sem copiar marca, código ou interface** dos projetos.

## Fase 1: Portal privado da campanha (base desenvolvida; requer conexão Supabase)

- Login Google; jogadores só entram por convite.
- Fichas 0.1 salvas na nuvem e sincronizadas por campanha. Importação voluntária das fichas locais sem apagá-las.
- Acervo de materiais compartilhados ou restritos ao mestre.
- Chat geral; registros de lore, sistema, sessões e planejamento.
- Histórico imutável das alterações de fichas, acervo e registros.
- Mestre autorizado vê dados **da campanha**, não dados privados da conta Google.

## Fase 2: Mesa Virtual de duas telas (PLANEJADA — não implementada)

**Modo de operação aprovado pelo criador:** um único computador opera dois monitores em modo ESTENDER. Na **Tela do Mestre** (monitor principal), Vitor controla tudo, inclusive segredos. Na **Tela da Mesa** (monitor embutido na mesa), somente o material explicitamente publicado por Vitor aparece.

- **Acesso restrito:** controle da Mesa Virtual somente ao proprietário/mestre fundador por padrão. Ser jogador, ter acesso ao Portal ou estar numa campanha **não concede** acesso à mesa, nem aos controles. Vitor poderá delegar acesso nominal e revogável a pessoas específicas, com prazo e capacidades individuais.
- **Painel de Controle do Mestre:** cenas salvas, mapas, tokens, salas, documentos, notas privadas, encontros e conteúdo ainda não revelado. Alternar cenas e preparar a próxima cena sem mudar a projeção. Controles rápidos para ocultar tudo, revelar gradualmente, movimentar tokens e exibir documento/imagem.
- **Janela de Apresentação da Mesa:** janela separada para arrastar ao segundo monitor e pôr em tela cheia; apenas mapa/trecho, tokens e documentos liberados. **Sem informações secretas no HTML, rede ou estado enviados para o monitor de apresentação** — não basta escondê-las com CSS.
- **Sincronização de dois monitores:** publicações do mestre atualizam a tela da mesa imediatamente; a tela do mestre pode pré-visualizar sem publicar. Em caso de falha de rede, a apresentação mantém apenas a última cena autorizada ou mostra uma tela neutra/oculta, conforme escolha do mestre.
- **Compartilhamento remoto opcional, não automático:** permissões explícitas por pessoa e por ação (apenas assistir cena, manipular token específico ou ajudar no controle). Os cinco jogadores podem continuar usando suas fichas/chat do Portal **sem qualquer acesso à Mesa Virtual**.
- Grade, marcação, tokens, salas, documentos, zoom, camadas e neblina de exploração ajustáveis pelo mestre. Tokens de NPCs/áreas ocultas não são enviados para a apresentação até revelados.
- Fichas e recursos HÆMA 0.1 em sincronização futura, sem migrar/destruir as fichas locais existentes. Combate automatizado só com regra aprovada; não inventar mecânicas.
- Auditoria: registrar quem revelou, moveu, compartilhou ou alterou cenas, com hora, campanha e reversão/backup das edições.

**Prioridade de implementação:** fazer primeiro o protótipo dos dois monitores, com dados fictícios e isolamento testado; depois integrar autenticação/controle de acesso no Supabase. Requisitos detalhados em `docs/MESA_DUAL_SCREEN_SPEC.md`. Não disponibilizar acesso ao painel da Mesa em produção antes de validar RLS e tokens de apresentação.

## Fase 3: Recursos avançados do Mestre (PLANEJADOS)

- Preparação de cenas e encontros, NPCs, bestiário e referências — só depois do conteúdo de lore aprovado.
- Notas privadas ancoradas em eventos de campanha e linha do tempo de decisões.
- Auditoria editorial com versões de regras e lore: rascunho → proposta → aprovado → arquivado.
- Exportação e backup integral por campanha; histórico de mudanças acessível ao mestre.

## Limites

O Núcleo Jogável HÆMA 0.1 continua experimental. O site não transforma ideias em cânone nem adiciona poderes e rituais não aprovados. Fichas antigas continuam intocadas. A Mesa Virtual e suas duas telas, assim como as integrações com mapas, são um objetivo futuro, não uma função anunciada como pronta.
