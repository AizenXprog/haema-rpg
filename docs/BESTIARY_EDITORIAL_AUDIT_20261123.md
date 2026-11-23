# HÆMA · Auditoria editorial do Bestiário (23/11/2026)

**Site e Sistema criado por Vitor Monte.** A redação segue o formato já estabelecido nos registros aprovados: testemunho de observação em português literário, cinco parágrafos, anatomia e hábitos apresentados com prudência, relações ecológicas sem confundir hipótese com fato, e nota do observador ao final.

## O que foi preservado
- O nome de cada criatura, seu número e a origem de seus dados.
- A separação entre estados editoriais: 3 cânones, 3 conceitos, 12 históricos e 7 propostas.
- Os fatos existentes e as incertezas científicas, sem adicionar poderes, atributos de combate, geografia ou culturas novas.
- Os seis textos narrativos já estabelecidos como referência editorial, sem reescrita.
- O backup privado de todas as 25 fichas, incluindo textos e liberações anteriores, em `haema_private.bestiary_editorial_history`.

## Entradas revisadas (19)
**Históricas — 12:** Marruk, Urréu, Duvri, Gorrul, Iskrel, Serkhi, Ketzar, Luthen, Vellor, Ralmu, Ostil e Ervâl.

**Propostas — 7:** Ghôrruk, Enzél, Khaulen, Vesskar, Tirum, Sïrras e Uldra.

**Referências preservadas — 6:** Brutão, Drax, Alcatrante, Orvek, Velkin e Drissen.

Todas as entradas estão em cinco parágrafos completos. As sete propostas continuam registrando suas questões de revisão biológica. Material histórico permanece histórico: publicação para leitura não significa homologação canônica.

## Processo seguro de publicação
1. Guardar cópia editorial em `haema_private` sem acesso direto de navegador.
2. Validar contagem das 25 fichas e seus 125 parágrafos.
3. Publicar o código do leitor que diferencia visualmente estado canônico, conceito, histórico e proposta.
4. Executar `docs/BESTIARY_RELEASE_ALL_20261123.sql` uma vez para liberar todos os parágrafos, sem alterar `editorial_state`.
5. Conferir `haema_private.book_index` e `haema_private.book_entry` indiretamente por conta autorizada e verificar isolamento de pessoas sem permissão.
6. Registrar as revisões e acompanhar o conteúdo, sem atualizar o cânone automaticamente.

## Arquivo do Mestre
Novo espaço privado em `mestre.html`. Usa dados novos em `public.haema_gm_archive` com RLS por mestre/campanha. O mestre pode criar registros de jornadas, sessões, NPCs, locais, pistas, encontros, cronologia, recursos e notas, vinculando-os aos animais publicados sem copiar seus textos. Os registros antigos e as fichas dos jogadores continuam separados e intactos.

## Segurança
Políticas permissivas antigas que permitiam acesso amplo a campanhas, personagens, mensagens, materiais e registros privados foram removidas. Critérios específicos de membro/mestre permanecem ativos. O teste SQL sintético com `ROLLBACK` confirmou que um jogador com permissão de materiais não consegue ler nem inserir informações do arquivo privado.

**Este documento descreve o que foi editado e verificado, não a aprovação de novas espécies como cânone.**
