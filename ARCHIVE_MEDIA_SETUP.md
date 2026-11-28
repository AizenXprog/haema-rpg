# HÆMA Archive v0.3 — integração experimental de mídia

Esta branch não modifica o catálogo, as categorias, o Supabase nem os arquivos do MEGA. O endpoint usa a sessão privada de uma conta dedicada ao projeto, idealmente com acesso de somente leitura a pastas específicas. Não cria links públicos.

## Configuração segura (Vercel Preview)
- HAEMA_MEGA_SESSION_JSON: sessão serializada por Storage.toJSON() da biblioteca MEGAJS, obtida localmente mediante login na conta dedicada. Trate como credencial de alto privilégio. Nunca publique no GitHub, em chats ou no HTML. Configure diretamente no painel da Vercel como variável sensível.
- HAEMA_MEGA_ROOT_HANDLES: lista separada por vírgulas dos IDs das pastas autorizadas do projeto (oito caracteres cada). Não use a raiz de uma conta pessoal.
- HAEMA_SUPABASE_URL e HAEMA_SUPABASE_PUBLISHABLE_KEY: já utilizados pelo HÆMA.

A sessão é restaurada pelo servidor; cada solicitação exige sessão HÆMA válida e aprovação de haema_is_admin, além da pertença a uma pasta explicitamente autorizada. As prévias são geradas sob demanda, em memória, sem mudar o original. Os arquivos não são publicados em URLs públicas. Para revogar, encerre a sessão dedicada no MEGA e remova a variável sensível na Vercel. Não desative 2FA.

## Antes de promover a produção
Instalar dependências e gerar lockfile; revisar as dependências e executar testes. Configurar a sessão apenas em Preview. Testar com uma imagem WebP, uma PNG transparente, um mapa grande, um usuário comum e um visitante; conferir erros/quotas e integridade do download. O piloto limita a fonte das prévias a 40 MB/100 megapixels e o download a 150 MB. O MEGA e a Vercel têm limites de transferência e execução, portanto o piloto não promete tráfego ilimitado. O link manual permanece como contingência.
