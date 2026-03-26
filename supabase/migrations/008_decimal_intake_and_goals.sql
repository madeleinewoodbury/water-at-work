-- Migration: Allow decimal ounces and goals (0.1 precision)
-- Converts integer columns to NUMERIC(6,1) while preserving existing values.

BEGIN;

-- 1. Intake logs: support decimal entries (for example, 16.9 oz)
ALTER TABLE public.intake_logs
  ALTER COLUMN ounces TYPE NUMERIC(6,1)
  USING ROUND(ounces::NUMERIC, 1);

-- 2. User profile goal: keep base daily goal in the same decimal format
ALTER TABLE public.users
  ALTER COLUMN daily_goal TYPE NUMERIC(6,1)
  USING ROUND(daily_goal::NUMERIC, 1),
  ALTER COLUMN daily_goal SET DEFAULT 32.0;

-- 3. Per-day goal overrides: keep override goals consistent with users.daily_goal
ALTER TABLE public.daily_goal_overrides
  ALTER COLUMN daily_goal TYPE NUMERIC(6,1)
  USING ROUND(daily_goal::NUMERIC, 1);

COMMIT;