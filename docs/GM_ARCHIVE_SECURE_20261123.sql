-- HÆMA: Arquivo Técnico do Mestre — acesso por campanha
-- Regras e textos existentes do Bestiário NÃO são alterados aqui.
-- Migração aditiva; não contém segredos, conteúdo de campanha ou chave privada.
BEGIN;
-- Políticas históricas "access_*" eram PERMISSIVE FOR ALL e sobrepunham
-- verificações de membro/mestre. Remover essas rotas amplas.
DROP POLICY IF EXISTS access_campaigns ON public.haema_campaigns;
DROP POLICY IF EXISTS access_members ON public.haema_members;
DROP POLICY IF EXISTS access_portal_characters ON public.haema_characters;
DROP POLICY IF EXISTS access_portal_messages ON public.haema_messages;
DROP POLICY IF EXISTS access_materials ON public.haema_materials;
DROP POLICY IF EXISTS access_records ON public.haema_gm_records;
-- Preservar as políticas de criação/leitura específicas de cada tabela.
-- Permitir que o mestre administre membros apenas da campanha que dirige;
-- a área de contas globais continua sob procedimentos específicos de admin.
CREATE POLICY gm_members_create ON public.haema_members
 FOR INSERT TO authenticated
 WITH CHECK (public.haema_is_gm(campaign_id) AND (SELECT public.haema_has_area('portal')));
CREATE POLICY gm_members_update ON public.haema_members
 FOR UPDATE TO authenticated
 USING (public.haema_is_gm(campaign_id))
 WITH CHECK (public.haema_is_gm(campaign_id));
CREATE POLICY gm_members_delete ON public.haema_members
 FOR DELETE TO authenticated USING (public.haema_is_gm(campaign_id));
-- "Campanhas e registros" é agora privativo ao mestre. Divulgação voluntária
-- aos jogadores ocorre exclusivamente em Materiais.
DROP POLICY IF EXISTS gm_records_read ON public.haema_gm_records;
CREATE POLICY gm_records_read ON public.haema_gm_records
 FOR SELECT TO authenticated
 USING (public.haema_is_gm(campaign_id) AND (SELECT public.haema_has_area('portal')));
-- O acesso de mestre à própria campanha precisa existir mesmo sem associação
-- duplicada de membro (ex.: na criação de campanha).
DROP POLICY IF EXISTS campaign_read ON public.haema_campaigns;
CREATE POLICY campaign_read ON public.haema_campaigns
 FOR SELECT TO authenticated
 USING ((public.haema_is_member(id) OR gm_id=(SELECT auth.uid())) AND (SELECT public.haema_has_area('portal')));

CREATE TABLE IF NOT EXISTS public.haema_gm_archive (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 campaign_id uuid NOT NULL REFERENCES public.haema_campaigns(id) ON DELETE CASCADE,
 owner_id uuid NOT NULL REFERENCES auth.users(id),
 parent_id uuid REFERENCES public.haema_gm_archive(id) ON DELETE SET NULL,
 kind text NOT NULL CHECK(kind IN ('jornada','sessao','npc','criatura','local','pista','encontro','cronologia','recurso','nota')),
 title text NOT NULL CHECK(char_length(btrim(title)) BETWEEN 1 AND 160),
 content text NOT NULL DEFAULT '' CHECK(char_length(content)<=40000),
 status text NOT NULL DEFAULT 'rascunho' CHECK(status IN ('rascunho','ativo','concluido','arquivado')),
 tags text[] NOT NULL DEFAULT '{}' CHECK(cardinality(tags)<=24),
 bestiary_id text CHECK(bestiary_id IS NULL OR bestiary_id ~ '^registro-[0-9]{2}$'),
 metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK(jsonb_typeof(metadata)='object'),
 archived boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT gm_archive_parent_not_self CHECK(parent_id IS DISTINCT FROM id)
);
CREATE INDEX IF NOT EXISTS gm_archive_campaign_type_idx
 ON public.haema_gm_archive(campaign_id,kind,updated_at DESC);
CREATE INDEX IF NOT EXISTS gm_archive_campaign_parent_idx
 ON public.haema_gm_archive(campaign_id,parent_id);
ALTER TABLE public.haema_gm_archive ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.haema_gm_archive FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.haema_gm_archive TO authenticated;
CREATE POLICY gm_archive_read ON public.haema_gm_archive FOR SELECT TO authenticated
 USING (public.haema_is_gm(campaign_id) AND (SELECT public.haema_has_area('portal')));
CREATE POLICY gm_archive_write ON public.haema_gm_archive FOR INSERT TO authenticated
 WITH CHECK (owner_id=(SELECT auth.uid()) AND public.haema_is_gm(campaign_id) AND (SELECT public.haema_has_area('portal')));
CREATE POLICY gm_archive_edit ON public.haema_gm_archive FOR UPDATE TO authenticated
 USING (owner_id=(SELECT auth.uid()) AND public.haema_is_gm(campaign_id) AND (SELECT public.haema_has_area('portal')))
 WITH CHECK (owner_id=(SELECT auth.uid()) AND public.haema_is_gm(campaign_id) AND (SELECT public.haema_has_area('portal')));
COMMIT;