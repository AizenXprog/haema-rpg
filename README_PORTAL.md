## Portal privado — prévia de implementação (novembro de 2026)

A branch de prévia inclui `portal.html`, `portal.css`, `portal.js`, `api/portal-config.js`, `docs/PORTAL_SQL_01.sql`, `docs/PORTAL_SETUP.md`, `docs/PORTAL_ROADMAP.md` e `docs/PORTAL_QA.md`.

**Atenção:** o portal ainda não foi conectado ao Supabase. OAuth Google, banco e chat real estão aguardando provisionamento e testes de segurança. A UI mostra essa pendência e não finge autenticação.

Arquitetura planejada para cinco jogadores + mestre: acesso por campanha, fichas 0.1, acervo e chat, notas privadas de lore/sistema, histórico de alterações e futuro tabuleiro virtual inspirado funcionalmente em C.R.I.S. + Owlbear Rodeo (sem copiar identidade/código).

O isolamento de dados usa RLS no banco, não CSS nem controles no navegador. Acesso privilegiado só após bootstrap do UUID do mestre com SQL administrativo. Não armazenar OAuth secrets no GitHub ou no navegador. A música Media Vita segue com player persistente durante a navegação pública e do portal.

## Uso físico da Mesa Virtual (futuro)

O criador opera um computador em dois monitores estendidos: **Painel do Mestre privado** no monitor principal e **Tela da Mesa (somente apresentação autorizada)** no monitor embutido. Por padrão, jogadores do Portal não podem acessar a Mesa Virtual; Vitor delega acesso individual e revogável apenas quando quiser. A apresentação deverá receber do servidor exclusivamente conteúdo explicitamente revelado. Ver `docs/MESA_DUAL_SCREEN_SPEC.md`.
