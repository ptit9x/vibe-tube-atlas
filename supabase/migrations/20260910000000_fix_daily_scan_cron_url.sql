-- ============================================================
-- Fix: tube-atlas-daily-scan cron job was scheduled with the OLD
-- Supabase project URL (kusdcyhlyuuzjqdkwyqf) because migration
-- 20260909000000 was written before the project migration to
-- xidrdtzlkcerbbgzonjc. Reschedule with the correct URL.
-- Idempotent: safe to run on any database (also fresh ones).
-- ============================================================

DO $$ BEGIN
  PERFORM cron.unschedule('tube-atlas-daily-scan');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 01:30 UTC = 08:30 Vietnam. Secret comes from DB-level GUC set in Dashboard SQL editor:
--   ALTER DATABASE postgres SET app.cron_secret TO '<random-secret>';
SELECT cron.schedule('tube-atlas-daily-scan', '30 1 * * *', $$
  SELECT net.http_post(
    url    := 'https://xidrdtzlkcerbbgzonjc.supabase.co/functions/v1/daily-scan',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
    ),
    body   := jsonb_build_object('user_id', s.user_id)
  )
  FROM public.scan_settings s
  WHERE s.enabled;
$$);
