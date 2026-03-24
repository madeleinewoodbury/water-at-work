-- ============================================================
-- 005: daily_goal_overrides
--   Per-day override of a user's default daily_goal.
--   Purely additive — no changes to existing tables.
-- ============================================================

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

-- Real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_goal_overrides;
ALTER TABLE public.daily_goal_overrides REPLICA IDENTITY FULL;
