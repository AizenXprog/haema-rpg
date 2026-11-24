-- HÆMA Constelação Viva — catálogo editorial de habilidades por nó.
-- Adição não destrutiva: não migra dados, preserva paths/PE/IDs e autoria.
-- Site e Sistema criado por Vitor Monte.
BEGIN;
CREATE TABLE IF NOT EXISTS public.haema_tree_node_edits (
 node_id text PRIMARY KEY CHECK(node_id ~ '^s[0-6]:(x|[01]{1,3}):[1-6]$'),
 title text NOT NULL CHECK(char_length(title)<=100 AND (status='draft' OR char_length(btrim(title))>=3)),
 trigger_text text NOT NULL CHECK(char_length(trigger_text)<=500 AND (status='draft' OR char_length(btrim(trigger_text))>=12)),
 effect text NOT NULL CHECK(char_length(effect)<=1800 AND (status='draft' OR char_length(btrim(effect))>=20)),
 limit_text text NOT NULL CHECK(char_length(limit_text)<=850 AND (status='draft' OR char_length(btrim(limit_text))>=12)),
 example text NOT NULL CHECK(char_length(example)<=1000 AND (status='draft' OR char_length(btrim(example))>=12)),
 status text NOT NULL DEFAULT 'draft' CHECK(status IN ('ready','draft')),
 updated_by uuid NOT NULL REFERENCES auth.users(id),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.haema_tree_node_edits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.haema_tree_node_edits FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.haema_tree_node_edits TO authenticated;
DROP POLICY IF EXISTS haema_tree_editor_read ON public.haema_tree_node_edits;
CREATE POLICY haema_tree_editor_read ON public.haema_tree_node_edits
FOR SELECT TO authenticated USING ((SELECT public.haema_is_admin()));
DROP POLICY IF EXISTS haema_tree_editor_insert ON public.haema_tree_node_edits;
CREATE POLICY haema_tree_editor_insert ON public.haema_tree_node_edits
FOR INSERT TO authenticated WITH CHECK ((SELECT public.haema_is_admin()) AND updated_by=(SELECT auth.uid()));
DROP POLICY IF EXISTS haema_tree_editor_update ON public.haema_tree_node_edits;
CREATE POLICY haema_tree_editor_update ON public.haema_tree_node_edits
FOR UPDATE TO authenticated USING ((SELECT public.haema_is_admin()))
WITH CHECK ((SELECT public.haema_is_admin()) AND updated_by=(SELECT auth.uid()));
-- Um nó adquirido jamais é apagado por edição; o mestre pode apenas desativar futuros desbloqueios.
CREATE OR REPLACE FUNCTION public.haema_tree_unlock(p_character uuid,p_node text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c RECORD; progress RECORD; parts text[]; sector_no integer; bits text; step_no integer;
 expected_parent text; current_tip text; price integer; stage_no integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.haema_is_admin() THEN
  RAISE EXCEPTION 'A aquisição de habilidades é controlada pelo mestre';
 END IF;
 parts:=pg_catalog.regexp_match(p_node,'^s([0-6]):(x|[01]{1,3}):([1-6])$');
 IF parts IS NULL THEN RAISE EXCEPTION 'Nó inválido para esta versão'; END IF;
 sector_no:=parts[1]::integer; bits:=parts[2]; step_no:=parts[3]::integer;
 stage_no:=CASE WHEN bits='x' THEN 0 ELSE pg_catalog.length(bits) END;
 price:=CASE stage_no WHEN 0 THEN 4 WHEN 1 THEN 6 WHEN 2 THEN 8 WHEN 3 THEN 12 ELSE 999 END;
 IF step_no>1 THEN expected_parent:='s'||sector_no||':'||bits||':'||(step_no-1);
 ELSIF bits='x' THEN expected_parent:='origem';
 ELSIF pg_catalog.length(bits)=1 THEN expected_parent:='s'||sector_no||':x:6';
 ELSE expected_parent:='s'||sector_no||':'||pg_catalog.substr(bits, 1, pg_catalog.length(bits)-1)||':6'; END IF;
 SELECT id,campaign_id,user_id INTO c FROM public.haema_characters WHERE id=p_character;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.haema_campaigns WHERE id=c.campaign_id AND gm_id=auth.uid())
 THEN RAISE EXCEPTION 'Personagem fora da campanha administrada'; END IF;
 INSERT INTO public.haema_tree_progress(character_id) VALUES(p_character) ON CONFLICT DO NOTHING;
 SELECT * INTO progress FROM public.haema_tree_progress WHERE character_id=p_character FOR UPDATE;
 IF progress.tree_version<>'arvore-exp-20261124' THEN RAISE EXCEPTION 'Versão da árvore incompatível'; END IF;
 IF sector_no=6 AND NOT progress.awakened THEN RAISE EXCEPTION 'O Despertar precisa ser autorizado pelo mestre'; END IF;
 -- Primeiras 126 conquistas são curadas e utilizáveis. Gerações avançadas
 -- exigem publicação editorial; um rascunho bloqueia qualquer estágio.
 IF EXISTS (SELECT 1 FROM public.haema_tree_node_edits e
            WHERE e.node_id=p_node AND e.status='draft') THEN
   RAISE EXCEPTION 'Habilidade ainda em construção';
 END IF;
 IF stage_no>=2 AND NOT EXISTS(
    SELECT 1 FROM public.haema_tree_node_edits e
    WHERE e.node_id=p_node AND e.status='ready'
 ) THEN
   RAISE EXCEPTION 'Esta rota ainda não foi finalizada pelo mestre';
 END IF;

 current_tip:=CASE WHEN pg_catalog.cardinality(progress.path)=0 THEN 'origem' ELSE progress.path[pg_catalog.cardinality(progress.path)] END;
 IF current_tip<>expected_parent THEN RAISE EXCEPTION 'A trilha deve ser única e contínua'; END IF;
 IF progress.pe_available<price THEN RAISE EXCEPTION 'Pontos insuficientes'; END IF;
 IF pg_catalog.cardinality(progress.path)>=24 THEN RAISE EXCEPTION 'Trilha concluída'; END IF;
 UPDATE public.haema_tree_progress SET
 path=pg_catalog.array_append(progress.path,p_node),pe_available=progress.pe_available-price,
 pe_spent=progress.pe_spent+price,updated_at=now() WHERE character_id=p_character;
 INSERT INTO public.haema_tree_events(character_id,actor_id,kind,node_id,amount,event_data)
 VALUES(p_character,auth.uid(),'unlock',p_node,-price,
 pg_catalog.jsonb_build_object('previous_tip',current_tip,'tree_version','arvore-exp-20261124'));
 RETURN pg_catalog.jsonb_build_object('node',p_node,'remaining_pe',progress.pe_available-price,
  'path_length',pg_catalog.cardinality(progress.path)+1);
END;$$;

REVOKE ALL ON FUNCTION public.haema_tree_unlock(uuid,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.haema_tree_unlock(uuid,text) TO authenticated;
COMMIT;