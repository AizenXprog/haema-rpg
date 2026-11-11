# HÆMA 1.0 — Lote 02

Estado: implementação revisada em preview; publicação autorizada pelo usuário em 11/11/2026 com adiamento explícito das verificações pendentes para a próxima atualização.

## Base e escopo

Produção auditada: e1df49ffa29ad0b68f4c872411fa424b342d236f (Lote 01, PR #9). Este commit é o ponto de recuperação. Branch exclusiva: codex/haema-1-lote-02. PR: https://github.com/AizenXprog/haema-rpg/pull/10

O Lote 01 entregue contém navegação Início/Sistema/Biblioteca, conta ligada ao Portal administrativo, campanhas separadas e URLs anteriores preservadas. O Lote 02 evolui essa estrutura.

## Alterações

- Composição gótica do lobby, arquitetura vetorial original, iluminação discreta, tipografia e trailers integrados.
- Sistema editorial, Manual com seletor derivado dos 14 capítulos e indicação de leitura, simuladores com contraste e movimentos de resultado sem mudar cálculos.
- Atmosfera de arquivo na Biblioteca; capa, leitor e controles do Bestiário preservados.
- Identidade compartilhada para Portal e administração, campos, estados de foco e navegação contextual.
- Transições nativas com fallback, proteção contra respostas antigas e histórico incorreto. Cabeçalho e instância de áudio preservados.
- Efeitos leves em mobile, economia de dados, hardware limitado e amostra inicial de quadros lentos. prefers-reduced-motion e limpeza de listeners/observadores/animações.
- Correções encontradas na revisão: contraste das explicações dos dados, espaçamento do seletor de capítulos, cliques durante transições e altura de botões mobile.

Nenhuma migração, mudança de autenticação, ampliação de acesso, dependência paga, livro novo ou ferramenta de mesa foi introduzida. Conteúdo dos nove main HTML permanece idêntico à base; regras, áudio, autenticação e leitor verificados por testes de preservação.

## Testes executados

- node tests/lote01.cjs: 312 verificações estáticas e sintaxe JavaScript aprovadas.
- node tests/lote02.cjs: 20 verificações de preservação e navegação em ambiente simulado aprovadas (concorrência, histórico, foco, fallback e movimento reduzido).
- node tests/cinema-lifecycle.cjs: 10 verificações em ambiente simulado aprovadas (movimento reduzido, mobile, hardware limitado, degradação e limpeza).
- git diff --check: sem erros de whitespace; apenas avisos locais LF/CRLF.
- Navegador na preview: desktop 1440x900 e mobile 390x844; lobby, Sistema, Manual, seleção de Combate com foco no summary, simuladores de teste e combate, menu mobile, Portal, Biblioteca, bloqueio sem login de administração/campanha/Mesa, retorno do histórico.
- Mobile: largura do documento sem overflow horizontal no Manual e Biblioteca; modo quiet observado. Altura final dos botões do lobby ~59px.
- Trailers: abertura do iframe dos dois vídeos e remoção ao encerrar; segundo ID 3TnG60ywgFQ confirmado. Reprodução audiovisual completa não certificada.
- Música: controle ativou e estado ativo observado após navegação Sistema/Manual. Continuidade temporal e comportamento completo com trailers não certificados; não declarar teste auditivo completo.
- Contraste corrigido dos textos de cálculo confirmado no DOM e visualmente. Sem erros de console nas amostras consultadas; não constitui auditoria completa.

## Pendências transferidas por instrução do usuário

- E2E com contas aprovadas/negadas/admin: login completo, salvar/recuperar fichas, operações administrativas, materiais e liberação/leitura privada do Bestiário. Sem sessão autenticada disponível; não houve exposição ou alteração de dados para contornar isso.
- Certificação de continuidade temporal do áudio, ciclo de 30s e reprodução completa dos vídeos.
- Medição quantitativa de desempenho em aparelhos reais, auditoria integral de contraste/teclado e emulação visual de movimento reduzido. O ramo de movimento reduzido foi testado em VM, não em dispositivo real.
- Revisão visual das telas internas autenticadas após login.

## Commits e preview

- 7404dc5014f65062edbca3ac5e1b42aab1df64bd: linguagem visual e navegação.
- 41d202763e2041695c025538edcb3eed22b1f13d: contraste e testes de concorrência.
- 7d2e23923fe75f64c55249e89baa80e5be916f84: controles durante transições e ciclo de animações.
- d4aca01374f34cf4b29b33e1ef29ddf8edf0a682: correção mobile final.

Preview final do código validado: https://haema-4xmt0jdqk-orton1.vercel.app/ (READY).
Produção: https://haema-rpg.vercel.app/

Crédito preservado: Site e Sistema criado por Vitor Monte.
Lote 03 não iniciado.
