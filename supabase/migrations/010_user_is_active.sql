-- Add is_active flag to users table for automatic inactive-user deactivation.
-- All existing users default to active. The cron job calls
-- deactivate_inactive_users() daily to flip the flag for users with no
-- water-logging AND no self-opt-outs in the last 7 days.

ALTER TABLE public.users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Partial index for fast lookup of the (small) set of inactive users.
CREATE INDEX users_inactive_idx ON public.users (id) WHERE is_active = false;

-- Atomic function: find inactive users AND deactivate them in one step.
-- Returns the IDs of users that were deactivated.
CREATE OR REPLACE FUNCTION public.deactivate_inactive_users()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH inactive AS (
    SELECT u.id
    FROM public.users u
    WHERE u.is_active = true
      -- No water logged in the last 7 days
      AND NOT EXISTS (
        SELECT 1 FROM public.intake_logs il
        WHERE il.user_id = u.id
          AND il.date >= CURRENT_DATE - INTERVAL '7 days'
      )
      -- No self-initiated opt-out overlapping the last 7 days.
      -- Self opt-outs have opted_out_by = user_id (both "Sit Out Today"
      -- and scheduled opt-outs). Team opt-outs (opted_out_by != user_id)
      -- do NOT count as engagement.
      AND NOT EXISTS (
        SELECT 1 FROM public.opt_outs oo
        WHERE oo.user_id = u.id
          AND oo.opted_out_by = u.id
          AND oo.end_date >= CURRENT_DATE - INTERVAL '7 days'
          AND oo.start_date <= CURRENT_DATE
      )
  )
  UPDATE public.users
  SET is_active = false
  FROM inactive
  WHERE users.id = inactive.id
  RETURNING users.id;
$$;
