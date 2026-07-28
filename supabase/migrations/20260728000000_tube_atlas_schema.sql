-- ============================================================
-- Vibe Tube Atlas — Complete Schema (fresh)
-- YouTube keyword research tool
-- Tables: profiles, user_api_keys, search_history,
--         saved_keywords, saved_videos, saved_channels, api_usage
-- All tables have RLS (auth.uid() = user_id)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===== profiles =====
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ===== user_api_keys =====
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'youtube',
  api_key_encrypted TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_api_keys_select" ON public.user_api_keys;
DROP POLICY IF EXISTS "user_api_keys_insert" ON public.user_api_keys;
DROP POLICY IF EXISTS "user_api_keys_update" ON public.user_api_keys;
DROP POLICY IF EXISTS "user_api_keys_delete" ON public.user_api_keys;

CREATE POLICY "user_api_keys_select" ON public.user_api_keys
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_api_keys_insert" ON public.user_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_api_keys_update" ON public.user_api_keys
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_api_keys_delete" ON public.user_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- ===== search_history =====
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  search_type TEXT NOT NULL DEFAULT 'video',
  country TEXT DEFAULT 'VN',
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id, created_at DESC);

ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "search_history_select" ON public.search_history;
DROP POLICY IF EXISTS "search_history_insert" ON public.search_history;
DROP POLICY IF EXISTS "search_history_delete" ON public.search_history;

CREATE POLICY "search_history_select" ON public.search_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "search_history_insert" ON public.search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "search_history_delete" ON public.search_history
  FOR DELETE USING (auth.uid() = user_id);

-- ===== saved_keywords =====
CREATE TABLE IF NOT EXISTS public.saved_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_keywords_user ON public.saved_keywords(user_id, created_at DESC);

ALTER TABLE public.saved_keywords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_keywords_all" ON public.saved_keywords;

CREATE POLICY "saved_keywords_all" ON public.saved_keywords
  FOR ALL USING (auth.uid() = user_id);

-- ===== saved_videos =====
CREATE TABLE IF NOT EXISTS public.saved_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  channel_title TEXT,
  thumbnail_url TEXT,
  view_count BIGINT,
  like_count BIGINT,
  comment_count BIGINT,
  published_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_videos_user ON public.saved_videos(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_videos_user_video ON public.saved_videos(user_id, video_id);

ALTER TABLE public.saved_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_videos_all" ON public.saved_videos;

CREATE POLICY "saved_videos_all" ON public.saved_videos
  FOR ALL USING (auth.uid() = user_id);

-- ===== saved_channels =====
CREATE TABLE IF NOT EXISTS public.saved_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  subscriber_count BIGINT,
  video_count BIGINT,
  view_count BIGINT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_channels_user ON public.saved_channels(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_channels_user_channel ON public.saved_channels(user_id, channel_id);

ALTER TABLE public.saved_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_channels_all" ON public.saved_channels;

CREATE POLICY "saved_channels_all" ON public.saved_channels
  FOR ALL USING (auth.uid() = user_id);

-- ===== api_usage =====
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  quota_cost INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON public.api_usage(user_id, created_at DESC);

ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_usage_select" ON public.api_usage;
DROP POLICY IF EXISTS "api_usage_insert" ON public.api_usage;

CREATE POLICY "api_usage_select" ON public.api_usage
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "api_usage_insert" ON public.api_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: Auto-create profile on signup
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION public.handle_new_user() SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE: avatars bucket
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Avatar upload policies
DROP POLICY IF EXISTS "Avatar uploads" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public read" ON storage.objects;

CREATE POLICY "Avatar uploads" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "Avatar public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
