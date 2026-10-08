-- ============================================================
-- Encrypt YouTube API keys at rest + remove client read access.
--
-- PROBLEM (fixed here):
--   1. user_api_keys.api_key_encrypted was stored as PLAINTEXT.
--   2. The RLS SELECT policy (auth.uid() = user_id) let any
--      authenticated client read the key column back. The anon key
--      is public by design, so any XSS / leaked session / malicious
--      browser extension could exfiltrate every user's YouTube key.
--
-- FIX:
--   - Passphrase lives in the locked-down public.app_config table
--     (postgres role only; anon/authenticated/service_role revoked).
--   - api_key_encrypted becomes BYTEA holding pgp_sym_encrypt output.
--   - Two SECURITY DEFINER RPCs are the ONLY access path for the key:
--       save_user_youtube_key(TEXT) -- encrypt + upsert (web client)
--       get_user_youtube_key()      -- decrypt + return (edge function)
--   - Column-level REVOKE: anon/authenticated can SELECT only the
--     metadata columns and DELETE their own rows. Direct INSERT/UPDATE
--     of the table is no longer granted (writes go through the RPC).
-- ============================================================

-- 1) Passphrase (generated once, kept forever)
INSERT INTO public.app_config (key, value)
VALUES ('youtube_key_passphrase', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- 2) Encrypt existing plaintext keys in place.
--    Idempotent: only runs while the column is still TEXT.
DO $encrypt$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_api_keys'
        AND column_name = 'api_key_encrypted') = 'text' THEN
    ALTER TABLE public.user_api_keys
      ALTER COLUMN api_key_encrypted TYPE BYTEA
      USING pgp_sym_encrypt(
        api_key_encrypted,
        (SELECT value FROM public.app_config WHERE key = 'youtube_key_passphrase')
      );
  END IF;
END $encrypt$;

-- 3) RPC: read own key (called by the youtube-search edge function).
--    SECURITY DEFINER so it can read app_config + decrypt; the caller is
--    still identified via auth.uid() from their JWT.
CREATE OR REPLACE FUNCTION public.get_user_youtube_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_passphrase TEXT;
  v_cipher BYTEA;
BEGIN
  SELECT value INTO v_passphrase
  FROM public.app_config WHERE key = 'youtube_key_passphrase';
  IF v_passphrase IS NULL THEN RETURN NULL; END IF;

  SELECT api_key_encrypted INTO v_cipher
  FROM public.user_api_keys
  WHERE user_id = auth.uid()
    AND provider = 'youtube'
    AND is_active = true;

  IF v_cipher IS NULL THEN RETURN NULL; END IF;
  RETURN pgp_sym_decrypt(v_cipher, v_passphrase);
END;
$func$;

-- 4) RPC: save own key (called by the web client instead of direct upsert).
CREATE OR REPLACE FUNCTION public.save_user_youtube_key(p_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_passphrase TEXT;
  v_uid UUID;
  v_key TEXT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  v_key := trim(p_key);
  IF v_key IS NULL OR v_key = '' THEN RAISE EXCEPTION 'Empty API key'; END IF;
  IF length(v_key) > 500 THEN RAISE EXCEPTION 'API key too long'; END IF;

  SELECT value INTO v_passphrase
  FROM public.app_config WHERE key = 'youtube_key_passphrase';
  IF v_passphrase IS NULL THEN RAISE EXCEPTION 'Encryption not configured'; END IF;

  INSERT INTO public.user_api_keys (user_id, provider, api_key_encrypted, is_active, updated_at)
  VALUES (v_uid, 'youtube', pgp_sym_encrypt(v_key, v_passphrase), true, now())
  ON CONFLICT (user_id, provider) DO UPDATE SET
    api_key_encrypted = pgp_sym_encrypt(v_key, v_passphrase),
    is_active = true,
    updated_at = now();
END;
$func$;

-- 5) Lock down direct table access.
REVOKE ALL ON FUNCTION public.get_user_youtube_key() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.save_user_youtube_key(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_youtube_key() TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_user_youtube_key(TEXT) TO authenticated;

REVOKE ALL ON public.user_api_keys FROM anon, authenticated;
GRANT SELECT (id, user_id, provider, is_active, created_at, updated_at)
  ON public.user_api_keys TO authenticated;
GRANT DELETE ON public.user_api_keys TO authenticated;
