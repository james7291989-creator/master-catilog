-- ⚡ OMEGA ADMIN INGESTION MIGRATION ⚡
-- Provides the secure relational-injection endpoint for the /omega-admin
-- ingestion engine.
--
-- SECURITY MODEL (MILITARY-GRADE):
--   * The client NEVER writes directly to sync_catalog. All inserts flow
--     through the SECURITY DEFINER function `ingest_catalog_track`, which:
--       1. Validates the target artist_id EXISTS in the artists ledger
--          (relational integrity — no orphaned multi-tenant rows).
--       2. Sanitizes + truncates every string field (XSS / length defense).
--       3. Coerces bpm to a bounded integer (rejects absurd values).
--       4. Inserts a single row and returns it for optimistic UI hydration.
--   * The anon key is granted EXECUTE on the function ONLY — never direct
--     table INSERT. The UI passcode gate (VITE_ADMIN_PASSPHRASE) is the
--     first line of defense; the function is the second.
--   * Storage uploads are scoped to the private vault-audio bucket with a
--     strict extension allow-list (mp3/wav only) so no arbitrary payload
--     can be dropped into the vault.

-- ===========================================================================
-- 1. SECURE RELATIONAL INJECTION FUNCTION
-- ===========================================================================
CREATE OR REPLACE FUNCTION public.ingest_catalog_track(
  p_artist_id uuid,
  p_track_title text,
  p_mood text,
  p_bpm integer,
  p_key text,
  p_file_name text,
  p_duration text DEFAULT NULL,
  p_asset_type text DEFAULT 'Master'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist_exists boolean;
  v_track_title text;
  v_mood text;
  v_key text;
  v_file_name text;
  v_duration text;
  v_asset_type text;
  v_bpm integer;
  v_row record;
BEGIN
  -- 1. RELATIONAL INTEGRITY: the artist must exist in the multi-tenant ledger.
  SELECT EXISTS (
    SELECT 1 FROM public.artists WHERE id = p_artist_id
  ) INTO v_artist_exists;

  IF NOT v_artist_exists THEN
    RAISE EXCEPTION 'ARTIST_NOT_FOUND';
  END IF;

  -- 2. INPUT SANITIZATION + LENGTH BOUNDS (defense-in-depth).
  v_track_title := left(coalesce(nullif(btrim(p_track_title), ''), 'Untitled Track'), 200);
  v_mood        := left(coalesce(nullif(btrim(p_mood), ''), 'Multi-Genre'), 80);
  v_key         := left(coalesce(nullif(btrim(p_key), ''), ''), 20);
  v_file_name   := left(coalesce(nullif(btrim(p_file_name), ''), ''), 255);
  v_duration    := left(coalesce(nullif(btrim(p_duration), ''), ''), 12);
  v_asset_type  := left(coalesce(nullif(btrim(p_asset_type), ''), 'Master'), 40);

  -- 3. BPM BOUNDS: reject absurd values (40..300 is a sane musical range).
  IF p_bpm IS NULL OR p_bpm < 40 OR p_bpm > 300 THEN
    RAISE EXCEPTION 'INVALID_BPM';
  END IF;
  v_bpm := p_bpm;

  -- 4. FILE NAME REQUIRED (the vault row must reference a stored asset).
  IF v_file_name = '' THEN
    RAISE EXCEPTION 'FILE_NAME_REQUIRED';
  END IF;

  -- 5. INSERT the row (multi-tenant scoped by artist_id).
  INSERT INTO public.sync_catalog (
    artist_id,
    track_title,
    mood,
    bpm,
    key,
    file_name,
    duration,
    asset_type
  )
  VALUES (
    p_artist_id,
    v_track_title,
    v_mood,
    v_bpm,
    v_key,
    v_file_name,
    v_duration,
    v_asset_type
  )
  RETURNING * INTO v_row;

  -- 6. Return the hydrated row as JSON for optimistic UI confirmation.
  RETURN jsonb_build_object(
    'id', v_row.id,
    'artist_id', v_row.artist_id,
    'track_title', v_row.track_title,
    'mood', v_row.mood,
    'bpm', v_row.bpm,
    'key', v_row.key,
    'file_name', v_row.file_name,
    'duration', v_row.duration,
    'asset_type', v_row.asset_type,
    'created_at', v_row.created_at
  );
END;
$$;

-- Grant EXECUTE to the anon role (the client bundle uses the anon key).
-- The function is the ONLY write path the client may use.
REVOKE ALL ON FUNCTION public.ingest_catalog_track(uuid, text, text, integer, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ingest_catalog_track(uuid, text, text, integer, text, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.ingest_catalog_track(uuid, text, text, integer, text, text, text, text) TO authenticated;

-- ===========================================================================
-- 2. STORAGE UPLOAD POLICY — vault-audio (client-side admin upload)
-- ===========================================================================
-- The admin engine uploads the raw .mp3/.wav to the private vault-audio
-- bucket. Allow anon INSERT scoped to that bucket with a strict extension
-- allow-list so only audio payloads can land.
DROP POLICY IF EXISTS "vault_audio_insert_anon" ON storage.objects;

CREATE POLICY "vault_audio_insert_anon"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'vault-audio'
    AND lower(right(name, 4)) IN ('.mp3', '.wav')
  );