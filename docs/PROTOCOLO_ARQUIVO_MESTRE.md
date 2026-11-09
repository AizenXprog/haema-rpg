# HÆMA — Protocolo de continuidade entre Sistema, Lore e Site

> Documento operacional **público** e sem spoilers. Não é a fonte de verdade do cânone, nem substitui os arquivos privados.
> Status: proposta de organização para revisão do criador, 09/11/2026.

## Objetivo

Evitar que decisões aprovadas desapareçam, se contradigam ou sejam confundidas com ideias descartadas quando os trabalhos forem divididos entre três chats: **Sistema**, **Lore** e **Site/Codex**.

**Regra central:** mensagens de chat não são fonte definitiva de verdade. A fonte definitiva será um **repositório GitHub privado e versionado**, independente do repositório público deste site. Até esse repositório existir e o criador revisar os arquivos, não declarar a sincronização como concluída.

## Segurança e publicação

- Este repositório do site é **público**. **Nunca** adicionar aqui, inclusive em branches e pull requests, revelações futuras, segredos de mestre, cronologias secretas, senhas, tokens, credenciais ou material privado de jogadores.
- O repositório privado recomendado é `haema-arquivo-mestre` (nome sugerido, ainda não criado). Configurar como **Private** antes de acrescentar conteúdo. Conferir a visibilidade antes de cada primeiro envio.
- A implementação do site pode publicar somente extratos de regras e lore expressamente aprovados como **públicos para jogadores**. Conteúdo privado não deve ser servido por arquivos estáticos, caminhos ocultos, elementos CSS escondidos ou JavaScript.
- Nenhum chat deve criar uma área administrativa pública ou sistema de edição no site sem autenticação, controle de acesso e revisão de segurança.

## Estrutura sugerida no repositório privado

```text
haema-arquivo-mestre/
  README.md
  REGISTRO_DECISOES.md
  CONFLITOS_E_PENDENCIAS.md
  sistema/
    SISTEMA_MESTRE.md
    TESTES_BALANCEAMENTO.md
  lore/
    CANONE_UNIVERSO.md
    CRONOLOGIA_MESTRA.md
    REGISTROS_REGIONAIS.md
  site/
    ESTADO_TECNICO.md
    MUDANCAS_E_DEPLOY.md
  entregas/
    PUBLICACAO_APROVADA.md
```

A estrutura pode evoluir sem eliminar registros ou o histórico Git.

## Papéis

| Chat | Mantém | Não faz unilateralmente |
|---|---|---|
| Sistema | `sistema/`, cálculos, mecânicas, testes, propostas mecânicas | Alterar decisões de lore; publicar regras no site sem autorização |
| Lore | `lore/`, cânone, cronologia, culturas, mistérios, relações históricas | Inventar fórmulas mecânicas; transformar propostas em cânone |
| Site / Codex | `site/`, código do portal, compatibilidade, testes, alterações implantadas | Redefinir a cosmologia, regras ou revelar conteúdo privado |
| Criador | Valida propostas, define o que é público e aprova integrações | — |

## Estados obrigatórios de decisões

- **APROVADO:** confirmado explicitamente pelo criador.
- **EXPERIMENTAL:** regra em avaliação; valores ainda não são definitivos.
- **PROPOSTA:** possibilidade ainda sem aprovação.
- **PENDENTE:** algo que ainda precisa de definição.
- **SUBSTITUÍDO:** deixou de ser referência; indicar o identificador da decisão que o substituiu.
- **SIGILOSO:** marcador de visibilidade, aplicado a qualquer um dos estados acima, nunca publicado no site sem aprovação.

Uma decisão pode ser **APROVADA** conceitualmente e **EXPERIMENTAL** em seus números. Não confundir o nível de certeza de uma definição de lore com o balanceamento de uma mecânica.

## Formato mínimo de cada decisão

```md
### SIS-001 — Título da decisão
- Estado: APROVADO | EXPERIMENTAL | PROPOSTA | PENDENTE | SUBSTITUÍDO
- Visibilidade: PRIVADO | PÚBLICO-PARA-JOGADORES
- Data: AAAA-MM-DD
- Responsável: Sistema | Lore | Site
- Fonte: conversa/arquivo/commit de origem
- Decisão: texto exato ou resumo fiel
- Consequências: módulos afetados
- Substitui: código anterior, se houver
- Verificação: casos de teste, quando relevante
```

Prefixes sugeridos: `SIS-`, `LORE-`, `SITE-`, `INT-` (integrações entre áreas).

## Fluxo de atualização seguro

1. **Antes de começar:** ler os documentos atuais do repositório privado; verificar data, estado e pendências. Se o repositório não estiver acessível, dizer isso claramente e solicitar o arquivo ou acesso; **não simular sincronização**.
2. **Durante o trabalho:** distinguir explicitamente fato aprovado, hipótese, sugestão e lacuna. Não declarar aprovação em nome do criador.
3. **Após aprovação:** registrar a decisão com código, fonte, data, visibilidade, consequências e relações com decisões anteriores.
4. **Escrita no GitHub:** usar branch própria; abrir pull request para revisão. Não publicar alterações diretamente na `main` se houver trabalho concorrente. Evitar sobrescrever versões de outra área.
5. **Integração:** depois de revisão e aprovação do criador, incorporar a mudança. Antes de publicar no site, conferir se o conteúdo está autorizado para jogadores.
6. **Fechamento:** citar os links do commit e/ou pull request e identificar o que ficou pendente. Se não gravou, dizer **não registrado**.
7. **Periodicidade:** conferir o registro ao fim de cada bloco de decisões relevantes, antes da troca de chat e antes de cada release. Um resumo de conversa é apoio, não substitui o registro versionado.

## Regras contra perda e contradição

- Uma atualização **não apaga** decisões antigas; marca-as como `SUBSTITUÍDO` e registra por quê.
- Conflitos têm um item em `CONFLITOS_E_PENDENCIAS.md`, com referências aos dois lados. Ninguém resolve por palpite.
- Um chat edita preferencialmente seus arquivos de responsabilidade. Arquivos comuns exigem atualização coordenada para evitar conflitos de merge.
- Os arquivos atuais do site podem estar atrás das decisões narrativas e mecânicas; divergência não significa que o código esteja aprovado.
- Anexos e conversas **não são automaticamente sincronizados** com GitHub. Cada registro precisa ser efetivamente gravado e verificado.
- Gerar backup do repositório privado periodicamente (clone local ou exportação), preferencialmente em local separado, com acesso restrito.
- Não compartilhar fontes privadas do mestre no site nem entre jogadores por link público.

## Como os chats devem responder a uma tarefa

Cada mudança relevante deve terminar com:
- **Decisões aprovadas nesta rodada:** códigos e resumo;
- **Pendências/conflitos:** códigos e riscos;
- **Situação do registro:** link do PR/commit ou `NÃO REGISTRADO`;
- **Impacto no site:** `nenhum`, `documentação pública`, `mudança técnica requerida` ou `aguardar lore/sistema`.

## Uso no portal público

Este protocolo pode ser consultado no GitHub, mas não autoriza uma área de edição pública no site HÆMA.
Uma futura seção `Arquivo Público` poderá mostrar apenas versões aprovadas para jogadores, com publicação por revisão do criador. Um painel privado de edição exigirá autenticação e armazenamento com controle real de acesso.

---

**Autoria do projeto:** Site e Sistema criado por Vitor Monte.
