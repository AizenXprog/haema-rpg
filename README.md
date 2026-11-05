# HÆMA — Portal do RPG

Site estático, mobile-first, com páginas independentes. Publicação automática pela Vercel ao atualizar `main`.

## Páginas

- `index.html` — início e identidade visual
- `sistema.html` — princípios do sistema
- `manual.html` — regras de playtest
- `ficha.html` — ficha de personagem (localStorage e JSON)
- `dados.html` — rolador 2d10 que lê a ficha local
- `arquivo.html` — estado da documentação

## Identidade

Paleta base: `#423F36` carvão, `#440E15` sangue seco, `#212017` marrom escuro, `#0B0A07` quase preto. Tons adicionais de pergaminho para leitura. Antler emblem original em `assets/antler-sigil.svg`.

A tipografia ornamental usa UnifrakturCook (fontes Google) como alternativa pública. CSS suporta instalação local da fonte **Seagram TFB** para testes, mas não hospeda nem redistribui o arquivo da fonte, que é declarado pelo autor como gratuito apenas para uso pessoal. Para distribuição da Seagram ao público, obtenha licença apropriada e adicione fonte legalmente ao projeto.

## Técnica

HTML, CSS e JavaScript sem framework ou build. Funciona em hospedagem estática e na Vercel. Mobile-first a partir de 320px, botões adaptados a toque, menu acessível, preferência por movimento reduzido. A ficha é local, **sem conta nem sincronização**; para trocar de dispositivo, exporte/import JSON.

## Conteúdo

O manual incorporado é uma consulta resumida da versão 1.0. A cosmologia e os poderes sobrenaturais não foram definidos. O projeto não publica lore fictícia como oficial.