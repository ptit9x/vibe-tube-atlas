-- ============================================================
-- Daily niche scan v2: scan_settings + discovered_keywords + pg_cron
-- Multi-market: each row = (user, keyword, market)
-- ============================================================

-- ===== scan_settings (1 row per user) =====
CREATE TABLE IF NOT EXISTS public.scan_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  industries TEXT[] NOT NULL DEFAULT '{}',      -- empty = all industries
  markets TEXT[] NOT NULL DEFAULT '{VN,US}',   -- max 4 enforced in function + UI
  min_niche_score INTEGER NOT NULL DEFAULT 30,
  max_keywords_per_run INTEGER NOT NULL DEFAULT 50,  -- TOTAL across all markets
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.scan_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "scan_settings_all" ON public.scan_settings;
CREATE POLICY "scan_settings_all" ON public.scan_settings
  FOR ALL USING (auth.uid() = user_id);

-- ===== discovered_keywords =====
CREATE TABLE IF NOT EXISTS public.discovered_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  industry TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',            -- category key (rpm multiplier lookup)
  keyword TEXT NOT NULL,
  market TEXT NOT NULL DEFAULT 'VN',           -- market key (US/JP/KR/...)
  niche_score INTEGER NOT NULL DEFAULT 0,
  difficulty_score INTEGER NOT NULL DEFAULT 0,
  estimated_results BIGINT,
  avg_views BIGINT,
  views_per_day_top INTEGER,
  avg_video_age_days INTEGER,
  est_rpm NUMERIC(6,2),                        -- USD / 1k views estimate at discovery time
  sample_videos JSONB NOT NULL DEFAULT '[]',   -- [{id,title,views,published}]
  status TEXT NOT NULL DEFAULT 'ok',           -- ok | error
  discovered_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, keyword, market)
);

CREATE INDEX IF NOT EXISTS idx_discovered_user_score
  ON public.discovered_keywords(user_id, niche_score DESC, discovered_at DESC);
CREATE INDEX IF NOT EXISTS idx_discovered_user_market
  ON public.discovered_keywords(user_id, market, discovered_at DESC);

ALTER TABLE public.discovered_keywords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "discovered_keywords_all" ON public.discovered_keywords;
CREATE POLICY "discovered_keywords_all" ON public.discovered_keywords
  FOR ALL USING (auth.uid() = user_id);

-- ===== schedule: pg_cron → pg_net fan-out, one POST per enabled user =====
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$ BEGIN
  PERFORM cron.unschedule('tube-atlas-daily-scan');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 01:30 UTC = 08:30 Vietnam. Secret comes from DB-level GUC set in Dashboard SQL editor:
--   ALTER DATABASE postgres SET app.cron_secret TO '<random-secret>';
SELECT cron.schedule('tube-atlas-daily-scan', '30 1 * * *', $$
  SELECT net.http_post(
    url    := 'https://kusdcyhlyuuzjqdkwyqf.supabase.co/functions/v1/daily-scan',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
    ),
    body   := jsonb_build_object('user_id', s.user_id)
  )
  FROM public.scan_settings s
  WHERE s.enabled;
$$);
