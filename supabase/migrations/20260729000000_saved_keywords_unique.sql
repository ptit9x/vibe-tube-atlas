-- ============================================================
-- saved_keywords: prevent duplicate (user_id, keyword) rows
-- Case-insensitive — KeywordExplorer treats keywords case-insensitively.
-- ============================================================

-- Dedupe existing rows: keep the newest per (user_id, lower(keyword)).
-- ctid breaks exact created_at ties so the unique index below can't fail.
DELETE FROM public.saved_keywords a
USING public.saved_keywords b
WHERE a.user_id = b.user_id
  AND lower(a.keyword) = lower(b.keyword)
  AND (a.created_at, a.ctid) < (b.created_at, b.ctid);

CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_keywords_user_keyword
  ON public.saved_keywords(user_id, lower(keyword));
