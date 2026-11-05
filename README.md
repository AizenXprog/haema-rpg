# HÆMA — Portal do RPG

Portal estático mobile-first publicado via GitHub + Vercel.

## Navegação principal (3 entradas)

- `index.html` — início e identidade visual.
- `manual.html` — **manual central**: criação, 2d10, combate, ferimentos, medo, ímpeto, 16 técnicas individuais, 6 combinadas, vínculos e evolução na versão 1.0.
- `mesa.html` — **mesa de jogo**: ficha e rolador 2d10 na mesma página.

As URLs anteriores `sistema.html`, `ficha.html`, `dados.html` e `arquivo.html` continuam publicadas para não quebrar links antigos, mas não compõem o menu principal. Novas regras confirmadas deverão ser incorporadas ao Manual, e não distribuídas em diversas abas.

## Recursos

- Ficha e rolador funcionam sem login e sem backend; dados são locais no navegador e podem ser exportados/importados via JSON.
- Cursor ornamental animado somente para mouse com precisão, sem alterar toque, teclado ou preferência por movimento reduzido.
- CSS e JavaScript leves, sem framework ou biblioteca de animação. Fontes externas via Google Fonts (pode funcionar com fontes de fallback).
- Elementos de visualização de baixa prioridade têm animações desligadas em dispositivos de toque; efeitos de cursor usam `requestAnimationFrame` e `transform`.

## Identidade visual

Paleta: `#423F36` carvão, `#440E15` sangue seco, `#212017` marrom e `#0B0A07` quase preto. Gravura de chifres ornamentais original em `assets/antler-sigil.svg`.

A fonte Seagram não é redistribuída. Para publicação futura, verificar a licença do arquivo da fonte antes de hospedá-la. A tipografia pública usa UnifrakturCook como substituta ornamental.

## Conteúdo

A documentação corresponde exclusivamente ao playtest 1.0. Cosmologia, Metus e demais conceitos em estudo não foram apresentados como regras finais.