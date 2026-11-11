# HÆMA 1.0 — Lote 01
Data: 11/11/2026. Estado: implementado em branch e preview; produção preservada.

## Recuperação
Base: `4f0b8e29d3d6b0007db60a1d275e127f8a809647`.
Produção identificada: `dpl_CanPKDGv54Nj7KHPrhAqPLLMgxkM`.
Branch: `codex/haema-1-lote-01`.
PR: https://github.com/AizenXprog/haema-rpg/pull/9
Sem migração ou alteração persistente no banco. Basta descartar a branch para abandonar a proposta; nenhuma restauração de dados é necessária.

## Auditoria e decisões
- Aplicação estática HTML/CSS/JS, com funções Vercel e cliente Supabase compartilhado. Sem package.json ou nova dependência.
- Cabeçalho duplicado nas páginas: unificado visualmente nas nove rotas, mantendo HTML acessível diretamente e navegação persistente. A extração completa para templates fica pendente; não foi introduzido um framework apenas para resolver essa repetição.
- Arquivos de estilos legados grandes permanecem: foundation.css contém a fundação visual delimitada. Não houve remoção indiscriminada de estilos do leitor ou do Manual.
- Início conserva trailers e identidade. Navegação pública: Início, Sistema, Biblioteca. Conta acessa o Portal.
- Sistema organiza Manual Vivo, guia inicial, simuladores, ficha local, fichas online e Atualizações por navegação contextual.
- Portal passa a ser central da conta, acessos e administração. Administração mantém sua URL e guardas de acesso.
- Campanhas e registros passam a campanha.html, preservando editor de fichas online, materiais, conversas, registros e histórico. Sistema aponta diretamente à seção de fichas online.
- URLs antigas, inclusive ficha.html, dados.html e arquivo.html, preservadas. portal.html permanece entrada do Portal; funções anteriores estão alcançáveis pela seção Campanhas.
- Sessão e permissões continuam em auth.js; autorização da API e políticas não foram alteradas.
- 16 tabelas relacionadas consultadas com RLS habilitada; nenhum bucket de Storage registrado. Políticas adicionais de áreas verificadas como RESTRICTIVE.
- Avisos de segurança existentes: funções SECURITY DEFINER de consulta de vínculo, tabelas deliberadamente sem políticas diretas e proteção de senhas vazadas desabilitada. As funções examinadas usam auth.uid() e search_path vazio. Nenhuma mudança de segurança foi feita neste lote.
- Dados locais, cálculos, Manual 0.1, Bestiário, áudio, trailers e conteúdo experimental não foram migrados ou alterados.
- Nenhum livro novo, Mapmaker ou Lote 02 implementado.

## Alterações de código
`86366f1`: reorganização principal.
`dcc277a`: correção do acesso da conta em desktop/mobile e indicação contextual.
Commit posterior: ajuste cosmético de marcadores ativos, texto de entrada da conta, teste reproduzível e este relatório.

## Testes executados
- `node tests/lote01.cjs`: 294 verificações estáticas aprovadas, incluindo alvos locais, três links principais, autoria, conteúdo integral do Manual e código preservado (normalizando somente fim de arquivo na cópia local).
- `node --check`: scripts JavaScript passaram.
- `git diff --check`: sem erro de whitespace.
- `tests/access-isolation.sql`: executado em transação com rollback; isolamento da ficha por proprietário, bloqueio de transferência de propriedade, material privado do mestre, permissão independente de materiais e bloqueio anônimo.
- `tests/access-library.sql`: executado em transação com rollback; bloqueio de conta pendente, autoaprovação, tabela privada e convites; permissões por área; liberação por registro/parágrafo; concorrência otimista; revogação imediata.
- Conferência após rollback: zero usuários, entradas e campanha sintéticos remanescentes.
- Navegador real da preview: Sistema, Manual e simulador (d4 3 + d4 4 = 7 / DT 7), navegação para fichas, Biblioteca, Portal, Administração e Campanhas.
- Visitante sem sessão: guardas de login visíveis nas áreas privadas; nenhum conteúdo privado mostrado.
- Inspeção visual em 390×844 e 1440×900; corrigido cabeçalho que apertava no celular. Menu mobile abriu, navegou e fechou.
- Música: controle indicou reprodução ativa, manteve estado ao navegar, pausou ao abrir cada trailer e retomou ao fechar. Isto verifica estados do player, não uma medição acústica ou continuidade temporal amostrada.
- Trailers I e II: seleção e URLs corretas, abertura do player e fechamento; imagem do Trailer II observada. Reprodução integral dos vídeos não testada.
- Consulta do console retornou lista vazia de erros no trecho final da sessão.
- Preview Vercel READY em `dcc277a`: https://haema-h7ngwnb6b-orton1.vercel.app
- A tentativa de buscar APIs pelo conector Vercel retornou erro de autenticação do mecanismo de share link; não foi contabilizada como teste HTTP conclusivo das APIs.

## Impedimento de publicação e pendências
A preview permanece sem merge. Não havia sessão Google autenticada disponível no navegador de teste, portanto não se declarou concluído:
1. Login OAuth e logout reais na preview.
2. Edição/salvamento/importação/exportação de fichas pela interface autenticada.
3. Leitura autorizada completa do Bestiário e administração de permissões pela interface.
4. Fluxos de materiais, campanhas e registros com conta de mestre e jogador.
5. Reprodução integral dos trailers, ciclo musical completo e testes em aparelhos iOS/Android reais.

Os testes SQL validam o controle no banco, mas não substituem estes fluxos E2E. A publicação permanece condicionada à sua conclusão satisfatória, conforme instrução do criador.

Crédito preservado: Site e Sistema criado por Vitor Monte.
