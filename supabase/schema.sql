-- ============================================================
-- Water at Work (WaW) — Supabase Schema
-- Run top to bottom in the Supabase SQL Editor on a fresh project.
-- ============================================================


-- ============================================================
-- 1. public.users
--    Mirror of auth.users with app-specific fields.
--    Auto-populated via trigger on every new sign-up.
-- ============================================================

CREATE TABLE public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  daily_goal  INTEGER     NOT NULL DEFAULT 32,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
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
