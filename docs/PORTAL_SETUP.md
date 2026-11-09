# Portal HÆMA — configuração segura

**Site e Sistema criado por Vitor Monte.** Referência mecânica: HÆMA 0.1 experimental.

O ambiente dedicado já tem Supabase, Google OAuth e administrador fundador. A reformulação usa aprovação manual e permissões por área. Veja [estado atual e migração aplicada](REFORMULACAO_2026-11-09.md). As instruções de bootstrap abaixo são para um ambiente novo; não reaplicar o SQL legado ao banco existente.

## Infraestrutura necessária

1. Conectar o Supabase ao projeto. Criar um projeto Supabase dedicado ao HÆMA e executar `docs/PORTAL_SQL_01.sql` uma vez e, em seguida, `docs/ACCESS_LIBRARY.sql`, no SQL Editor. Isso se aplica apenas a um banco vazio; as duas etapas já foram aplicadas no HÆMA.
2. Em **Authentication → Providers → Google**, configurar um aplicativo OAuth do Google; registrar o domínio de callback indicado pelo Supabase (normalmente `https://<project-ref>.supabase.co/auth/v1/callback`). No Google Cloud, usar a lista oficial de origens/redirecionamentos exatos, sem `*`.
3. Em **Authentication → URL Configuration**, configurar `Site URL` como `https://haema-rpg.vercel.app` e adicionar `https://haema-rpg.vercel.app/portal.html` e os URLs exatos da prévia de teste na lista de redirecionamentos. Não adicionar URLs de terceiros.
4. No projeto Vercel, configurar `HAEMA_SUPABASE_URL` com a URL HTTPS do projeto Supabase e `HAEMA_SUPABASE_PUBLISHABLE_KEY` com a chave **publishable** (ou anon, na fase de migração). **Nunca definir service_role na interface ou no repositório.** O endpoint `api/portal-config.js` expõe somente esses dados públicos.
5. Fazer o primeiro login Google no Portal. Copiar o UUID autenticado exibido em **Supabase Authentication → Users**. No SQL Editor, executar: `insert into public.haema_platform_admins (user_id) values ('UUID-DA-SUA-CONTA');`. Esse é o passo que habilita exclusivamente o mestre fundador a criar campanhas. Não use apenas endereço de email ou nome para conceder cargo.
6. Atualizar a prévia e testar login, logout, criação de campanha, aprovação/negação/revogação, 5 jogadores, salvamento, chat, leitura do GM e isolamento RLS antes de mesclar para `main`.

## Regras de privacidade

- O mestre vê fichas dos membros, chat geral, registros da campanha e trilha de auditoria, **não** senhas, arquivos privados do Google ou dados de outras campanhas.
- Os jogadores veem suas fichas, os materiais compartilhados e o chat geral. Anotações com visibilidade `gm` e histórico de auditoria são privados.
- Novos usuários entram com Google em estado pendente. O administrador concede áreas e pode associá-los a uma campanha. Convites antigos ficam arquivados, sem permitir novos ingressos.
- Dados de ficha no navegador (`haema-character-0.1`, `haema-character-v2`, `haema-draft-v1`) **não são apagados ou migrados automaticamente**. Existe um botão de importação voluntária que cria uma nova cópia online.
- A coluna `haema_audit` registra alterações de fichas, materiais e registros. Não permite modificações diretas de usuário.
- Chat usa 100 mensagens recentes; os textos não são indexados por mecanismos de busca. Criar rotina de backup, exportação e exclusão conforme necessidade antes de uso real com jogadores.
- Validar as políticas RLS com usuários de teste reais: jogador A não pode ler ficha de B; mestre pode ver ambas; jogador não pode ler lore/registro privado; não membro não pode ler a campanha; jogador não pode criar convite.

## Futuro: Mesa de Jogo integrada

Não está implementada nesta etapa. A arquitetura reserva a campanha como unidade única para integrar futuramente mapas, cenas, tokens, neblina de exploração, rolagens sincronizadas, iniciativa e ficha em tempo real. Ver `docs/PORTAL_ROADMAP.md`.

## Mesa de Jogo com acesso restrito

- A navegação da prévia mostra **Início**, **Sistema**, **Biblioteca** e **Mesa**, com **Administração** para a conta autorizada. `mesa.html` é uma tela de autenticação/autorizações, sem ficha nem rolador incorporados publicamente.
- A ficha e o rolador são carregados de `/api/mesa` após validar o JWT com Supabase Auth e conferir **administrador autorizado** ou concessão explícita em `haema_has_area('mesa')` (com compatibilidade para a antiga tabela de concessões). O acesso direto sem autenticação retorna HTTP 401/403, e sem configuração retorna 503.
- Depois de cadastrar o administrador pela sua **UUID de Google login**, crie a campanha e convide os participantes. No **Painel do Mestre → Integrantes**, use **Permitir acesso à Mesa** para cada jogador escolhido; a permissão pode ser revogada ali.
- Nenhum jogador pode elevar suas próprias permissões. A validação ocorre do lado do servidor e o banco aplica RLS.
- Caso o painel Google ainda mostre 'não configurado', complete Provider Google, Redirect URLs, a migração SQL e as variáveis `HAEMA_SUPABASE_URL` e `HAEMA_SUPABASE_PUBLISHABLE_KEY` na Vercel; publique novamente o deploy após criar as variáveis.
- Para manter o áudio sem interrupção nos dois conteúdos públicos, `navigation.js` continua navegando sem reload entre Início e Manual; o Portal e a Mesa privada exigem carregamento autenticado separado.
- O login Google e as políticas não podem ser considerados ativos antes de testes com duas contas diferentes e um administrador. Não cadastrar mestre pelo nome, email digitado no cliente ou uma variável JS pública.
