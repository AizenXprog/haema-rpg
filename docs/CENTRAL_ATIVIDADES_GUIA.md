# HÆMA — Central de Atividades e Auditoria

A nova seção **Atividades e Auditoria** está em `Portal → Administração → Atividades e Auditoria`.

## Fonte dos eventos

| Categoria | Fonte | Precisão |
|---|---|---|
| Abertura de livro | RPC protegida `reserved_read` | Registrada pelo servidor (limite: um evento por livro a cada 20 min) |
| Mudança de capítulo | RPC `reserved_save` | Registrada na mudança de capítulo, não em cada página |
| Enigma não resolvido | RPC `reserved_solve` | Registra tentativa sem resposta, com limite de um evento/minuto |
| Enigma resolvido | Histórico administrativo existente | Registra a primeira conclusão, sem gabarito |
| Fichas, materiais e notas do mestre | Triggers existentes `haema_audit` | Criação, edição, exclusão; nenhum conteúdo incluído no painel |
| Permissões e liberações | Histórico existente `haema_access_log` | Operações administrativas confirmadas |
| Campanhas e participantes | Novos triggers | Abertura de campanha e entrada/saída de participantes |
| Mensagens | Trigger de inserção | Somente que uma mensagem foi enviada, sem o texto |
| Login e páginas | Avisos autenticados do navegador | Sinais indicativos, não prova integral ou registro de acessos anônimos |

## Segurança e privacidade

- `haema_private.activity_events`: tabela privada com RLS habilitado e sem acesso direto às contas.
- A leitura do histórico exige conta fundadora administradora, via `public.haema_activity_feed` com checagem no banco.
- `haema_audit` já guarda valores anteriores/depois em uma infraestrutura anterior: **a nova tela não retorna esses campos**.
- Não registrar entradas de teclado, IP, conteúdo de mensagem, dados de personagens nem respostas dos enigmas.
- O navegador pode não sinalizar uma navegação por perda de conexão, bloqueadores ou guia fechada: não afirmar que o histórico é perfeito.
- A retenção automática dos eventos novos é aplicada quando surgem novos eventos, com manutenção no máximo uma vez por dia. A administração também possui ação de limpeza manual. Os logs legados não são apagados pela nova função.
- Exportação CSV limitada a 10.000 eventos por arquivo e protegida contra interpretação acidental de fórmulas no Excel.
- Dados guardados por até 90 dias nos eventos novos. O feed consolidado mostra somente janela dos últimos 90 dias, inclusive para o histórico legado, sem apagá-lo.

## Arquivos

- `docs/CENTRAL_ATIVIDADES_20261112.sql`: migração aditiva, triggers, funções e RPCs.
- `tests/activity-audit.sql`: teste com transação e rollback.
- `activity-admin.js` e `activity-admin.css`: painel e filtros.
- `activity-client.js`: sinaliza páginas e sessões de contas autenticadas sem interromper navegação.
- `privacidade.html`: explicação pública da coleta para participantes.

**Preservações:** nenhum manuscrito ou enigma foi alterado, nenhum acesso novo foi concedido, nenhuma conta, ficha, material ou campanha foi excluída.

Site e Sistema criado por Vitor Monte.
