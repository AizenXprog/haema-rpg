-- HÆMA · Expansão editorial · 23/11/2026
-- Acervo do mestre: distinguir ameaça, descoberta, existência e aprovação.
-- Sem alterar os 25 textos existentes. Executar antes do seed de 109 entradas.
ALTER TABLE haema_private.bestiary ADD COLUMN IF NOT EXISTS source_code text;
ALTER TABLE haema_private.bestiary ADD COLUMN IF NOT EXISTS threat_class text;
ALTER TABLE haema_private.bestiary ADD COLUMN IF NOT EXISTS existence_status text;
ALTER TABLE haema_private.bestiary ADD COLUMN IF NOT EXISTS discovery_status text;
ALTER TABLE haema_private.bestiary ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE haema_private.bestiary DROP CONSTRAINT IF EXISTS bestiary_editorial_state_check;
ALTER TABLE haema_private.bestiary ADD CONSTRAINT bestiary_editorial_state_check
 CHECK(editorial_state=ANY(ARRAY['canon','concept','historical','proposal','legend']));
ALTER TABLE haema_private.bestiary ADD CONSTRAINT bestiary_threat_class_check
 CHECK(threat_class IS NULL OR threat_class IN('hostile','non_hostile','undetermined'));
ALTER TABLE haema_private.bestiary ADD CONSTRAINT bestiary_existence_check
 CHECK(existence_status IS NULL OR existence_status IN('established','historical_survival_unknown','unconfirmed_legend'));
ALTER TABLE haema_private.bestiary ADD CONSTRAINT bestiary_discovery_check
 CHECK(discovery_status IS NULL OR discovery_status IN('unspecified','discovered','unknown_to_players'));
ALTER TABLE haema_private.bestiary ADD CONSTRAINT bestiary_source_code_check
 CHECK(source_code IS NULL OR source_code ~ '^(ORIG-[0-9]{2}|H0[12]-[0-9]{2}|BIO-[0-9]{3}|U[0-9]{2})$');
CREATE UNIQUE INDEX IF NOT EXISTS bestiary_source_code_unique ON haema_private.bestiary(source_code) WHERE source_code IS NOT NULL;
UPDATE haema_private.bestiary SET
 source_code=CASE title
 WHEN 'Brutão' THEN 'ORIG-01'
 WHEN 'Drax' THEN 'ORIG-02'
 WHEN 'Alcatrante' THEN 'ORIG-03'
 WHEN 'Orvek' THEN 'ORIG-04'
 WHEN 'Velkin' THEN 'ORIG-05'
 WHEN 'Drissen' THEN 'ORIG-06'
 END,
 threat_class=CASE title WHEN 'Drax' THEN 'undetermined' WHEN 'Drissen' THEN 'undetermined' ELSE 'non_hostile' END,
 existence_status=CASE title WHEN 'Drax' THEN 'historical_survival_unknown' ELSE 'established' END,
 discovery_status='unspecified',
 region=CASE title WHEN 'Drax' THEN 'Infêrnus' WHEN 'Drissen' THEN 'Grendkti' WHEN 'Orvek' THEN 'Grendkti' WHEN 'Velkin' THEN 'Grendkti' ELSE 'Distribuição não estabelecida' END
WHERE title IN('Brutão','Drax','Alcatrante','Orvek','Velkin','Drissen') AND source_code IS NULL;

CREATE OR REPLACE FUNCTION haema_private.book_index() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE admin boolean;
BEGIN
 IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'Entre com Google' USING ERRCODE='42501'; END IF;
 admin:=public.haema_is_admin();
 IF NOT admin AND NOT (haema_private.has_area('library') AND haema_private.has_area('bestiary')) THEN
  RAISE EXCEPTION 'Acesso ao Bestiário pendente' USING ERRCODE='42501';
 END IF;
 RETURN COALESCE((
  SELECT jsonb_agg(jsonb_build_object(
   'id',id,'title',title,'subtitle',subtitle,'state',editorial_state,'ordinal',ordinal,
   'revision',revision,'released',cardinality(released_indexes)>0,
   'threat',threat_class,'existence',existence_status,
   'discovery',discovery_status,'region',region,'source_code',source_code)
   ORDER BY ordinal)
  FROM haema_private.bestiary WHERE admin OR cardinality(released_indexes)>0
 ),'[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION haema_private.book_entry(entry_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE item haema_private.bestiary; admin boolean; body jsonb;
BEGIN
 IF (SELECT auth.uid()) IS NULL THEN RAISE EXCEPTION 'Entre com Google' USING ERRCODE='42501'; END IF;
 admin:=public.haema_is_admin();
 IF NOT admin AND NOT (haema_private.has_area('library') AND haema_private.has_area('bestiary')) THEN
  RAISE EXCEPTION 'Acesso revogado ou pendente' USING ERRCODE='42501';
 END IF;
 SELECT * INTO item FROM haema_private.bestiary WHERE id=entry_id;
 IF NOT FOUND OR (NOT admin AND cardinality(item.released_indexes)=0) THEN
  RAISE EXCEPTION 'Registro indisponível' USING ERRCODE='42501';
 END IF;
 SELECT COALESCE(jsonb_agg(p.value ORDER BY p.ordinality),'[]'::jsonb) INTO body
 FROM jsonb_array_elements(item.paragraphs) WITH ORDINALITY p
 WHERE admin OR (p.ordinality-1)=ANY(item.released_indexes);
 RETURN jsonb_build_object(
  'id',item.id,'title',item.title,'subtitle',item.subtitle,'state',item.editorial_state,
  'paragraphs',body,'revision',item.revision,'source_version',item.source_version,
  'released_indexes',CASE WHEN admin THEN to_jsonb(item.released_indexes) ELSE null END,
  'master',admin,'threat',item.threat_class,'existence',item.existence_status,
  'discovery',item.discovery_status,'region',item.region,'source_code',item.source_code);
END $$;

CREATE OR REPLACE FUNCTION haema_private.gm_bestiary_index(cid uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT public.haema_is_gm(cid)
    OR NOT public.haema_has_area('portal') THEN
  RAISE EXCEPTION 'Somente mestre autorizado' USING ERRCODE='42501';
 END IF;
 RETURN COALESCE((
  SELECT jsonb_agg(jsonb_build_object(
   'id',id,'title',title,'subtitle',subtitle,'state',editorial_state,
   'ordinal',ordinal,'revision',revision,'released',cardinality(released_indexes)>0,
   'threat',threat_class,'existence',existence_status,
   'discovery',discovery_status,'region',region,'source_code',source_code)
   ORDER BY ordinal)
  FROM haema_private.bestiary
 ),'[]'::jsonb);
END $$;

CREATE OR REPLACE FUNCTION haema_private.gm_bestiary_entry(cid uuid,entry_id text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE item haema_private.bestiary;
BEGIN
 IF (SELECT auth.uid()) IS NULL OR NOT public.haema_is_gm(cid)
    OR NOT public.haema_has_area('portal') THEN
  RAISE EXCEPTION 'Somente mestre autorizado' USING ERRCODE='42501';
 END IF;
 IF entry_id !~ '^(registro-[0-9]{2}|h0[12]-[0-9]{2}|bio-[0-9]{3}|u[0-9]{2})$' THEN
  RAISE EXCEPTION 'Registro inválido' USING ERRCODE='22023';
 END IF;
 SELECT * INTO item FROM haema_private.bestiary WHERE id=entry_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Registro não encontrado' USING ERRCODE='22023'; END IF;
 RETURN jsonb_build_object(
  'id',item.id,'title',item.title,'subtitle',item.subtitle,
  'paragraphs',item.paragraphs,'state',item.editorial_state,
  'revision',item.revision,'source_version',item.source_version,
  'threat',item.threat_class,'existence',item.existence_status,
  'discovery',item.discovery_status,'region',item.region,'source_code',item.source_code);
END $$;

-- The original public wrappers remain unchanged and invoke these protected functions.
-- Existing grants and guards are preserved. No function exposes the private table directly.
