# Biblioteca HÆMA — Três volumes reservados (branch de desenvolvimento)

**Status:** implementação em branch isolada. **NÃO aplicada ao Supabase de produção**, não publicada nem autorizada para merge.

## Arquitetura e preservação
- Os leitores atuais `library.js` (Bestiário) e `volumes.js` (Frikten/Jankinss) não foram modificados.
- Somente a Biblioteca, a navegação de seus novos materiais e o painel administrativo receberam extensões.
- `reserved-books.js` é um leitor adicional de manuscritos privados, com capítulos, paginação, animações, teclado, mobile e salvamento individual.
- `reserved-admin.js` gerencia permissões por usuário, progresso, enigmas, revogações, importação de .md e publicação.
- `api/reserved.js` utiliza o token de usuário autenticado, validado em `api/_access.cjs`, e chama exclusivamente RPCs autorizadas.
- `docs/BIBLIOTECA_RESERVADA.sql` é uma migração **aditiva** com RLS, tabelas em `haema_private` e funções de segurança.
- Respostas dos enigmas, recompensas narrativas e manuscritos **não são armazenados no repositório GitHub**.

## Importação privada e revisão editorial
Os três arquivos `.md` fornecidos pelo criador devem ser importados sem alterar uma letra. O pacote privado entregue separadamente contém cada original e o JSON secreto correspondente (pistas destinadas ao leitor, gabarito privado e revelação narrativa). Estes arquivos não podem entrar em commits, páginas estáticas, logs ou URLs públicas.

1. Preparar um ambiente de teste/preview com banco de testes dedicado, sem afetar produção.
2. Aplicar a migração SQL em banco de testes e executar `tests/reserved-library.sql` com usuário autorizado e não autorizado. O script possui ROLLBACK.
3. Validar a revisão da lore, os fragmentos ilustrativos e as pistas dos enigmas antes de importar.
4. No Portal administrativo, abrir **Livros reservados**, selecionar o manuscrito .md e o JSON privado correspondente; realizar importação.
5. Autorizar individualmente os dois Historiadores, um Político e dois Regentes, conforme decisão do mestre, sem supor permissões automáticas.
6. Conferir cada livro integralmente, inclusive versões mobile, não autorizado, revogação, conclusão e redefinição de enigmas.
7. O administrador controla a publicação de cada volume; o deploy da branch depende de validação prévia e autorização expressa para produção.

## Escopo deliberadamente não alterado
Música contínua, roteamento do site, contas existentes, Portal de campanhas, fichas, sistema e bestiário permanecem como estavam. Nenhuma dependência paga.

## Pendências antes de produção
- Executar a migração e os testes SQL **em ambiente isolado**.
- Testar a interface com navegador e contas reais de ensaio, em celular pequeno/comum e desktop.
- Validar editorialmente os elementos novos dos enigmas, sem alterar o texto original dos três volumes.
- Revisar e aprovar a publicação dos três manuscritos e seus documentos revelados.
- Verificar os checks de preview e o comportamento de autorização após expiração de sessão.
- Não realizar merge em `main` nem publicar no domínio oficial sem a autorização do criador.

**Crédito obrigatório:** Site e Sistema criado por Vitor Monte.
