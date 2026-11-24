-- HÆMA: correções administrativas da Constelação (2026-11-24)
-- Sem excluir personagens, fichas, conquistas ou auditoria existente.
-- Site e Sistema criado por Vitor Monte.

ALTER TABLE public.haema_tree_events DROP CONSTRAINT IF EXISTS haema_tree_events_kind_check;
ALTER TABLE public.haema_tree_events
 ADD CONSTRAINT haema_tree_events_kind_check
 CHECK(kind IN ('unlock','pe_grant','awakened','pe_adjust','tree_reset','profile_archive','plan'));

CREATE TABLE IF NOT EXISTS public.haema_tree_plans(
 character_id uuid PRIMARY KEY REFERENCES public.haema_characters(id) ON DELETE CASCADE,
 planned_path text[] NOT NULL DEFAULT ARRAY[]::text[] CHECK(cardinality(planned_path)<=24),
 updated_by uuid NOT NULL REFERENCES auth.users(id),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.haema_tree_profile_settings(
 character_id uuid PRIMARY KEY REFERENCES public.haema_characters(id) ON DELETE CASCADE,
 archived boolean NOT NULL DEFAULT false,
 updated_by uuid NOT NULL REFERENCES auth.users(id),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.haema_tree_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.haema_tree_profile_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.haema_tree_plans,public.haema_tree_profile_settings FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.haema_tree_plans,public.haema_tree_profile_settings TO authenticated;

DROP POLICY IF EXISTS haema_tree_plans_admin_read ON public.haema_tree_plans;
CREATE POLICY haema_tree_plans_admin_read ON public.haema_tree_plans FOR SELECT TO authenticated USING(
 (SELECT public.haema_is_admin()) AND EXISTS(
 SELECT 1 FROM public.haema_characters c JOIN public.haema_campaigns g ON g.id=c.campaign_id
 WHERE c.id=character_id AND g.gm_id=(SELECT auth.uid())));
DROP POLICY IF EXISTS haema_tree_profiles_admin_read ON public.haema_tree_profile_settings;
CREATE POLICY haema_tree_profiles_admin_read ON public.haema_tree_profile_settings FOR SELECT TO authenticated USING(
 (SELECT public.haema_is_admin()) AND EXISTS(
 SELECT 1 FROM public.haema_characters c JOIN public.haema_campaigns g ON g.id=c.campaign_id
 WHERE c.id=character_id AND g.gm_id=(SELECT auth.uid())));

-- Alterar apenas PE disponíveis, jamais estornar automaticamente gastos ou apagar habilidades.
CREATE OR REPLACE FUNCTION public.haema_tree_adjust_pe(p_character uuid,p_delta integer,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE balance integer; previous integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.haema_is_admin() THEN RAISE EXCEPTION 'Somente o mestre pode corrigir PE'; END IF;
 IF p_delta IS NULL OR p_delta=0 OR p_delta < -50 OR p_delta > 50 THEN RAISE EXCEPTION 'A correção exige entre -50 e +50 PE'; END IF;
 IF pg_catalog.length(pg_catalog.btrim(pg_catalog.coalesce(p_reason,'')))<5 THEN RAISE EXCEPTION 'Informe o motivo da correção'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.haema_characters c JOIN public.haema_campaigns g ON g.id=c.campaign_id WHERE c.id=p_character AND g.gm_id=auth.uid())
 THEN RAISE EXCEPTION 'Perfil fora da campanha do mestre'; END IF;
 INSERT INTO public.haema_tree_progress(character_id) VALUES(p_character) ON CONFLICT DO NOTHING;
 SELECT pe_available INTO previous FROM public.haema_tree_progress WHERE character_id=p_character FOR UPDATE;
 IF previous+p_delta NOT BETWEEN 0 AND 5000 THEN RAISE EXCEPTION 'Saldo insuficiente ou limite de PE excedido'; END IF;
 UPDATE public.haema_tree_progress SET pe_available=previous+p_delta,updated_at=now() WHERE character_id=p_character RETURNING pe_available INTO balance;
 INSERT INTO public.haema_tree_events(character_id,actor_id,kind,amount,event_data)
 VALUES(p_character,auth.uid(),'pe_adjust',p_delta,
 pg_catalog.jsonb_build_object('reason',pg_catalog.left(pg_catalog.btrim(p_reason),250),'previous',previous,'new',balance));
 RETURN pg_catalog.jsonb_build_object('previous',previous,'available',balance,'delta',p_delta);
END;$$;

-- Salvar rota planejada INDEPENDENTE das compras irrevogáveis.
CREATE OR REPLACE FUNCTION public.haema_tree_save_plan(p_character uuid,p_path text[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE cur text:='origem'; node text; parts text[]; sector_no integer; bits text; step_no integer; parent text; i integer:=0; acquired text[]; total integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.haema_is_admin() THEN RAISE EXCEPTION 'Somente o mestre planeja rotas'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.haema_characters c JOIN public.haema_campaigns g ON g.id=c.campaign_id WHERE c.id=p_character AND g.gm_id=auth.uid())
 THEN RAISE EXCEPTION 'Perfil indisponível'; END IF;
 IF p_path IS NULL THEN p_path:=ARRAY[]::text[]; END IF;
 total:=pg_catalog.cardinality(p_path);
 IF total>24 THEN RAISE EXCEPTION 'A rota pode conter no máximo 24 conquistas'; END IF;
 SELECT path INTO acquired FROM public.haema_tree_progress WHERE character_id=p_character;
 IF acquired IS NULL THEN acquired:=ARRAY[]::text[]; END IF;
 IF total<pg_catalog.cardinality(acquired) THEN RAISE EXCEPTION 'Não é possível apagar conquistas do planejamento'; END IF;
 FOREACH node IN ARRAY p_path LOOP
  i:=i+1;
  parts:=pg_catalog.regexp_match(node,'^s([0-6]):(x|[01]{1,3}):([1-6])$');
  IF parts IS NULL THEN RAISE EXCEPTION 'Nó desconhecido no planejamento'; END IF;
  sector_no:=parts[1]::integer;bits:=parts[2];step_no:=parts[3]::integer;
  IF step_no>1 THEN parent:='s'||sector_no||':'||bits||':'||(step_no-1);
  ELSIF bits='x' THEN parent:='origem';
  ELSIF pg_catalog.length(bits)=1 THEN parent:='s'||sector_no||':x:6';
  ELSE parent:='s'||sector_no||':'||pg_catalog.substr(bits,1,pg_catalog.length(bits)-1)||':6'; END IF;
  IF parent<>cur THEN RAISE EXCEPTION 'A rota deve seguir conexões contínuas'; END IF;
  IF i<=pg_catalog.cardinality(acquired) AND acquired[i] IS DISTINCT FROM node THEN
   RAISE EXCEPTION 'A rota deve respeitar as conquistas definitivas'; END IF;
  cur:=node;
 END LOOP;
 INSERT INTO public.haema_tree_plans(character_id,planned_path,updated_by,updated_at)
 VALUES(p_character,p_path,auth.uid(),now())
 ON CONFLICT(character_id) DO UPDATE SET planned_path=EXCLUDED.planned_path,updated_by=EXCLUDED.updated_by,updated_at=now();
 INSERT INTO public.haema_tree_events(character_id,actor_id,kind,event_data)
 VALUES(p_character,auth.uid(),'plan',pg_catalog.jsonb_build_object('path_length',total,'last',cur));
 RETURN pg_catalog.jsonb_build_object('planned',total,'last',cur);
END;$$;

-- "Apagar da lista" = arquivamento reversível e auditado; não apaga ficha nem árvore.
CREATE OR REPLACE FUNCTION public.haema_tree_archive_profile(p_character uuid,p_archived boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 IF auth.uid() IS NULL OR NOT public.haema_is_admin() THEN RAISE EXCEPTION 'Somente o mestre gerencia perfis'; END IF;
 IF p_archived IS NULL THEN RAISE EXCEPTION 'Estado de arquivo inválido'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.haema_characters c JOIN public.haema_campaigns g ON g.id=c.campaign_id WHERE c.id=p_character AND g.gm_id=auth.uid())
 THEN RAISE EXCEPTION 'Perfil indisponível'; END IF;
 INSERT INTO public.haema_tree_profile_settings(character_id,archived,updated_by,updated_at)
 VALUES(p_character,p_archived,auth.uid(),now())
 ON CONFLICT(character_id) DO UPDATE SET archived=EXCLUDED.archived,updated_by=EXCLUDED.updated_by,updated_at=now();
 INSERT INTO public.haema_tree_events(character_id,actor_id,kind,event_data)
 VALUES(p_character,auth.uid(),'profile_archive',pg_catalog.jsonb_build_object('archived',p_archived));
 RETURN pg_catalog.jsonb_build_object('archived',p_archived);
END;$$;

-- Reiniciar não perde histórico: o evento registra o estado antigo antes de zerar.
CREATE OR REPLACE FUNCTION public.haema_tree_reset_profile(p_character uuid,p_reason text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE old record;
BEGIN
 IF auth.uid() IS NULL OR NOT public.haema_is_admin() THEN RAISE EXCEPTION 'Somente o mestre reinicia árvores'; END IF;
 IF pg_catalog.length(pg_catalog.btrim(pg_catalog.coalesce(p_reason,'')))<5 THEN RAISE EXCEPTION 'Informe um motivo para o reinício'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.haema_characters c JOIN public.haema_campaigns g ON g.id=c.campaign_id WHERE c.id=p_character AND g.gm_id=auth.uid())
 THEN RAISE EXCEPTION 'Perfil indisponível'; END IF;
 INSERT INTO public.haema_tree_progress(character_id) VALUES(p_character) ON CONFLICT DO NOTHING;
 SELECT pe_available,pe_spent,path,awakened INTO old FROM public.haema_tree_progress WHERE character_id=p_character FOR UPDATE;
 INSERT INTO public.haema_tree_events(character_id,actor_id,kind,event_data)
 VALUES(p_character,auth.uid(),'tree_reset',pg_catalog.jsonb_build_object('reason',pg_catalog.left(pg_catalog.btrim(p_reason),250),'previous_pe',old.pe_available,'previous_spent',old.pe_spent,'previous_path',old.path,'previous_awakened',old.awakened));
 UPDATE public.haema_tree_progress SET pe_available=0,pe_spent=0,path=ARRAY[]::text[],awakened=false,updated_at=now() WHERE character_id=p_character;
 DELETE FROM public.haema_tree_plans WHERE character_id=p_character;
 RETURN pg_catalog.jsonb_build_object('reset',true);
END;$$;

REVOKE ALL ON FUNCTION public.haema_tree_adjust_pe(uuid,integer,text),public.haema_tree_save_plan(uuid,text[]),public.haema_tree_archive_profile(uuid,boolean),public.haema_tree_reset_profile(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.haema_tree_adjust_pe(uuid,integer,text),public.haema_tree_save_plan(uuid,text[]),public.haema_tree_archive_profile(uuid,boolean),public.haema_tree_reset_profile(uuid,text) TO authenticated;
