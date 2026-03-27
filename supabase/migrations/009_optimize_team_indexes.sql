-- Optimize cross-team date-range queries on the dashboard.
-- All indexes use CONCURRENTLY to avoid write locks on the live database.
-- Run each statement individually in the Supabase SQL editor (not as a batch),
-- since CREATE INDEX CONCURRENTLY cannot run inside a transaction block.

-- Serves: intake_logs.eq('date', today) across all users
-- The existing (user_id, date) index is kept for per-user queries in actions.ts
CREATE INDEX CONCURRENTLY intake_logs_date_idx ON public.intake_logs (date);

-- Serves: opt_outs.lte('start_date', today).gte('end_date', today) with no user_id prefix
-- The existing (user_id, start_date, end_date) index is kept for per-user opt-out checks
CREATE INDEX CONCURRENTLY opt_outs_date_range_idx ON public.opt_outs (start_date, end_date);

-- Covering index for: daily_goal_overrides.eq('date', today)
-- selecting (id, user_id, date, daily_goal) — avoids heap access with INCLUDE columns
CREATE INDEX CONCURRENTLY daily_goal_overrides_date_idx
  ON public.daily_goal_overrides (date)
  INCLUDE (user_id, daily_goal);
