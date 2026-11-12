# Lote 04 — checkpoint de validação (12/11/2026)

Status: em andamento, somente preview. Não integrar o PR 11 antes de validar os fluxos autenticados.

## Recuperação e publicação
- Produção preservada: 7ff0a38b4924e9370f4182c69d7b3ab276e30da5 (Lote 02).
- Branch: codex/haema-1-lote-04.
- PR: https://github.com/AizenXprog/haema-rpg/pull/11 (draft).
- Implementação inicial: 625077dd7be28344a070c58bcdab0e4faf5f002e.
- Modo leve: 84d3b40cd7fa5a69aeaf356ee281e31b0966a836.
- Correção de transporte UTF-8: 6a5a75a04175e69e4354f34c5664779ebbda15da.

## Diagnóstico e alterações
O Lote 03 não estava implementado na branch principal. A fonte original integral dos dois volumes foi localizada e confrontada com o conteúdo inserido no schema privado: ambos os comparativos JSONB retornaram true, quatro capítulos por livro. Nenhum texto narrativo foi incluído no repositório.

Migração aditiva docs/LOTE_04_BOOKS.sql aplicada. Ambos os volumes permanecem privados, revisão 0. Administrador pode revisar e decidir explicitamente a liberação; leitores precisam de conta aprovada e permissão Biblioteca. Liberações têm revisão otimista e registro de auditoria. Bestiário mantém seu mecanismo independente.

Leitor com índice, capítulos, paginação sem cortar parágrafos, Escape, retorno de foco, limpeza ao fechar e revalidação de acesso. Dois canvases persistentes, neve/areia, rajadas, fragmentos, alterações por capítulo, adaptação de densidade/quadros, pausa em segundo plano e movimento reduzido. Geada e vestígios vetoriais autorais; nenhum desenho é apresentado como anatomia canônica de Drax.

Correções: histórico entre âncoras preserva estado; índice do Bestiário limpa aria-busy; Escape devolve foco ao menu; trailer mantém foco acessível; leitor mantém botões desativados nos limites e bloqueia rolagem da página de fundo. Arquivos de testes/documentação excluídos do deployment.

## Testes executados
- 313 verificações estáticas e sintaxe JavaScript.
- 20 verificações de preservação/navegação.
- 10 verificações de ciclo de vida cinematográfico.
- 28 verificações de clima: modo leve inicia, movimento reduzido, mudança de capítulo, pausa, retomada e descarte idempotente.
- 11 verificações isoladas da API de volumes executadas no ambiente anterior: método, token, provedor, identificador, RPC, cache e erro redigido.
- Supabase real, transações com rollback: 7 grupos de autorização dos volumes, 5 do Bestiário e 2 de isolamento de fichas/materiais. Não equivalem a login OAuth completo.
- Preview: nove páginas e três URLs antigas respondem 200; APIs de volumes, Bestiário e Mesa respondem 401 sem token e private/no-store; documentação SQL e testes respondem 404.
- Navegador real na preview: Sistema, Biblioteca, Manual; rolagem d8+d4; retorno entre âncoras preservando dado; início do OAuth chega ao Google; menu mobile abre, fecha com Escape e devolve foco.
- Leitor local com autenticação e textos SINTÉTICOS: aberturas dos dois volumes, índice, capítulos, última página desativada, Escape, remoção do DOM privado e foco na capa. Inspeção visual de 320, 390, 768, 1366 e 1920 px; texto sem overflow horizontal. Jankinss testado nas quatro últimas, Frikten em 320 px e desktop. Nenhum erro JavaScript observado no leitor local.
- Mídia na preview anterior: trilha ativada continua indicada após navegação; abrir trailer pausa a trilha e incorpora o vídeo correto. Reprodução completa e continuidade temporal do áudio ainda não certificadas.

## Pendências obrigatórias
- Importante: concluir OAuth com sessão autorizada e validar leitor privado real, administração, permissões, fichas e materiais ponta a ponta. A tela Google está aguardando o titular; não há credenciais disponíveis ao agente.
- Importante: revisar o resultado artístico com os textos originais na sessão autorizada; os vestígios são fragmentos não canônicos, sem referência oficial de Drax.
- Qualidade: completar medição prolongada de CPU/memória e efeitos em dispositivo físico menos potente; as verificações de responsividade não substituem isso.
- Importante: confirmar reprodução efetiva dos dois trailers e continuidade temporal do áudio, incluindo pausa/retomada.
- Importante: revisar preview do último commit, então integrar somente após verificações essenciais satisfatórias. Produção não foi atualizada.

## Preservação
Manual 0.1, regras, cálculos, áudio e APIs existentes preservados por comparação; contas e permissões existentes não ampliadas. Testes no banco são revertidos. Nenhuma migração destrutiva. Não foi desenvolvido Mapmaker/Tabletop. Crédito preservado: Site e Sistema criado por Vitor Monte.
