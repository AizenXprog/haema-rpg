# Portal HÆMA — configuração segura (prévia, ainda não ativada)

**Site e Sistema criado por Vitor Monte.** Referência mecânica: HÆMA 0.1 experimental.

O repositório contém interface funcional e migração de banco, mas **nenhum Google Login foi habilitado e nenhum banco foi provisionado**. O painel não libera acesso de mestre até a autenticação e as políticas serem configuradas.

## Infraestrutura necessária

1. Conectar o Supabase ao projeto. Criar um projeto Supabase dedicado ao HÆMA e executar `docs/PORTAL_SQL_01.sql` uma vez, no SQL Editor.
2. Em **Authentication → Providers → Google**, configurar um aplicativo OAuth do Google; registrar o domínio de callback indicado pelo Supabase (normalmente `https://<project-ref>.supabase.co/auth/v1/callback`). No Google Cloud, usar a lista oficial de origens/redirecionamentos exatos, sem `*`.
3. Em **Authentication → URL Configuration**, configurar `Site URL` como `https://haema-rpg.vercel.app` e adicionar `https://haema-rpg.vercel.app/portal.html` e os URLs exatos da prévia de teste na lista de redirecionamentos. Não adicionar URLs de terceiros.
4. No projeto Vercel, configurar `HAEMA_SUPABASE_URL` com a URL HTTPS do projeto Supabase e `HAEMA_SUPABASE_PUBLISHABLE_KEY` com a chave **publishable** (ou anon, na fase de migração). **Nunca definir service_role na interface ou no repositório.** O endpoint `api/portal-config.js` expõe somente esses dados públicos.
5. Fazer o primeiro login Google no Portal. Copiar o UUID autenticado exibido em **Supabase Authentication → Users**. No SQL Editor, executar: `insert into public.haema_platform_admins (user_id) values ('UUID-DA-SUA-CONTA');`. Esse é o passo que habilita exclusivamente o mestre fundador a criar campanhas. Não use apenas endereço de email ou nome para conceder cargo.
6. Atualizar a prévia e testar login, logout, criação de campanha, convites, 5 jogadores, salvamento, chat, leitura do GM e isolamento RLS antes de mesclar para `main`.

## Regras de privacidade

- O mestre vê fichas dos membros, chat geral, registros da campanha e trilha de auditoria, **não** senhas, arquivos privados do Google ou dados de outras campanhas.
- Os jogadores veem suas fichas, os materiais compartilhados e o chat geral. Anotações com visibilidade `gm` e histórico de auditoria são privados.
- Convidados precisam autenticar com Google e apresentar convite de alta entropia. O código é revelado somente no momento da criação, enquanto o servidor armazena seu SHA-256.
- Dados de ficha no navegador (`haema-character-0.1`, `haema-character-v2`, `haema-draft-v1`) **não são apagados ou migrados automaticamente**. Existe um botão de importação voluntária que cria uma nova cópia online.
- A coluna `haema_audit` registra alterações de fichas, materiais e registros. Não permite modificações diretas de usuário.
- Chat usa 100 mensagens recentes; os textos não são indexados por mecanismos de busca. Criar rotina de backup, exportação e exclusão conforme necessidade antes de uso real com jogadores.
- Validar as políticas RLS com usuários de teste reais: jogador A não pode ler ficha de B; mestre pode ver ambas; jogador não pode ler lore/registro privado; não membro não pode ler a campanha; jogador não pode criar convite.

## Futuro: Mesa de Jogo integrada

Não está implementada nesta etapa. A arquitetura reserva a campanha como unidade única para integrar futuramente mapas, cenas, tokens, neblina de exploração, rolagens sincronizadas, iniciativa e ficha em tempo real. Ver `docs/PORTAL_ROADMAP.md`.
