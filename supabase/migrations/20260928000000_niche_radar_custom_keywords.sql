-- ============================================================
-- Niche Radar v2.1: custom keywords + scan observability
--
-- 1) custom_keywords TEXT[] on scan_settings — user-defined seed
--    keywords scanned every run alongside (or instead of) the
--    built-in industry taxonomy. Empty = taxonomy only (old behavior).
-- 2) last_scan_at on scan_settings — set by daily-scan at the end
--    of a successful run so the UI can show "last scan: X ago"
--    and users can tell a scheduled run from a dead one.
-- ============================================================

ALTER TABLE public.scan_settings
  ADD COLUMN IF NOT EXISTS custom_keywords TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.scan_settings
  ADD COLUMN IF NOT EXISTS last_scan_at TIMESTAMPTZ;
