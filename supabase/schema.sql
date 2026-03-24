-- ============================================================
-- Water at Work (WaW) — Supabase Schema
-- Run top to bottom in the Supabase SQL Editor on a fresh project.
-- Before running: create a public storage bucket named exactly "avatars"
--   in the Supabase Dashboard → Storage (bucket name is case-sensitive).
-- Safe to re-run — section 0 tears everything down first.
-- ============================================================


-- ============================================================
-- 0. Teardown (safe to re-run on an existing database)
-- ============================================================

DROP TABLE IF EXISTS public.opt_outs   CASCADE;
DROP TABLE IF EXISTS public.intake_logs CASCADE;
DROP TABLE IF EXISTS public.users       CASCADE;

DROP TRIGGER  IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar read"           ON storage.objects;



-- ============================================================
-- 1. public.users
--    Mirror of auth.users with app-specific fields.
--    Auto-populated via trigger on every new sign-up.
-- ============================================================

CREATE TABLE public.users (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  display_name TEXT,
  daily_goal   INTEGER     NOT NULL DEFAULT 32,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Own-row access
CREATE POLICY "Users can view own row"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own row"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Team read access — required for the dashboard user list
CREATE POLICY "Authenticated users can view all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

-- Trigger function: auto-insert a row on new auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 2. public.intake_logs
--    One row per logging event (append-only).
--    Multiple entries per user per day are summed at query time.
-- ============================================================

CREATE TABLE public.intake_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE        NOT NULL DEFAULT current_date,
  ounces     INTEGER     NOT NULL CHECK (ounces > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Efficient look-up of a single user's entries for a given date
CREATE INDEX intake_logs_user_date_idx ON public.intake_logs (user_id, date);

ALTER TABLE public.intake_logs ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own entries
CREATE POLICY "Users can insert own intake"
  ON public.intake_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- All authenticated users can read all entries (team dashboard)
CREATE POLICY "Authenticated users can read all intake"
  ON public.intake_logs FOR SELECT
  TO authenticated
  USING (true);

-- Users can only modify their own entries
CREATE POLICY "Users can update own intake"
  ON public.intake_logs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own intake"
  ON public.intake_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 3. Storage RLS policies for the "avatars" bucket
--    The bucket must already exist (created via the Dashboard).
--    avatar_url values: NULL (initials), 'gravatar', 'icon:{preset-id}',
--    or a Supabase Storage public URL for uploaded images.
-- ============================================================

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public avatar read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');


-- ============================================================
-- 4. public.opt_outs
--    Each row = one user's opt-out window (inclusive on both ends).
--    A single-day opt-out: start_date = end_date = that date.
-- ============================================================

CREATE TABLE public.opt_outs (
  id         UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE  NOT NULL,
  end_date   DATE  NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT opt_outs_date_order CHECK (end_date >= start_date)
);

CREATE INDEX opt_outs_user_start_end_idx
  ON public.opt_outs (user_id, start_date, end_date);

ALTER TABLE public.opt_outs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all opt-outs (needed for team calcs)
CREATE POLICY "Authenticated users can read all opt_outs"
  ON public.opt_outs FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own opt-outs
CREATE POLICY "Users can insert own opt_out"
  ON public.opt_outs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own opt-outs
CREATE POLICY "Users can delete own opt_out"
  ON public.opt_outs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 5. public.daily_goal_overrides
--    Per-day override of a user's default daily_goal.
--    A row here means the user chose a different goal for
--    that specific date. If no row exists, the base
--    daily_goal from public.users applies.
-- ============================================================

DROP TABLE IF EXISTS public.daily_goal_overrides CASCADE;

CREATE TABLE public.daily_goal_overrides (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE        NOT NULL,
  daily_goal INTEGER     NOT NULL CHECK (daily_goal > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_goal_overrides ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all overrides (needed for team goal calculations)
CREATE POLICY "Authenticated users can read all daily_goal_overrides"
  ON public.daily_goal_overrides FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own overrides
CREATE POLICY "Users can insert own daily_goal_override"
  ON public.daily_goal_overrides FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own overrides
CREATE POLICY "Users can update own daily_goal_override"
  ON public.daily_goal_overrides FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own overrides
CREATE POLICY "Users can delete own daily_goal_override"
  ON public.daily_goal_overrides FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 6. Real-time
--    Enable postgres_changes subscriptions on tables used by
--    the live dashboard. REPLICA IDENTITY FULL ensures DELETE
--    events include the full row (needed to identify user_id).
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.intake_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.opt_outs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_goal_overrides;

ALTER TABLE public.intake_logs REPLICA IDENTITY FULL;
ALTER TABLE public.opt_outs REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.daily_goal_overrides REPLICA IDENTITY FULL;
