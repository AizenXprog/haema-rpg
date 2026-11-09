# Biblioteca privada e aprovação de acessos

Implementação em branch separada, baseada na PR #4 (correção de estilos nas transições). A produção continua na main até aprovação do responsável.

## Comportamento

- Início, Sistema, Biblioteca e Mesa compartilham a navegação. Administração aparece para o administrador autenticado.
- O Manual mantém a introdução “Conhecendo o HÆMA — Entenda sua Ficha”, incluindo Ignis em desenvolvimento, e o núcleo experimental 0.1 sem alteração de regras.
- Um cliente Supabase acompanha a sessão em todas as páginas. Novos cadastros Google aguardam aprovação; autorizações independentes controlam Biblioteca, Bestiário, Portal, Mesa de Jogo e materiais.
- O administrador revisa usuários e libera parágrafos do Bestiário. Revisões são transacionais, auditadas e protegidas contra edições concorrentes. A conta fundadora não pode ser revogada por essa interface.
- A Biblioteca carrega um índice autorizado e busca o texto de um registro apenas quando aberto. O livro tem duas folhas no desktop, uma no celular, teclado, gesto horizontal, foco contido e movimento reduzido.
- Conteúdo privado é removido do leitor ao fechar, sair ou navegar. A cada 60 segundos e ao retornar à aba, o leitor confere acesso e revisões de liberação. Revogação no servidor vale para a próxima consulta; informação já entregue a uma pessoa não pode ser apagada das cópias que ela tenha feito.

## Banco e implantação

`docs/ACCESS_LIBRARY.sql` registra a migração `haema_manual_approval_and_private_library`, já aplicada ao projeto dedicado do HÆMA após aprovação explícita do responsável. Não reaplicar. Não executar novamente o instalador legado `PORTAL_SQL_01.sql` sobre esse banco: ele documenta a instalação anterior e restaura o fluxo antigo de convites.

O banco é compartilhado entre prévia e produção. A migração registra cadastros pendentes, preserva o fundador e os vínculos atuais, adiciona controles restritivos às políticas existentes e desativa novos ingressos por convite. Esse efeito já se aplica ao site anterior. Dados de fichas e suas fórmulas não foram migrados nem modificados.

A tabela do acervo está em `haema_private`, sem leitura direta por `anon` ou `authenticated`, com RLS ativo. Funções públicas invoker chamam helpers privados com verificações explícitas. Os endpoints verificam a conta no Supabase Auth e usam o token do próprio usuário, sem chave privilegiada. Respostas privadas usam `Cache-Control: private, no-store` e `Vary: Authorization`.

O conteúdo editorial é importado por um processo privado, fora deste repositório. Novos registros começam sem trechos liberados. Estado editorial e permissão de leitura são informações diferentes: liberar um trecho não transforma proposta em cânone. Nenhum documento do Arquivo-Mestre, texto de criatura, dump ou captura privada deve ser adicionado aqui.

Variáveis existentes em Preview e Production: `HAEMA_SUPABASE_URL` e `HAEMA_SUPABASE_PUBLISHABLE_KEY`. Não é necessária uma service-role key. No Supabase Auth, o retorno OAuth deve permitir o endereço da prévia antes do teste com Google. Não ampliar a lista de redirects para domínios de terceiros.

## Verificação

- Chrome automatizado: transições entre seis rotas, manutenção do áudio, estilos carregados, larguras de 320 a 1440 px, ausência de erros JavaScript, respostas anônimas 401.
- Interface com sessão simulada: índice sem busca em massa, registro individual, teclado, página única no celular, Escape, limpeza do conteúdo, movimento reduzido, concessão de áreas, liberação de trecho e renderização dos dados da campanha.
- Banco real, em transações com rollback: cadastro pendente, tentativa de autoaprovação, leitura direta do acervo, convites desativados, permissões independentes, liberação por registro/parágrafo, edição concorrente e revogação com os mesmos claims. Também isolamento de fichas e materiais reservados ao mestre.
- Arquivos de teste SQL em `tests/access-library.sql` e `tests/access-isolation.sql`; usar apenas em banco preparado, sem colisão com os identificadores sintéticos. Os scripts não contêm lore.
- `tests/browser.py` usa dados sintéticos e interceptação de sessão para interface. Não substitui autenticação OAuth real. Requer Python, Playwright e Chrome; executar com `HAEMA_TEST_URL` apontando para a prévia e `HAEMA_TEST_ARTIFACTS` fora da pasta publicada.

Ainda é necessária validação humana de entrada/retorno Google, conta fundadora e segunda conta real, além de Safari/iOS e avaliação artística. A referência visual mencionada não foi disponibilizada. Ilustrações anatômicas não foram inventadas; a identidade da capa reutiliza o símbolo existente.

## Reversão

Voltar o frontend não reverte as permissões do banco. Para interrupção de acesso, o administrador pode revogar áreas e retirar parágrafos liberados, preservando registros e auditoria. Não apagar as novas tabelas para desfazer a interface. Restauração do fluxo de convites ou das políticas anteriores exige revisão específica e aprovação, usando o backup privado anterior à migração. Nunca publicar o backup.

O merge na main e a publicação em produção aguardam aprovação. Documentos de acompanhamento do Arquivo-Mestre são entregues separadamente, fora do GitHub público.
