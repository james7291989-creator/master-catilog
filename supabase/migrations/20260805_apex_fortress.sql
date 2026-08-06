-- ⚡ APEX FORTRESS MIGRATION ⚡
-- Enforces Row-Level Security, database indexes for cursor pagination,
-- and a signed-URL helper for the private vault-audio bucket.

-- ===========================================================================
-- 1. ROW-LEVEL SECURITY — sync_catalog
-- ===========================================================================
-- The catalog is read-only for authenticated users. Writes are restricted
-- to the service role (server-side only). This prevents tenant data leakage
-- via the anon key.

ALTER TABLE public.sync_catalog ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing permissive policies (idempotent migration).
DROP POLICY IF EXISTS "catalog_select_authenticated" ON public.sync_catalog;
DROP POLICY IF EXISTS "catalog_insert_service_role" ON public.sync_catalog;
DROP POLICY IF EXISTS "catalog_update_service_role" ON public.sync_catalog;
DROP POLICY IF EXISTS "catalog_delete_service_role" ON public.sync_catalog;

-- SELECT: authenticated users only (never anon).
CREATE POLICY "catalog_select_authenticated"
  ON public.sync_catalog
  FOR SELECT
  TO authenticated
  USING (true);

-- Write operations: service role only (server-side, never client).
CREATE POLICY "catalog_insert_service_role"
  ON public.sync_catalog
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "catalog_update_service_role"
  ON public.sync_catalog
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "catalog_delete_service_role"
  ON public.sync_catalog
  FOR DELETE
  TO service_role
  USING (true);

-- ===========================================================================
-- 2. DATABASE INDEXES — cursor (keyset) pagination
-- ===========================================================================
-- The repository queries ORDER BY track_title ASC/DESC with a keyset filter
-- (gt/lt on track_title). These composite indexes make those lookups O(log n).

CREATE INDEX IF NOT EXISTS idx_sync_catalog_track_title_asc
  ON public.sync_catalog (track_title ASC);

CREATE INDEX IF NOT EXISTS idx_sync_catalog_track_title_desc
  ON public.sync_catalog (track_title DESC);

-- Mood filter + sort (used by the mood matrix + pagination).
CREATE INDEX IF NOT EXISTS idx_sync_catalog_mood_track_title
  ON public.sync_catalog (mood, track_title);

-- BPM sort (secondary sort column).
CREATE INDEX IF NOT EXISTS idx_sync_catalog_bpm
  ON public.sync_catalog (bpm);

-- ===========================================================================
-- 3. PRIVATE STORAGE BUCKET — vault-audio
-- ===========================================================================
-- The bucket must be PRIVATE. Public buckets are forbidden by policy.
-- Assets are served exclusively via short-lived signed URLs.

INSERT INTO storage.buckets (id, name, public)
VALUES ('vault-audio', 'vault-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: authenticated users may read (via signed URLs), service role
-- may write (ingestion worker).
DROP POLICY IF EXISTS "vault_audio_select_authenticated" ON storage.objects;
DROP POLICY IF EXISTS "vault_audio_insert_service_role" ON storage.objects;

CREATE POLICY "vault_audio_select_authenticated"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'vault-audio');

CREATE POLICY "vault_audio_insert_service_role"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'vault-audio');

-- ===========================================================================
-- 4. SIGNED-URL HELPER (optional, for server-side generation)
-- ===========================================================================
-- Server-side helper to mint short-lived signed URLs. The client uses the
-- Supabase JS SDK's createSignedUrl, but this provides a SQL-level fallback
-- for edge functions / serverless workers.

CREATE OR REPLACE FUNCTION public.generate_vault_signed_url(
  p_path text,
  p_expires_in_seconds int DEFAULT 60
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
BEGIN
  -- Validate path: single segment, no traversal, allowed extension.
  IF p_path IS NULL
     OR p_path = ''
     OR p_path ~ '[/\\]'
     OR p_path ~ '^\.'
     OR lower(substring(p_path from '\.([^.]+)$')) NOT IN ('mp3','wav','flac','aiff','m4a') THEN
    RAISE EXCEPTION 'INVALID_STORAGE_PATH';
  END IF;

  -- Mint a signed URL via Supabase's internal signing.
  SELECT storage.sign(
    jsonb_build_object(
      'bucketId', 'vault-audio',
      'objectName', p_path,
      'expiresIn', p_expires_in_seconds
    )
  ) INTO v_url;

  RETURN v_url;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_vault_signed_url(text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.generate_vault_signed_url(text, int) TO service_role;