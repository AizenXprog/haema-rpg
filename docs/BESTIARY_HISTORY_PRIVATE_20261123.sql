-- Histórico editorial privado. Nunca é consultável pelo browser ou Data API.
CREATE TABLE IF NOT EXISTS haema_private.bestiary_editorial_history(
 record_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 creature_id text NOT NULL,
 captured_at timestamptz NOT NULL DEFAULT now(),
 ordinal integer NOT NULL,
 title text NOT NULL,
 subtitle text NOT NULL,
 editorial_state text NOT NULL,
 paragraphs jsonb NOT NULL,
 released_indexes integer[] NOT NULL,
 revision integer NOT NULL,
 source_version text NOT NULL,
 source_hash text NOT NULL
);
ALTER TABLE haema_private.bestiary_editorial_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON haema_private.bestiary_editorial_history FROM PUBLIC,anon,authenticated;
CREATE UNIQUE INDEX IF NOT EXISTS bestiary_editorial_once
 ON haema_private.bestiary_editorial_history(creature_id,revision);
-- Snapshot anterior a qualquer revisão, também dos seis registros aprovados.
INSERT INTO haema_private.bestiary_editorial_history(
 creature_id,ordinal,title,subtitle,editorial_state,paragraphs,released_indexes,revision,source_version,source_hash)
SELECT id,ordinal,title,subtitle,editorial_state,paragraphs,released_indexes,revision,source_version,source_hash
FROM haema_private.bestiary
ON CONFLICT(creature_id,revision) DO NOTHING;