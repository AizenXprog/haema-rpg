-- Bestiário integral lido somente por mestre da campanha CID.
-- RPC explícita, sem expor a tabela privada nem mudar a liberação aos jogadores.
CREATE FUNCTION haema_private.gm_bestiary_index(cid uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT public.haema_is_gm(cid)
    OR NOT public.haema_has_area('portal') THEN
  RAISE EXCEPTION 'Somente mestre autorizado' USING ERRCODE='42501';
 END IF;
 RETURN COALESCE((
  SELECT jsonb_agg(jsonb_build_object(
   'id',id,'title',title,'subtitle',subtitle,'state',editorial_state,
   'ordinal',ordinal,'revision',revision,'released',cardinality(released_indexes)>0)
   ORDER BY ordinal)
  FROM haema_private.bestiary
 ),'[]'::jsonb);
END $$;
CREATE FUNCTION haema_private.gm_bestiary_entry(cid uuid, entry_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE item haema_private.bestiary;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT public.haema_is_gm(cid)
    OR NOT public.haema_has_area('portal') THEN
  RAISE EXCEPTION 'Somente mestre autorizado' USING ERRCODE='42501';
 END IF;
 IF entry_id !~ '^registro-[0-9]{2}$' THEN
  RAISE EXCEPTION 'Registro inválido' USING ERRCODE='22023';
 END IF;
 SELECT * INTO item FROM haema_private.bestiary WHERE id=entry_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Registro não encontrado' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object('id',item.id,'title',item.title,'subtitle',item.subtitle,
  'paragraphs',item.paragraphs,'state',item.editorial_state,
  'revision',item.revision,'source_version',item.source_version);
END $$;
CREATE FUNCTION public.haema_gm_bestiary_index(cid uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT haema_private.gm_bestiary_index(cid);
$$;
CREATE FUNCTION public.haema_gm_bestiary_entry(cid uuid,entry_id text) RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT haema_private.gm_bestiary_entry(cid,entry_id);
$$;
REVOKE ALL ON FUNCTION
 haema_private.gm_bestiary_index(uuid),
 haema_private.gm_bestiary_entry(uuid,text),
 public.haema_gm_bestiary_index(uuid),
 public.haema_gm_bestiary_entry(uuid,text)
FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION
 haema_private.gm_bestiary_index(uuid),
 haema_private.gm_bestiary_entry(uuid,text),
 public.haema_gm_bestiary_index(uuid),
 public.haema_gm_bestiary_entry(uuid,text)
TO authenticated;