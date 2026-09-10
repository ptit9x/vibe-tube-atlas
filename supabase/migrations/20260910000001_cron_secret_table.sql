-- ============================================================
-- Cron secret storage via locked-down app_config table.
-- WHY: `ALTER DATABASE postgres SET app.cron_secret` fails on
-- hosted Supabase ("permission denied to set parameter"), so the
-- GUC approach is unusable. The pg_cron command (which runs as
-- the postgres role) reads the secret from this table instead.
--
-- Supabase grants anon/authenticated/service_role access to new
-- tables by default (ALTER DEFAULT PRIVILEGES), so we must
-- explicitly REVOKE from all three. Only the postgres role
-- (SQL editor + pg_cron) can read it. The secret value itself is
-- inserted manually via SQL editor and never lives in this repo.
--
-- Manual one-time step (SQL editor, after CI applies this):
--   INSERT INTO public.app_config (key, value)
--   VALUES ('cron_secret', '<random-32-char>')
--   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

REVOKE ALL ON public.app_config FROM PUBLIC, anon, authenticated, service_role;

-- Reschedule: read secret from app_config instead of GUC.
-- Cross join with the cron_secret row: if the row is missing or
-- empty, no HTTP call is made at all (avoids guaranteed-401 calls).
DO $$ BEGIN
  PERFORM cron.unschedule('tube-atlas-daily-scan');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule('tube-atlas-daily-scan', '30 1 * * *', $$
  SELECT net.http_post(
    url    := 'https://xidrdtzlkcerbbgzonjc.supabase.co/functions/v1/daily-scan',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || c.value
    ),
    body   := jsonb_build_object('user_id', s.user_id)
  )
  FROM public.scan_settings s
  CROSS JOIN public.app_config c
  WHERE s.enabled
    AND c.key = 'cron_secret'
    AND COALESCE(c.value, '') <> '';
$$);
