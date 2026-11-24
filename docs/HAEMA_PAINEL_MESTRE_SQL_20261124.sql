-- HÆMA: Painel do Mestre / árvore administrada pela única conta de plataforma.
-- Migração aditiva e não destrutiva. Dados e fichas legadas ficam intactos.
-- Site e Sistema criado por Vitor Monte.

-- As escolhas/PE da árvore só podem ser consultados pelo administrador que controla a campanha.
DROP POLICY IF EXISTS haema_tree_progress_read ON public.haema_tree_progress;
CREATE POLICY haema_tree_progress_read ON public.haema_tree_progress
FOR SELECT TO authenticated USING(
 (SELECT public.haema_is_admin())
 AND EXISTS (
   SELECT 1 FROM public.haema_characters c JOIN public.haema_campaigns g ON g.id=c.campaign_id
   WHERE c.id=character_id AND g.gm_id=(SELECT auth.uid())
 )
);
DROP POLICY IF EXISTS haema_tree_events_read ON public.haema_tree_events;
CREATE POLICY haema_tree_events_read ON public.haema_tree_events
FOR SELECT TO authenticated USING(
 (SELECT public.haema_is_admin())
 AND EXISTS (
   SELECT 1 FROM public.haema_characters c JOIN public.haema_campaigns g ON g.id=c.campaign_id
   WHERE c.id=character_id AND g.gm_id=(SELECT auth.uid())
 )
);

-- Cadastro de perfis diretamente no painel, sem substituir a ficha 0.1 que existe no banco.
-- Sempre vincula a um membro da campanha; o mestre pode ser proprietário provisório.
CREATE OR REPLACE FUNCTION public.haema_master_create_character(p_campaign uuid,p_user uuid,p_title text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE result_id uuid; sheet jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT public.haema_is_admin() THEN
  RAISE EXCEPTION 'Área exclusiva da conta administradora';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.haema_campaigns WHERE id=p_campaign AND gm_id=auth.uid())
 THEN RAISE EXCEPTION 'Campanha não autorizada'; END IF;
 IF p_user IS NULL OR NOT EXISTS(
  SELECT 1 FROM public.haema_members WHERE campaign_id=p_campaign AND user_id=p_user
 ) THEN RAISE EXCEPTION 'O responsável precisa participar da campanha'; END IF;
 p_title:=pg_catalog.btrim(p_title);
 IF pg_catalog.length(p_title) NOT BETWEEN 1 AND 80 THEN RAISE EXCEPTION 'Nome de personagem inválido'; END IF;
 sheet:=pg_catalog.jsonb_build_object(
  'format','haema-character','version','0.1','name',p_title,'job','',
  'attributes',pg_catalog.to_jsonb(pg_catalog.array_fill(4,ARRAY[6])),
  'skills',pg_catalog.to_jsonb(pg_catalog.array_fill(4,ARRAY[24])),
  'wounds',0,'impetus',0,'overload',0,'metus',0
 );
 -- Não inferir atributos derivados de versões antigas.
 INSERT INTO public.haema_characters(campaign_id,user_id,title,rules_version,payload)
 VALUES(p_campaign,p_user,p_title,'0.1',sheet)
 RETURNING id INTO result_id;
 RETURN result_id;
END;$$;

CREATE OR REPLACE FUNCTION public.haema_master_assign_character(p_character uuid,p_user uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c record;
BEGIN
 IF auth.uid() IS NULL OR NOT public.haema_is_admin() THEN RAISE EXCEPTION 'Área exclusiva do administrador'; END IF;
 SELECT id,campaign_id INTO c FROM public.haema_characters WHERE id=p_character;
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.haema_campaigns WHERE id=c.campaign_id AND gm_id=auth.uid())
 THEN RAISE EXCEPTION 'Personagem fora da sua campanha'; END IF;
 IF p_user IS NULL OR NOT EXISTS(SELECT 1 FROM public.haema_members WHERE campaign_id=c.campaign_id AND user_id=p_user)
 THEN RAISE EXCEPTION 'O novo responsável não participa da campanha'; END IF;
 UPDATE public.haema_characters SET user_id=p_user,updated_at=now() WHERE id=p_character;
 RETURN p_character;
END;$$;

-- Compra de habilidades feita exclusivamente pelo mestre da plataforma no contexto de sua campanha.
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

CREATE OR REPLACE FUNCTION public.haema_tree_grant_pe(p_character uuid,p_amount integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c record; remaining integer;
BEGIN
 IF auth.uid() IS NULL OR NOT public.haema_is_admin() THEN RAISE EXCEPTION 'Somente o administrador concede PE'; END IF;
 IF p_amount IS NULL OR p_amount<1 OR p_amount>50 THEN RAISE EXCEPTION 'Concessão deve ser de 1 a 50 PE'; END IF;
 SELECT ch.id,ch.campaign_id INTO c FROM public.haema_characters ch
 JOIN public.haema_campaigns g ON g.id=ch.campaign_id
 WHERE ch.id=p_character AND g.gm_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Personagem não autorizado'; END IF;
 INSERT INTO public.haema_tree_progress(character_id) VALUES(p_character) ON CONFLICT DO NOTHING;
 UPDATE public.haema_tree_progress SET pe_available=pe_available+p_amount,updated_at=now()
 WHERE character_id=p_character AND pe_available+p_amount<=5000 RETURNING pe_available INTO remaining;
 IF NOT FOUND THEN RAISE EXCEPTION 'Saldo máximo excedido'; END IF;
 INSERT INTO public.haema_tree_events(character_id,actor_id,kind,amount)
 VALUES(p_character,auth.uid(),'pe_grant',p_amount);
 RETURN pg_catalog.jsonb_build_object('available',remaining);
END;$$;

CREATE OR REPLACE FUNCTION public.haema_tree_set_awakened(p_character uuid,p_enabled boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE c record;
BEGIN
 IF auth.uid() IS NULL OR NOT public.haema_is_admin() THEN RAISE EXCEPTION 'Somente o administrador controla o Despertar'; END IF;
 IF p_enabled IS NULL THEN RAISE EXCEPTION 'Estado inválido'; END IF;
 SELECT ch.id INTO c FROM public.haema_characters ch
 JOIN public.haema_campaigns g ON g.id=ch.campaign_id
 WHERE ch.id=p_character AND g.gm_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Personagem não autorizado'; END IF;
 INSERT INTO public.haema_tree_progress(character_id) VALUES(p_character) ON CONFLICT DO NOTHING;
 UPDATE public.haema_tree_progress SET awakened=p_enabled,updated_at=now() WHERE character_id=p_character;
 INSERT INTO public.haema_tree_events(character_id,actor_id,kind,event_data)
 VALUES(p_character,auth.uid(),'awakened',pg_catalog.jsonb_build_object('enabled',p_enabled));
 RETURN pg_catalog.jsonb_build_object('awakened',p_enabled);
END;$$;

REVOKE ALL ON FUNCTION public.haema_master_create_character(uuid,uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.haema_master_assign_character(uuid,uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.haema_tree_unlock(uuid,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.haema_tree_grant_pe(uuid,integer) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.haema_tree_set_awakened(uuid,boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.haema_master_create_character(uuid,uuid,text),
 public.haema_master_assign_character(uuid,uuid), public.haema_tree_unlock(uuid,text),
 public.haema_tree_grant_pe(uuid,integer),public.haema_tree_set_awakened(uuid,boolean) TO authenticated;