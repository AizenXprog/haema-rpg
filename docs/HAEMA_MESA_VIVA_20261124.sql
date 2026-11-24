-- HÆMA · Mesa ao Vivo / estado operacional privado da campanha.
-- Migração aditiva: não altera fichas, PE, árvore, livros nem dados anteriores.
-- Site e Sistema criado por Vitor Monte.
CREATE TABLE IF NOT EXISTS public.haema_gm_live_state (
 campaign_id uuid PRIMARY KEY REFERENCES public.haema_campaigns(id) ON DELETE CASCADE,
 snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
 updated_by uuid NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT haema_gm_live_json_object CHECK (jsonb_typeof(snapshot)='object'),
 CONSTRAINT haema_gm_live_size_cap CHECK (octet_length(snapshot::text)<=65536)
);
ALTER TABLE public.haema_gm_live_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS haema_gm_live_read ON public.haema_gm_live_state;
DROP POLICY IF EXISTS haema_gm_live_insert ON public.haema_gm_live_state;
DROP POLICY IF EXISTS haema_gm_live_update ON public.haema_gm_live_state;
CREATE POLICY haema_gm_live_read ON public.haema_gm_live_state
 FOR SELECT TO authenticated
 USING(
  (SELECT public.haema_is_admin())
  AND EXISTS (SELECT 1 FROM public.haema_campaigns c
    WHERE c.id=haema_gm_live_state.campaign_id AND c.gm_id=(SELECT auth.uid()))
 );
CREATE POLICY haema_gm_live_insert ON public.haema_gm_live_state
 FOR INSERT TO authenticated
 WITH CHECK(
  updated_by=(SELECT auth.uid())
  AND (SELECT public.haema_is_admin())
  AND EXISTS (SELECT 1 FROM public.haema_campaigns c
    WHERE c.id=haema_gm_live_state.campaign_id AND c.gm_id=(SELECT auth.uid()))
 );
CREATE POLICY haema_gm_live_update ON public.haema_gm_live_state
 FOR UPDATE TO authenticated
 USING(
  updated_by=(SELECT auth.uid())
  AND (SELECT public.haema_is_admin())
  AND EXISTS (SELECT 1 FROM public.haema_campaigns c
    WHERE c.id=haema_gm_live_state.campaign_id AND c.gm_id=(SELECT auth.uid()))
 )
 WITH CHECK(
  updated_by=(SELECT auth.uid())
  AND (SELECT public.haema_is_admin())
  AND EXISTS (SELECT 1 FROM public.haema_campaigns c
    WHERE c.id=haema_gm_live_state.campaign_id AND c.gm_id=(SELECT auth.uid()))
 );
REVOKE ALL ON TABLE public.haema_gm_live_state FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.haema_gm_live_state TO authenticated;
COMMENT ON TABLE public.haema_gm_live_state IS 'Estado de mesa privado do Mestre; não substitui nem modifica haema_characters.payload.';
