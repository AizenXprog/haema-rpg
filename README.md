# HÆMA — Portal do RPG

Portal mobile-first do sistema autoral de RPG **HÆMA (Haematomânthía)**. Versão visual 2 do site público: estética editorial de manuscrito e gravura, mas com interface focada em RPG de mesa, não em frases promocionais.

## O que inclui

- Página inicial com gravura vetorial de dado de dez faces e animações com suporte a redução de movimento.
- Introdução prática ao sistema e manual 1.0 de consulta rápida em quatro capítulos.
- Ficha de criação com 5 atributos, 16 competências, 4 pontos extras em atributos e 12 em competências, duas especializações e duas técnicas registradas em texto.
- Vida e Defesa calculadas em tempo real.
- Salvamento automático no navegador e importar/exportar ficha `.json`.
- Rolador 2d10 integrado aos valores da ficha, dificuldade e modificador de circunstância.
- Layout responsivo testado com 320, 390, 768 e 1440 pixels de largura.

## Acessar ou publicar

Site estático: `index.html`, `style.css`, `script.js`, sem dependências de build. GitHub conectado à Vercel para deploy automático da branch `main`.

## O que não é final

Conteúdo apresentado é do **manual de playtest 1.0**; equilibragem e detalhes podem mudar. O portal **não** substitui o manual integral e a ficha existente inclui apenas suas regras fundamentais. Metus e a ideia de furtividade Bingo ainda estão em estudo. Nenhuma cosmologia ou lore é afirmada como canônica.

## Acessibilidade e armazenamento

Navegação por teclado, tamanhos de alvo adequados a toque, `prefers-reduced-motion`, status acessíveis e campos identificados. Os dados de personagem são salvos no `localStorage` deste navegador; não existe login nem sincronização entre dispositivos.
