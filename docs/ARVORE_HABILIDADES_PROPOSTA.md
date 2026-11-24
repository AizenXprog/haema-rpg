# HÆMA — Constelação das Escolhas: proposta experimental da Árvore de Habilidades

**Direção criativa:** Vitor Monte — **Site e Sistema criado por Vitor Monte.**
**Data:** 24/11/2026. **Estado:** protótipo de interface e regras candidatas; não é cânone, não está balanceado em sessão humana, não altera o Manual Vivo 0.1 nem os perfis antigos.
**Referências:** Bíblia Mestra e registro compartilhado `/RPG/HAEMA`; Manual Unificado candidato de 23/11; Ressonância e Manifestações Evolutivas em elaboração.

## 1. Princípio da árvore

- Inspiração de escala e navegação na árvore passiva de Path of Exile, sem reproduzir ativos, código ou conteúdo do jogo.
- **UMA TRILHA CONTÍNUA** por personagem: o próximo nó só pode ser filho direto do último adquirido; quando houver bifurcação, as outras escolhas permanecem fechadas. Todos começam no centro e escolhem entre sete grandes direções, sem classes obrigatórias.
- **631 nós visíveis** na versão geradora: um núcleo + sete áreas de 90 nós cada. Cada área possui quatro gerações de seis nós; cada fim de geração se bifurca, gerando 56 pontos finais possíveis. Cada personagem compra no máximo 24 nós.
- Os 631 nós são **estrutura visual e catálogo experimental**, com efeitos mecânicos candidatos parcialmente reutilizados em ramos diferentes. Não equivalem a 631 habilidades únicas e aprovadas. Para uma versão oficial, escrever e testar cada efeito, evitar repetições vazias e validar possíveis combinações.
- Cada etapa exige 4/6/8/12 PE conforme a geração (seis etapas por geração). Uma trilha completa custa **180 PE**, equivalente hipoteticamente a cerca de 120 sessões com média de 1,5 PE/sessão, se tudo for destinado à árvore. Não forçar essa economia sem harmonizar com os outros usos de PE.
- A aquisição não modifica automaticamente o núcleo de dados, combate, manual ou as 22 técnicas humanas. No protótipo, descreve benefícios de mesa experimentais e registra escolhas.

## 2. Sete direções

1. Combate — finalizações, pressão, ataques encadeados e manobras.
2. Defesa — guarda, Aparo, interposição, proteção; Parry é adquirido exclusivamente como habilidade do ramo de Defesa (nó s1:1:4, após suas etapas anteriores), não é uma Reação universal inicial. O efeito detalhado de Defesa Perfeita permanece experimental e depende de regra de mesa aprovada.
3. Precisão — oportunidades, linhas de tiro, pontos vulneráveis.
4. Mobilidade — posicionamento, Esquiva, travessia, Latebra.
5. Sobrevivência — socorro, retirada, Ferimentos, preparação.
6. Conhecimento — investigação, estratégia, instrumentos e métodos.
7. Regências — Sintonia, Eco, Descobertas e aprofundamento em Tanger, **com acesso apenas após Despertar registrado pelo mestre**. Não libera automaticamente nenhuma Regência ou Descoberta.

## 3. Marcos de ação extraordinária (propostas, não regras ativas)

**Ceifa Encadeada:** uma vez por cena, se um ataque do próprio personagem incapacitar um inimigo hostil real, concede imediatamente um ataque comum contra outro inimigo que JÁ esteja ao alcance. Não pode encadear, não gera nova Invicta, não funciona com alvos cúmplices/fictícios nem concede movimento gratuito. Candidata a nó final excepcional.

**Ressonância Dupla:** uma vez por cena, após sucesso com uma manifestação Estável de Tanger como Ação Principal, pode tentar um segundo Eco ou Ajuste compatível no mesmo turno, com +2 DT e âncoras válidas. O segundo efeito não provoca dano adicional nem concede outra Invicta. Escalas elevadas em duplo uso estão **fora de escopo** até balancear economia de ações e Ignis. Isso traduz a ideia de duplo Tanger sem permitir dois ataques devastadores por rodada.

**Conservação de escolhas:** toda compra é uma decisão permanente. Jogadores não podem apagar, revender ou seguir uma ramificação abandonada. Correções excepcionais do mestre exigem procedimento separado, confirmação e histórico auditável; o protótipo não inclui botão de reset.

## 4. Experiência visual e sessão presencial

- Mapa SVG radial escuro, com dourado envelhecido e vinho, ligações que acendem ao conquistar nós, distinção entre bloqueado, disponível e adquirido.
- Pan e zoom com mouse/touch, foco por setor, detalhes de cada habilidade e prévia de caminhos não escolhidos.
- Perfil por personagem salvo na campanha e seletor para o mestre apresentar os caminhos dos cinco jogadores.
- Modo **Projeção** para telão/TV. O mapa pode ser navegado sem comprar nada; para adquirir um nó exige sessão autenticada, saldo PE e confirmação explícita.
- Legibilidade em celular, teclas de foco e `prefers-reduced-motion`; a navegação entre páginas já existente mantém o áudio global.

## 5. Persistência e segurança

- Tabela nova `haema_tree_progress` vinculada ao `haema_characters.id`, sem tocar no JSON ou `rules_version` das fichas legadas. Ledger próprio de `pe_available`, `pe_spent`, `path`, `awakened` e versão.
- Tabela append-only `haema_tree_events` com ator, personagem, data, ação e valores de aquisição.
- RLS permite **leitura** ao proprietário do personagem e ao mestre da campanha. Sem escrita direta por cliente autenticado.
- RPCs `haema_tree_unlock`, `haema_tree_grant_pe`, `haema_tree_set_awakened` validam pelo servidor autenticação, ownership/GM, campanha, saldo, versão, Despertar, ID e predecessor. Nunca usar metadados editáveis do usuário para autorização.
- A economia da árvore é um **ledger experimental separado**. O saldo não está sincronizado com o PE da ficha ou do Manual Unificado. Antes de oficializar, definir mecanismo único de PE para impedir duplicidade.
- A migração em `docs/ARVORE_HABILIDADES_SQL_EXPERIMENTAL.sql` é aditiva e deve ser validada antes de executar no banco real. **Não assumir que a tabela já está instalada.**

## 6. Plano de aceitação

1. Selecionar cada um dos cinco personagens da campanha; nenhum jogador vê ou compra nodes do personagem de outro usuário.
2. Mestre concede PE; jogador compra um nó; atualizar a página preserva o caminho.
3. Clique duplo/requisição simultânea não duplica compra; o servidor registra uma vez e desconta PE uma vez.
4. Bifurcação escolhida bloqueia todas as irmãs; é impossível saltar um grau ou mudar de setor.
5. Dois dispositivos consultando o mesmo personagem exibem a mesma sequência após atualizar.
6. Candidato sem Despertar não compra ramo de Regências; mestre autoriza sem modificar a ficha legada.
7. Modo projeção funciona numa tela de mesa; no celular a árvore permite pan/zoom sem rolagem da página.
8. Visual mantém identidade HÆMA, som global sem reiniciar, foco acessível e redução de movimento.
9. Testar em combate as habilidades de ação extra; nenhum efeito cria cadeia infinita.
10. Não publicar nem anunciar mecânicas como oficiais até aprovação do criador, testes humanos e harmonização com o Manual Vivo.

## 7. Estado real desta entrega

Arquivos de prévia: `arvore.html`, `arvore.css`, `arvore-data.js`, `arvore.js`, testes. O código de gravação requer migração nova no Supabase. Nenhuma compra está garantida como persistente sem a instalação e verificação da migração. A publicação na branch principal exige revisão separada. Nenhum arquivo privado da Lore é copiado ao repositório público.
## Revisão de interface — 24/11/2026

- Ao clicar em uma habilidade imediatamente comprável, o mestre recebe confirmação de compra; o desconto e a validação continuam exclusivamente na RPC do Supabase.
- Ao clicar em um descendente ainda distante, a constelação registra apenas o planejamento da trilha por meio da RPC dedicada, sem consumir PE.
- O painel rápido informa saldo, custo, estado e próxima ação. Há destaques de PE insuficiente, conquistas, planejamento e espaços em construção.
- Zoom ancorado no cursor, arraste com mouse, pinça com dois dedos, foco animado e tratamento de movimento reduzido.
- Nenhuma compra é automaticamente desfeita ou estornada: decisões são permanentes e auditadas.
- Esta revisão de UI não altera os 631 identificadores, os 126 nós descritos, os 504 rascunhos ou a economia experimental.
