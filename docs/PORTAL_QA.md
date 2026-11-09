# HÆMA Portal — QA da prévia

- `node --check portal.js` e `node --check api/portal-config.js`: passaram.
- Sem credenciais, o portal apresenta aviso de configuração e não oferece login falso.
- Renderização local em Chromium (HTML/CSS e resposta simulada do endpoint desativado) em 320, 390, 768 e 1440 px: sem rolagem horizontal, sem erros de script, assinatura preservada.
- RLS de banco foi escrita e documentada, mas NÃO foi executada porque o Supabase ainda não está conectado.
- Testes de OAuth Google, sessões autenticadas, usuários de verdade, chat Realtime, isolamento de campanhas e armazenamento online: PENDENTES até o ambiente Supabase ser configurado.
- Nenhuma chave `localStorage` de ficha legada foi modificada. A importação online cria cópia, sem apagar a ficha local.
- A Mesa Virtual com mapas/tokens é roadmap, não faz parte da prévia 0.1.
