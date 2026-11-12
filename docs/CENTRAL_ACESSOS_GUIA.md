# HÆMA — Central de Acessos

## Endereço e escopo
Portal → Administração → **Central de acessos** (também em `administracao.html`).
As abas originais de Bestiário, Volumes e Textos Reservados permanecem para operações editoriais específicas; **não** repetem a atribuição individual de livros.

## Entenda o acesso efetivo
Para uma pessoa comum ler um dos três livros reservados, quatro condições precisam ser verdadeiras **simultaneamente**:

1. A conta Google está **aprovada**.
2. A área **Biblioteca** foi autorizada para essa conta.
3. O **livro individual** foi atribuído a essa pessoa.
4. O livro foi **liberado para os destinatários**.

Não existe acesso geral por "só ter a Biblioteca". A liberação do volume não é uma publicação para visitantes ou todas as contas.

O administrador fundador mantém acesso de revisão e não pode ter seus privilégios modificados pela Central.

## Por pessoa
Selecione uma conta pela busca, revise a situação, áreas do site, vínculo opcional de campanha e livros reservados. A seção **Visibilidade efetiva** explica por que cada livro poderá ou não ser aberto. Clique em **Salvar todas as permissões** uma vez; a operação é transacional e verifica a revisão da conta para evitar sobrescrita silenciosa.

Marcar um novo livro em uma conta aprovada marca também a área Biblioteca. O administrador pode desmarcá-la explicitamente, caso deseje manter uma atribuição inativa, mas o painel alertará.

## Por livro
Selecione um volume. O estado **Leitura pausada** bloqueia os jogadores sem apagar suas atribuições. O estado **Disponível para autorizados** libera apenas aqueles com todas as condições acima atendidas.

Em seguida marque ou desmarque destinatários e clique em **Salvar pessoas autorizadas**. O painel confirma antes de revogar pessoas. Contas pendentes ou sem Biblioteca não podem ser editadas por essa lista; use **Por pessoa** para resolver primeiro sua situação.

## Histórico
Registra mudanças individuais, em grupo e publicações; os logs anteriores continuam disponíveis. A migração não altera manuscritos, enigmas, recompensas, progresso, fichas ou vínculos existentes.

## Banco e segurança
`docs/CENTRAL_ACESSOS_20261112.sql` adiciona funções RPC de consulta e salvamento exclusivo para administradores. As tabelas privadas, políticas RLS e funções de leitura continuam como estavam. Não há cópias dos manuscritos nem gabaritos no repositório público.

O teste `tests/access-center.sql` cria uma conta fictícia dentro de uma transação e utiliza `ROLLBACK`; verifica aprovação, área Biblioteca, atribuição de volume, vínculo com campanha, controle de revisão, revogação e negação de acesso administrativo a usuários comuns.

**Crédito:** Site e Sistema criado por Vitor Monte.
