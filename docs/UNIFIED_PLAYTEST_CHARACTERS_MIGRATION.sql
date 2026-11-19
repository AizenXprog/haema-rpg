-- HÆMA · Manual Unificado experimental · 19/11/2026
-- MIGRAÇÃO ADITIVA, NÃO APLICADA AUTOMATICAMENTE.
-- Realizar backup e revisar ambiente/constraints antes de executar.
-- Site e Sistema criado por Vitor Monte.
BEGIN;
DO $$
DECLARE
  version_constraint text;
  payload_constraint text;
BEGIN
  -- Confere o banco existente: fail-closed ao invés de remover proteções desconhecidas.
  SELECT conname INTO version_constraint FROM pg_constraint
    WHERE conrelid='public.haema_characters'::regclass AND contype='c'
      AND pg_get_constraintdef(oid) LIKE '%rules_version%';
  SELECT conname INTO payload_constraint FROM pg_constraint
    WHERE conrelid='public.haema_characters'::regclass AND contype='c'
      AND pg_get_constraintdef(oid) LIKE '%payload%';
  IF version_constraint IS NULL OR payload_constraint IS NULL THEN
    RAISE EXCEPTION 'Estrutura inesperada de haema_characters: revise a migration manualmente';
  END IF;
  IF (SELECT count(*) FROM pg_constraint WHERE conrelid='public.haema_characters'::regclass
      AND contype='c' AND (pg_get_constraintdef(oid) LIKE '%rules_version%' OR pg_get_constraintdef(oid) LIKE '%payload%')) <> 2 THEN
    RAISE EXCEPTION 'Mais de duas constraints relevantes: análise manual necessária';
  END IF;
  EXECUTE format('ALTER TABLE public.haema_characters DROP CONSTRAINT %I',version_constraint);
  EXECUTE format('ALTER TABLE public.haema_characters DROP CONSTRAINT %I',payload_constraint);
END $$;
ALTER TABLE public.haema_characters ADD CONSTRAINT haema_characters_rules_version_check
 CHECK (rules_version IN ('0.1','unified-playtest-20261119'));
ALTER TABLE public.haema_characters ADD CONSTRAINT haema_characters_payload_check CHECK (
  jsonb_typeof(payload)='object'
  AND payload->>'format'='haema-character'
  AND payload->>'version'=rules_version
  AND jsonb_typeof(payload->'attributes')='array'
  AND jsonb_array_length(payload->'attributes')=6
  AND jsonb_typeof(payload->'skills')='array'
  AND jsonb_array_length(payload->'skills')=24
  AND (
    rules_version='0.1'
    OR (
      jsonb_typeof(payload->'guard')='number'
      AND (payload->>'guard')::integer IN (6,8,10,12)
      AND jsonb_typeof(payload->'wounds')='number'
      AND (payload->>'wounds')::integer BETWEEN 0 AND 2
      AND jsonb_typeof(payload->'deathRisks')='number'
      AND (payload->>'deathRisks')::integer BETWEEN 0 AND 3
      AND jsonb_typeof(payload->'pe')='number'
      AND (payload->>'pe')::integer >= 0
      AND jsonb_typeof(payload->'invicta')='number'
      AND (payload->>'invicta')::integer BETWEEN 0 AND 1
    )
  )
);
-- Mantém todas as políticas RLS, grants, gatilhos, índices, chaves e fichas existentes.
COMMIT;
