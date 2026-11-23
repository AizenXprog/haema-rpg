# HÆMA · Auditoria da expansão do Bestiário · 23/11/2026

**Site e Sistema criado por Vitor Monte.**

## Referência e contagem

Documento-fonte do mestre: *HÆMA — REGISTRO COMPLETO DE ANIMAIS E CRIATURAS DOCUMENTADAS*, edição de 23/11/2026. As versões MD e TXT anexadas são idênticas. Contém **115 entradas**: **101 espécies estabelecidas** e **14 relatos de bestas cuja existência física não é comprovada**.

Cruzamento por nomes:
- 6 já existentes no site, mantidas com seus textos originais: Brutão, Drax, Alcatrante, Orvek, Velkin e Drissen;
- 95 espécies canônicas inéditas no site (28 do grupo H01, 35 H02 e 32 BIO);
- 14 relatos lendários canônicos enquanto tradição, não enquanto espécie fisicamente demonstrada;
- 19 registros do Bestiário anterior, ausentes no compilado zoológico, mantidos e não reescritos.

**Total após a inserção: 134 entradas, cada uma com cinco parágrafos, sem nomes duplicados.**

## Critérios editoriais

As fichas novas são escritas como notas de observação: contexto regional, morfologia, comportamento ou função ecológica, vestígios e resposta humana, seguido de possibilidade de encontro ou ressalva metodológica. Cada criatura recebe subtítulo próprio. Os parágrafos aproveitam somente informações já presentes no documento-fonte, sem inventar anatomia, dieta, habilidades, estatísticas de combate ou eventos da campanha.

A fonte distingue dimensões que não devem ser confundidas no site:
1. **Risco de exploração:** hostil/risco, não hostil, indefinido. Inclui riscos territoriais e ambientais; não implica que todos ataquem pessoas.
2. **Existência física:** espécie estabelecida; existência histórica com sobrevivência incerta; tradição ainda não comprovada.
3. **Estado de descoberta da mesa:** inicialmente **não especificado**; a importação não declara que personagens descobriram as espécies.
4. **Estado canônico editorial:** canônico, conceito, histórico, proposta e relato canônico enquanto tradição.

Os estados de descoberta não foram definidos automaticamente. Os 14 relatos U01–U14 são `legend`, `unconfirmed_legend`, sem parágrafos liberados para a Biblioteca pública. O mestre pode lê-los dentro de seu Arquivo Técnico autorizado.

## Publicação e preservação

Os 109 registros foram inseridos inicialmente sem liberação pública. A migração `docs/bestiary_109_schema_20261123.sql` amplia campos e a leitura protegida. Após testar a interface, `docs/bestiary_109_release_20261123.sql` faz uma cópia privada e libera somente as 95 espécies canônicas.

Os 25 registros anteriores permanecem intactos em sua redação. O arquivo do mestre acrescenta filtros por classificação e paginação; a Biblioteca recebe uma busca integrada ao livro. Fichas dos jogadores, campanhas, sessões, material, permissões e música não são alterados.

**Nota de continuidade:** sete propostas já existiam e já eram apresentadas no Bestiário anterior, embora o apêndice da fonte afirme que propostas não aprovadas não devem ser contabilizadas entre as 101 espécies canônicas. Esta expansão não as duplica, não as aprova e não altera a política editorial anteriormente aplicada a esses 25 registros.

## Verificação

- Contagens esperadas no banco: 134 registros totais; 25 anteriores + 95 espécies + 14 relatos.
- Publicados após liberação: 120 fichas; relatos reservados: 14.
- Integridade: cinco parágrafos por registro, sem duplicatas por nome ou código.
- Cliente: busca/filtros no livro; Arquivo do Mestre paginado de 18 em 18; layout mobile/desktop.
- Isolamento: leitor normal nunca vê textos de relato não publicado; função privada do mestre exige autenticação, campanha e papel de mestre.
