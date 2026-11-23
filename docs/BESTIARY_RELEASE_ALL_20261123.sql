-- HÆMA · Publicação editorial de 25 espécies · 23/11/2026
-- Requer prévia revisão narrativa e backup privado, instalados antes deste passo.
-- NÃO promove propostas, conceitos ou documentos históricos ao cânone.
BEGIN;
DO $$ BEGIN
 IF (SELECT count(*) FROM haema_private.bestiary) <> 25 THEN
  RAISE EXCEPTION 'Publicação interrompida: o Bestiário não possui 25 espécies';
 END IF;
 IF EXISTS(SELECT 1 FROM haema_private.bestiary
   WHERE jsonb_array_length(paragraphs)<>5
   OR jsonb_typeof(paragraphs)<>'array'
   OR title IS NULL) THEN
  RAISE EXCEPTION 'Publicação interrompida: faltam textos revisados';
 END IF;
 IF (SELECT count(DISTINCT creature_id) FROM haema_private.bestiary_editorial_history)<25 THEN
  RAISE EXCEPTION 'Publicação interrompida: backup editorial incompleto';
 END IF;
 IF (SELECT count(*) FROM haema_private.bestiary WHERE editorial_state='canon')<>3
  OR (SELECT count(*) FROM haema_private.bestiary WHERE editorial_state='concept')<>3
  OR (SELECT count(*) FROM haema_private.bestiary WHERE editorial_state='historical')<>12
  OR (SELECT count(*) FROM haema_private.bestiary WHERE editorial_state='proposal')<>7 THEN
  RAISE EXCEPTION 'Publicação interrompida: estados editoriais foram alterados';
 END IF;
END $$;
UPDATE haema_private.bestiary AS b
SET released_indexes=ARRAY(SELECT generate_series(0,jsonb_array_length(b.paragraphs)-1)),
 revision=b.revision+1,updated_at=now()
WHERE cardinality(b.released_indexes)<>jsonb_array_length(b.paragraphs)
 OR EXISTS (
  SELECT 1 FROM generate_series(0,jsonb_array_length(b.paragraphs)-1) g(i)
  WHERE NOT (g.i=ANY(b.released_indexes))
 );
DO $$ BEGIN IF EXISTS (
 SELECT 1 FROM haema_private.bestiary
 WHERE cardinality(released_indexes)<>5
 OR released_indexes<>ARRAY[0,1,2,3,4]
) THEN RAISE EXCEPTION 'Erro: nem todos os 125 parágrafos estão liberados'; END IF;
END $$;
COMMIT;