-- ============================================================
-- Move daily scan from 08:30 VN (01:30 UTC) to 12:30 VN (05:30 UTC).
-- Requested 2026-09-10. Idempotent.
-- ============================================================

DO $$ BEGIN
  PERFORM cron.unschedule('tube-atlas-daily-scan');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule('tube-atlas-daily-scan', '30 5 * * *', $$
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
