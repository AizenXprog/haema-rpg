-- HÆMA Bestiário 2026-11-23 · liberação editorial pós-deploy.
-- A conta com permissão de Bestiário poderá ler apenas as 95 novas espécies
-- canônicas. Os 14 relatos de existência não comprovada permanecem privados ao mestre.
-- Não altera nem duplica as 25 fichas anteriores.
BEGIN;
DO $guard$
BEGIN
 IF (SELECT count(*) FROM haema_private.bestiary)<>134 THEN
  RAISE EXCEPTION 'Número inesperado no Bestiário: esperado 134';
 END IF;
 IF (SELECT count(*) FROM haema_private.bestiary
     WHERE source_code LIKE 'H01-%' OR source_code LIKE 'H02-%' OR source_code LIKE 'BIO-%')<>95 THEN
  RAISE EXCEPTION 'A expansão zoológica não possui exatamente 95 espécies';
 END IF;
 IF EXISTS(SELECT 1 FROM haema_private.bestiary WHERE
  (source_code LIKE 'H01-%' OR source_code LIKE 'H02-%' OR source_code LIKE 'BIO-%')
  AND (editorial_state<>'canon' OR existence_status<>'established'
   OR jsonb_array_length(paragraphs)<>5 OR source_hash IS NULL)) THEN
  RAISE EXCEPTION 'Uma ficha da expansão tem informações incompletas';
 END IF;
 IF (SELECT count(*) FROM haema_private.bestiary WHERE editorial_state='legend')<>14
 OR EXISTS(SELECT 1 FROM haema_private.bestiary WHERE editorial_state='legend'
  AND (existence_status<>'unconfirmed_legend' OR cardinality(released_indexes)<>0)) THEN
  RAISE EXCEPTION 'Relatos lendários não podem ser liberados como espécies';
 END IF;
 IF (SELECT count(*) FROM haema_private.bestiary WHERE source_code IS NULL)<>19
 OR (SELECT count(*) FROM haema_private.bestiary WHERE source_code LIKE 'ORIG-%')<>6 THEN
  RAISE EXCEPTION 'Fichas preexistentes inesperadamente alteradas';
 END IF;
END $guard$;
-- Cópia privada do acervo completo antes da publicação.
INSERT INTO haema_private.bestiary_editorial_snapshots(reason,entries)
SELECT 'Revisão pré-publicação · 95 espécies novas, 14 relatos reservados · 2026-11-23',
 COALESCE(jsonb_agg(to_jsonb(b) ORDER BY b.ordinal),'[]'::jsonb)
 FROM haema_private.bestiary b;
UPDATE haema_private.bestiary
SET released_indexes=ARRAY[0,1,2,3,4]::int[],
 revision=revision+1,updated_at=now()
WHERE (source_code LIKE 'H01-%' OR source_code LIKE 'H02-%' OR source_code LIKE 'BIO-%')
 AND cardinality(released_indexes)=0;
DO $guard$
BEGIN
 IF (SELECT count(*) FROM haema_private.bestiary WHERE cardinality(released_indexes)>0)<>120 THEN
  RAISE EXCEPTION 'Publicação exige exatamente 120 fichas liberadas';
 END IF;
 IF (SELECT count(*) FROM haema_private.bestiary
     WHERE editorial_state='legend' AND cardinality(released_indexes)>0)<>0 THEN
  RAISE EXCEPTION 'Relato reservado exposto indevidamente';
 END IF;
 IF (SELECT count(*) FROM haema_private.bestiary WHERE jsonb_array_length(paragraphs)=5)<>134 THEN
  RAISE EXCEPTION 'Algum registro perdeu seus cinco parágrafos';
 END IF;
END $guard$;
COMMIT;
