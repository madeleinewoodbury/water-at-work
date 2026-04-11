-- Migration 012: Seed legacy team for existing users
-- Creates a default team, assigns all existing users, and backfills team_id
-- on historical activity rows.

-- =============================================================================
-- 1. Create the legacy team (earliest user becomes creator)
-- =============================================================================
INSERT INTO public.teams (id, name, slug, created_by)
SELECT
  gen_random_uuid(),
  'Water at Work OG',
  'water-at-work-og',
  (SELECT id FROM public.users ORDER BY created_at ASC LIMIT 1)
WHERE EXISTS (SELECT 1 FROM public.users);

-- =============================================================================
-- 2. Assign all existing users to the legacy team
--    Earliest user = admin, rest = member
-- =============================================================================
WITH legacy AS (
  SELECT id FROM public.teams WHERE slug = 'water-at-work-og'
),
ranked AS (
  SELECT u.id, ROW_NUMBER() OVER (ORDER BY u.created_at ASC) AS rn
  FROM public.users u
)
UPDATE public.users u
SET
  team_id = (SELECT id FROM legacy),
  team_role = CASE WHEN r.rn = 1 THEN 'admin' ELSE 'member' END
FROM ranked r
WHERE u.id = r.id
  AND EXISTS (SELECT 1 FROM legacy);

-- =============================================================================
-- 3. Backfill team_id on all historical activity rows
-- =============================================================================
UPDATE public.intake_logs il
SET team_id = u.team_id
FROM public.users u
WHERE il.user_id = u.id AND il.team_id IS NULL AND u.team_id IS NOT NULL;

UPDATE public.opt_outs oo
SET team_id = u.team_id
FROM public.users u
WHERE oo.user_id = u.id AND oo.team_id IS NULL AND u.team_id IS NOT NULL;

UPDATE public.daily_goal_overrides dgo
SET team_id = u.team_id
FROM public.users u
WHERE dgo.user_id = u.id AND dgo.team_id IS NULL AND u.team_id IS NOT NULL;
