-- HÆMA — Árvore experimental de habilidades (2026-11-24)
-- NÃO EXECUTAR automaticamente em produção. Revisar e instalar antes de ativar compras.
-- Não altera fichas, personagens, contas, materiais ou conteúdos existentes.
-- O cliente só consulta: todas as aquisições são validadas por RPC e registradas.
-- Site e Sistema criado por Vitor Monte.
BEGIN;
CREATE TABLE IF NOT EXISTS public.haema_tree_progress (
 character_id uuid PRIMARY KEY REFERENCES public.haema_characters(id) ON DELETE CASCADE,
 pe_available integer NOT NULL DEFAULT 0 CHECK (pe_available BETWEEN 0 AND 5000),
 pe_spent integer NOT NULL DEFAULT 0 CHECK (pe_spent BETWEEN 0 AND 5000),
 path text[] NOT NULL DEFAULT ARRAY[]::text[] CHECK (cardinality(path)<=24),
 awakened boolean NOT NULL DEFAULT false,
 tree_version text NOT NULL DEFAULT 'arvore-exp-20261124' CHECK (tree_version='arvore-exp-20261124'),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.haema_tree_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 character_id uuid NOT NULL REFERENCES public.haema_characters(id) ON DELETE CASCADE,
 actor_id uuid NOT NULL REFERENCES auth.users(id),
 kind text NOT NULL CHECK (kind IN ('unlock','pe_grant','awakened')),
 node_id text,
 amount integer,
 event_data jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS haema_tree_events_character_idx ON public.haema_tree_events(character_id,created_at DESC);
ALTER TABLE public.haema_tree_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.haema_tree_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.haema_tree_progress,public.haema_tree_events FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SEQUENCE public.haema_tree_events_id_seq FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.haema_tree_progress,public.haema_tree_events TO authenticated;
DROP POLICY IF EXISTS haema_tree_progress_read ON public.haema_tree_progress;
CREATE POLICY haema_tree_progress_read ON public.haema_tree_progress FOR SELECT TO authenticated USING(
 EXISTS(SELECT 1 FROM public.haema_characters c WHERE c.id=character_id
  AND(c.user_id=(SELECT auth.uid())
   OR EXISTS(SELECT 1 FROM public.haema_campaigns cc WHERE cc.id=c.campaign_id AND cc.gm_id=(SELECT auth.uid()))))
);
DROP POLICY IF EXISTS haema_tree_events_read ON public.haema_tree_events;
CREATE POLICY haema_tree_events_read ON public.haema_tree_events FOR SELECT TO authenticated USING(
 EXISTS(SELECT 1 FROM public.haema_characters c WHERE c.id=character_id
  AND(c.user_id=(SELECT auth.uid())
   OR EXISTS(SELECT 1 FROM public.haema_campaigns cc WHERE cc.id=c.campaign_id AND cc.gm_id=(SELECT auth.uid()))))
);

-- Banco conhece a topologia determinística: sete setores, quatro gerações,
-- seis passos por geração e bifurcação binária entre gerações (630 nós).
-- O caminho escolhido precisa ser contínuo; não existe salto ou compra paralela.
CREATE OR REPLACE FUNCTION public.haema_tree_unlock(p_character uuid,p_node text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c RECORD; progress RECORD; parts text[]; sector_no integer; bits text; step_no integer;
  expected_parent text; current_tip text; price integer; stage_no integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Entre na sua conta antes de continuar'; END IF;
 parts:=pg_catalog.regexp_match(p_node,'^s([0-6]):(x|[01]{1,3}):([1-6])$');
 IF parts IS NULL THEN RAISE EXCEPTION 'Nó inválido para esta versão da árvore'; END IF;
 sector_no:=parts[1]::integer; bits:=parts[2]; step_no:=parts[3]::integer;
 stage_no:=CASE WHEN bits='x' THEN 0 ELSE pg_catalog.length(bits) END;
 price:=CASE stage_no WHEN 0 THEN 4 WHEN 1 THEN 6 WHEN 2 THEN 8 WHEN 3 THEN 12 ELSE 999 END;
 IF step_no>1 THEN expected_parent:='s'||sector_no||':'||bits||':'||(step_no-1);
 ELSIF bits='x' THEN expected_parent:='origem';
 ELSIF pg_catalog.length(bits)=1 THEN expected_parent:='s'||sector_no||':x:6';
 ELSE expected_parent:='s'||sector_no||':'||pg_catalog.substring(bits FROM 1 FOR pg_catalog.length(bits)-1)||':6'; END IF;
 SELECT id,campaign_id,user_id INTO c FROM public.haema_characters WHERE id=p_character;
 IF NOT FOUND OR c.user_id<>auth.uid() THEN RAISE EXCEPTION 'Personagem indisponível ou não pertence à sua conta'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.haema_members m WHERE m.campaign_id=c.campaign_id AND m.user_id=auth.uid())
 THEN RAISE EXCEPTION 'Você não participa mais desta campanha'; END IF;
 INSERT INTO public.haema_tree_progress(character_id) VALUES(p_character) ON CONFLICT DO NOTHING;
 SELECT * INTO progress FROM public.haema_tree_progress WHERE character_id=p_character FOR UPDATE;
 IF progress.tree_version<>'arvore-exp-20261124' THEN RAISE EXCEPTION 'Versão da árvore incompatível'; END IF;
 IF sector_no=6 AND NOT progress.awakened THEN RAISE EXCEPTION 'O mestre precisa registrar o Despertar antes de seguir este ramo'; END IF;
 current_tip:=CASE WHEN cardinality(progress.path)=0 THEN 'origem' ELSE progress.path[cardinality(progress.path)] END;
 IF current_tip<>expected_parent THEN RAISE EXCEPTION 'É necessário seguir uma única trilha contínua, sem saltos ou bifurcações paralelas'; END IF;
 IF progress.pe_available<price THEN RAISE EXCEPTION 'Pontos de Evolução insuficientes'; END IF;
 IF cardinality(progress.path)>=24 THEN RAISE EXCEPTION 'Trilha completa'; END IF;
 UPDATE public.haema_tree_progress SET
  path=array_append(progress.path,p_node),pe_available=progress.pe_available-price,
  pe_spent=progress.pe_spent+price,updated_at=now() WHERE character_id=p_character;
 INSERT INTO public.haema_tree_events(character_id,actor_id,kind,node_id,amount,event_data)
 VALUES(p_character,auth.uid(),'unlock',p_node,-price,
  pg_catalog.jsonb_build_object('previous_tip',current_tip,'tree_version','arvore-exp-20261124'));
 RETURN pg_catalog.jsonb_build_object('node',p_node,'remaining_pe',progress.pe_available-price,'path_length',cardinality(progress.path)+1);
END;$$;

-- Apenas o mestre REAL daquela campanha pode conceder PE (não metadados do usuário).
CREATE OR REPLACE FUNCTION public.haema_tree_grant_pe(p_character uuid,p_amount integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c RECORD; result_balance integer;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'É necessário autenticar-se'; END IF;
 IF p_amount IS NULL OR p_amount<1 OR p_amount>50 THEN RAISE EXCEPTION 'Concessão deve ser de 1 a 50 PE'; END IF;
 SELECT c.id,c.campaign_id INTO c FROM public.haema_characters c
 JOIN public.haema_campaigns g ON g.id=c.campaign_id
 WHERE c.id=p_character AND g.gm_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Somente o mestre desta campanha concede PE'; END IF;
 INSERT INTO public.haema_tree_progress(character_id) VALUES(p_character) ON CONFLICT DO NOTHING;
 UPDATE public.haema_tree_progress SET pe_available=pe_available+p_amount,updated_at=now()
 WHERE character_id=p_character AND pe_available+p_amount<=5000 RETURNING pe_available INTO result_balance;
 IF NOT FOUND THEN RAISE EXCEPTION 'Saldo acima do limite experimental'; END IF;
 INSERT INTO public.haema_tree_events(character_id,actor_id,kind,amount)
 VALUES(p_character,auth.uid(),'pe_grant',p_amount);
 RETURN pg_catalog.jsonb_build_object('available',result_balance);
END;$$;

-- A ficha legada não é alterada: Despertar experimental da Árvore é registro próprio.
CREATE OR REPLACE FUNCTION public.haema_tree_set_awakened(p_character uuid,p_enabled boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c RECORD;
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'É necessário autenticar-se'; END IF;
 IF p_enabled IS NULL THEN RAISE EXCEPTION 'Estado de Despertar inválido'; END IF;
 SELECT c.id INTO c FROM public.haema_characters c JOIN public.haema_campaigns g ON g.id=c.campaign_id
 WHERE c.id=p_character AND g.gm_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Somente o mestre desta campanha registra o Despertar'; END IF;
 INSERT INTO public.haema_tree_progress(character_id) VALUES(p_character) ON CONFLICT DO NOTHING;
 UPDATE public.haema_tree_progress SET awakened=p_enabled,updated_at=now() WHERE character_id=p_character;
 INSERT INTO public.haema_tree_events(character_id,actor_id,kind,event_data)
 VALUES(p_character,auth.uid(),'awakened',pg_catalog.jsonb_build_object('enabled',p_enabled));
 RETURN pg_catalog.jsonb_build_object('awakened',p_enabled);
END;$$;
REVOKE ALL ON FUNCTION public.haema_tree_unlock(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.haema_tree_grant_pe(uuid,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.haema_tree_set_awakened(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.haema_tree_unlock(uuid,text), public.haema_tree_grant_pe(uuid,integer), public.haema_tree_set_awakened(uuid,boolean) TO authenticated;
COMMIT;