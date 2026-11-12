# HÆMA Estúdio — Mapmaker Alfa 0.2: pincéis e geração procedural

## Escopo desta atualização

Esta etapa prioriza o **editor de mapas** e não tenta reproduzir interface, código ou pacotes artísticos de terceiros.

### Terrenos e pincéis
- Seleção de grama, terra, pedra, água, areia, madeira, tijolos e mármore.
- Pincel contínuo interpolado enquanto o mestre arrasta o mouse.
- Suavização básica nas bordas entre materiais e traços de água, vegetação, areia e pisos.
- Ferramentas de elevar/rebaixar com níveis 0–4, representados em 2D por realces e contornos (não é geometria 3D).
- Plantio de árvores em sequência com pincel "Floresta".
- Neblina e tokens do protótipo 0.1 preservados.

### Geração e interiores
- Geração procedural determinística por semente de 4 bases: bosque, lago, estalagem e ruínas subterrâneas.
- Desenho de cômodo retangular por arraste, gerando piso, paredes e passagem.
- Props vetoriais autorais para mesas, cadeiras, camas, armários, estantes, baús, tapetes, barris, lareiras, caixas, escadas, portas, árvores, rochas etc.
- A geração altera **apenas a cena local** e pode ser desfeita ou restaurada de um JSON exportado.

### Grade opcional
- Controle explícito e visível acima do mapa: "Grade Visível/Oculta".
- É uma sobreposição independente do terreno: ocultá-la remove as linhas quadriculadas do editor.
- A escolha vale também para a janela projetada e a exportação PNG.
- A configuração é salva junto com a cena JSON e IndexedDB.
- Projetos anteriores 0.1 continuam abrindo; se não contiverem configuração, mostram grade por padrão.

### Preservação e privacidade
- Acesso individual "studio" e autorização pelo servidor permanecem inalterados.
- Nenhuma integração nova com banco, nenhum custo e nenhuma alteração do Manual, Biblioteca ou Lore.
- O projetor recebe somente a imagem visível ao jogador, com neblina aplicada.
- Nenhum prompt é enviado a serviços externos nesta versão.

## Para fases seguintes: arte de alta qualidade e geração por prompts

**Texturas:** atlas e pincéis de materiais naturais com máscaras de transição, decalques, texturas PBR quando fizer sentido, camadas de piso/parede e objetos licenciados ou criados para HÆMA. A existência de imagens 2D de boa qualidade não requer 3D.

**Props:** biblioteca rica de interiores com escala, rotação, alinhamento e agrupamento, móveis, portas e pisos adaptáveis. Modelos 3D (glTF/GLB) só após decidir se há valor real para o usuário e desenvolver renderização adequada; o motor atual é Canvas 2D.

**Prompt para mapa:** interpretação da descrição em uma especificação estruturada de cena (layout de cômodos, terreno, objetos, luzes), validação da estrutura, geração procedural, e refinamento manual no editor. Opcionalmente geração de texturas/assets por IA, sempre com consentimento e respeito a licenças/custos. Não vender esse recurso como implementado na versão 0.2.

## Teste de aceitação

1. Alternar grade on/off sem modificar a textura e sem linhas no PNG ou na projeção quando desligado.
2. Reabrir uma cena salva com grade oculta e confirmar persistência.
3. Importar JSON da versão 0.1 e preservar tokens, paredes, props e neblina.
4. Pintar materiais com mouse arrastado sem linhas quebradas.
5. Elevar e rebaixar sem exceder 0–4.
6. Gerar as quatro cenas; repetir uma semente e obter a mesma saída.
7. Desenhar cômodo, verificar piso, paredes, porta; mobiliar com props e testar desfazer/refazer.
8. Verificar em desktop/mobile e desempenho em vários tamanhos de cena; inspecionar a prévia no navegador antes de declarar acabamento final.
9. Garantir que tokens ocultos e áreas não reveladas não apareçam aos jogadores.

Site e Sistema criado por Vitor Monte.
