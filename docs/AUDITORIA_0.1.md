# Auditoria de transição — HÆMA 0.1

Data: 05/11/2026. Fonte prioritária: `HAEMA_0.1_Nucleo_Jogavel.md` do pacote técnico fornecido pelo criador. **0.1 = protótipo experimental, não regras definitivas.**

| Superfície | Antes (incompatível) | Referência 0.1 | Ação |
|---|---|---|---|
| Início | 2d10 / 5 atributos / 16 competências | dados graduados; 6 atributos; 24 competências | Revisar números, navegação e avisos |
| Manual | Manual 1.0 antigo; 2d10, Vida, Defesa, Firmeza, Ímpeto anterior | Núcleo Jogável 0.1, 14 seções | Substituir por 14 capítulos fiéis, com demonstrações isoladas e aviso experimental |
| Ficha | 5 atributos de 1 a 3, 16 competências de 0 a 2, limites antigos | 6 atributos e 24 competências em d4; 6 e 8 avanços até d8; Guarda d6 | Criar nova ficha com grau do dado e recursos derivados |
| Rolador | Dois d10 + números | dado do atributo + dado da competência, teste contra CD | Novo rolador coerente com ficha 0.1 |
| Recursos | Vida, Defesa 12+Reflexos, Tensão | Integridade, Guarda/Defesa, Fôlego, Ferimentos, Sobrecarga, Ímpeto, Metus | Novos recursos; edição manual de valores atuais |
| URLs antigas | sistema.html, arquivo.html, ficha.html, dados.html continuam com mecânicas anteriores | Uma única referência ativa 0.1 | Redirecionar endereços antigos para as páginas oficiais, sem links quebrados |
| Dados locais | `haema-character-v2` e chave anterior `haema-draft-v1` | Nova ficha versionada e incompatível | **Não apagar, sobrescrever nem migrar automaticamente**; expor exportação da ficha antiga |
| Créditos | Assinatura no início, manual, mesa e rodapé | Manter | `Site e Sistema criado por Vitor Monte` |

## Pendências explícitas, sem preenchimento automático

1. **Ruído Forte em Latebra:** o documento especifica retirar uma marca ainda não encontrada, mas não determina quem escolhe qual marca. Demonstração não resolve automaticamente esta escolha.
2. **Sobrecarga externa para Invicta:** a fonte menciona Sobrecarga de origem externa, mas não define as fontes/mecanismo para aplicá-la. Demonstração de Invicta ilustra chances; não valida uma conquista real.
3. **Familiaridade profissional [proposta]:** uso uma vez por sessão exige controle de sessão; permanece regra explicada, sem automação arbitrária.
4. **Compra de habilidades/evolução:** custos provisórios. Ficha de criação não adiciona mecanismos automáticos de aquisição/PE não solicitados.
5. **Ignis, Ápice, poderes, rituais e cosmologia:** não definidos. Não são implementados, apenas identificados como reservados.
6. **Confronto e resultado de crítico:** fórmula 0.1 apresentada fielmente; demonstração de ataque básico usa ausência de reação e não escolhe táticas pelo jogador.
7. **Criação de Latebra:** a tabela de duplicatas é lida com auxílio da seção de probabilidades (d4 2d4 sem rerrolagem, duplicatas colapsam). Nenhuma marca repetida conta em dobro.

## Testes obrigatórios pré-publicação

- Página inicial, manual, ficha, rolador e páginas antigas livres de rótulos antigos de 2d10/5/16.
- Criação: exatamente 6 atributos + 24 competências, todos d4, 6 e 8 avanços, teto d8.
- Rolador: atributos/competências selecionados da ficha, cada um com rolagem própria e CD por empate.
- Recursos: `Integridade = 10 + faces(Vigor)`; `Fôlego = 6 + grau(Vigor) − Ferimentos`; `Defesa = 1 + faces(Guarda)`.
- Metus: anulação estritamente `<`, igualdade não anula.
- Latebra: marcas únicas e rastreamento compartilhado de descobertas; Busca Rápida 1d6, Intensiva 2d6.
- Invicta: `5d20`, limiares por graduação, sem registrar ou conceder conquista real.
- Chave antiga de `localStorage` permanece intacta; nova versão em chave separada.
- Layout em larguras 320, 390, 768, 1440 e respeito a reduced motion.
- GitHub e Vercel somente após verificação local, em commit atômico.

## Adendo recebido — O Valor da Interpretação (05/11/2026)

Texto do criador preservado literalmente no arquivo `docs/ADENDO_INTERPRETACAO_0.1.md`, apresentado no capítulo 8 do Manual Vivo como **diretriz complementar**, separado do documento original. Recompensas narrativas e PE por decisões interpretativas significativas são elegíveis, sem julgar eloquência ou frequência de falas. A referência de PE individual do 0.1 permanece **0–2 por arco [proposta]**, sem valores adicionais inventados. Fica pendente validar critérios públicos, concessão e limites antes de automatizar PE na ficha.
