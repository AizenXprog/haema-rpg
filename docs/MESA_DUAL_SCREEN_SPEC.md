# HÆMA — Mesa Virtual privada: Mestre + Tela da Mesa
**Diretriz aprovada de produto · 09/11/2026 · ainda não implementada**

**Autoria:** Site e Sistema criado por Vitor Monte.

## Fluxo físico de uso
1. Um computador controla **dois monitores independentes (modo Estender)**.
2. **Monitor 1: Tela do Mestre.** Planejamento, notas, trilha de auditoria, documentos privados, camadas ocultas, posicionamento de NPCs, mapa completo e controles do sistema.
3. **Monitor 2: Tela da Mesa**, embutido na mesa. Janela separada, aberta pelo mestre em tela cheia e movida ao segundo monitor. Mostra somente o conteúdo publicado: mapa atual, sala/ambiente revelado, tokens visíveis, pistas e documentos liberados. Não exibir navegador, cabeçalhos, notificações ou dados administrativos durante sessão.
4. O mestre prepara/edita uma cena **sem alterar a apresentação**; botão explícito **REVELAR NA MESA** publica o estado autorizado. **OCULTAR A MESA** troca imediatamente para tela neutra; **REVELAR DOCUMENTO**, **ABRIR CENA**, **FOCAR ÁREA**, **ATUALIZAR TOKENS** são comandos separados e auditados.
5. Login dos jogadores no Portal mantém ficha, materiais e chat. **Não equivale a acesso à Mesa Virtual.**

## Permissões e segurança (invariantes)
- Proprietário fundador: controle total por identidade Supabase `auth.uid()` combinada a autorização administrativa vinculada a campanha — nunca por email ou variável JS pública.
- Padrão: **nenhum outro usuário** tem permissão para abrir painel do mestre nem a tela de apresentação.
- Delegação opcional via whitelist com identidade de usuário, permissões `view_scene`, `move_assigned_tokens` ou `assist_gm`, validade, escopo da campanha e revogação instantânea. Nunca conceder automaticamente via cargo `player` ou convite genérico ao Portal.
- Viewer do monitor secundário usa sessão de visualização *separada* e escopo estritamente de apresentação (pode ser sessão curta vinculada ao mestre no mesmo PC); não herda a autorização de leitura completa do painel do mestre. Revogar/expirar sessão, exigir confirmação ao abrir outro dispositivo.
- O servidor deve enviar uma **projeção filtrada (server-side)** do estado da cena. A UI não pode receber segredos, textos de GM, salas ocultas, posições ocultas ou documentos não revelados. Não depender de `display:none` ou `hidden=true`.
- Supabase RLS controla leitura, escrita e publicação; não confiar em botões ou rotas client-side. Arquivos de lore/GM em Storage privado com URLs temporárias, somente após autorização. Nunca publicar `service_role` no browser.
- Alterações em mapa, concessões, revogações, revelações e acessos sensíveis geram eventos imutáveis de auditoria. Logs não expõem segredos a jogadores.
- Permissão da apresentação é independente de ser mestre/participante do chat; a tela física da mesa não precisa mostrar dados individuais que o mestre não publicou.

## Capacidades de interação
**Mestre:** biblioteca de mapas, múltiplas cenas, salas, camadas, névoa, tokens, documentos; desenho/medidas; nota flutuante privada; seleção do que transmitir; preparação sem revelar; salvamento automático/versionamento; atalhos e botões grandes durante a sessão.

**Tela da Mesa:** panorama limpo, sem menus administrativos; transições de cenas suaves e leves; mapa em tela cheia; foco/zoom comandado pelo mestre; visualização de documentos, tokens e trechos revelados; estado seguro por padrão. Nenhuma capacidade de editar sem autorização explícita e limitada.

**Jogadores (Portal):** criar/editar fichas HÆMA 0.1, consultar materiais publicados e conversar no chat. Não controlar a Tela da Mesa por padrão. Permissões individuais futuras exigem concessão do fundador.

## Fluxo de implementação e validação
1. Desenhar protótipo local das duas janelas usando cenas falsas e verificar em dois monitores com **tela estendida**, não espelhada.
2. Implementar schema de cenas, projeções filtradas, delegações por usuário, sessões de apresentação curtas e auditoria.
3. Conectar Supabase Authentication, RLS e Realtime; validar com proprietário, jogador A, jogador B, usuário não convidado e visualizador de apresentação.
4. Testar segurança: usuário sem permissão recebe 403/negado; tokens expirados não dão acesso; notas e camadas ocultas não aparecem em requests/respostas da tela; revogação corta acesso imediatamente.
5. Testar suspensão, perda de conexão, segunda tela desconectada, zoom do navegador, 1920×1080/4K e monitores com resoluções diferentes. Testar que voltar de uma cena não revela um mapa anterior indevido.
6. Testar que o Manual Vivo, os cálculos HÆMA 0.1, a música e as fichas locais antigas não sofrem regressões.
7. Só publicar no site principal quando as políticas e testes estiverem completos. Não apresentar protótipo de interface como mesa funcional.

## Limites da etapa presente
O portal pode ser desenvolvido agora com identidade visual final e banco por campanha. **Não existe ainda Mesa Virtual sincronizada e segura em produção.** A referência de C.R.I.S. e Owlbear Rodeo é funcional, não um pedido para copiar interface, código ou criar integração automática. Regras em aberto continuam fora do simulador.
