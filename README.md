# HÆMA — Manual Vivo e Mesa de Jogo 0.1

**Site e Sistema criado por Vitor Monte.**

A implementação atual segue o documento `docs/HAEMA_0.1_Nucleo_Jogavel.md` do pacote técnico do criador. **É um protótipo de playtest, não uma versão final ou cânone definitivo.**

## Navegação pública

- `index.html`: apresentação e acesso às duas áreas centrais.
- `manual.html`: **Manual Vivo**, com o texto dos 14 capítulos do Núcleo Jogável 0.1, índice pesquisável e laboratórios de resolução, combate, recursos, Metus, Latebra e Invicta.
- `mesa.html`: ficha de criação 0.1 e rolador graduado (dado de atributo + dado de competência) compartilhando os mesmos dados.
- `sistema.html`, `ficha.html`, `dados.html` e `arquivo.html`: endereços antigos redirecionam para a referência 0.1; nenhuma regra anterior fica publicada nessas páginas.

## Regras e versões

- 6 atributos e 24 competências, todos em d4 na criação. Distribua 6 avanços de atributos e 8 de competências, máximo d8 inicialmente.
- `rules-0.1.js` é o núcleo matemático compartilhado; `haema01.js` liga a interface a esse núcleo. Não misturar com 2d10.
- A ficha atual usa `localStorage['haema-character-0.1']`. **Não sobrescreve nem apaga** `haema-character-v2` ou `haema-draft-v1`; quando presentes, a Mesa permite exportação para arquivo de preservação.
- O texto oficial enviado é mantido em `docs/HAEMA_0.1_Nucleo_Jogavel.md` sem alterações.
- **O Valor da Interpretação:** adendo do criador em `docs/ADENDO_INTERPRETACAO_0.1.md`, incluído no capítulo 8 do Manual sem alterar o original. Os PE individuais permanecem na faixa de **0–2 por arco [proposta]** presente no 0.1; não há concessão automática.
- `docs/AUDITORIA_0.1.md` registra diferenças entre versões, decisões de compatibilidade e pendências não resolvidas.
- Os simuladores são **demonstrações didáticas condicionais**. Ignis, poderes, rituais, Ápice e cosmologia não possuem implementação jogável.

## Estética e desenvolvimento

Preserva a identidade já aprovada: vinho escuro, carvão, papel envelhecido, símbolo de chifres, ornamentação leve, responsividade mobile-first e cursor animado apenas em dispositivos com mouse preciso.

Site estático para GitHub/Vercel, sem serviços externos necessários além da opção de carregamento de fontes. `index.html` pode ser servido com qualquer servidor HTTP estático.

## Validação e limitações

- Sintaxe JS, CSS, links internos, atributos da ficha, contratos de dados e fórmulas dos simuladores foram revisados estaticamente.
- O navegador gráfico de testes ficou **bloqueado neste ambiente**; os testes visuais e de toque em aparelhos reais permanecem pendentes. Não declarar auditoria visual completa sem essa revisão.
- Toda revisão futura deve preservar a frase **"Site e Sistema criado por Vitor Monte"**.
