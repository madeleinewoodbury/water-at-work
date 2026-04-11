-- Migration 013: Team-scoped RLS policies
-- Replaces global "authenticated can read all" policies with team-scoped ones.
-- Deploy AFTER all application code is validated in production.
--
-- Uses SECURITY DEFINER helper functions to avoid infinite recursion: policies
-- that reference public.users from within a public.users RLS policy (or from
-- other tables that chain through users RLS) would cause PostgreSQL to recurse
-- infinitely. The functions bypass RLS entirely when fetching team context.

-- =============================================================================
-- 1. RLS helper functions (SECURITY DEFINER — bypass RLS to break recursion)
-- =============================================================================

-- Returns the team_id of the currently authenticated user.
CREATE OR REPLACE FUNCTION public.get_auth_user_team_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT team_id FROM public.users WHERE id = auth.uid()
$$;

-- Returns true if the current user is the admin of the given team.
CREATE OR REPLACE FUNCTION public.is_current_user_team_admin(p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND team_id = p_team_id
      AND team_role = 'admin'
  )
$$;

-- =============================================================================
-- 2. Fix public.teams admin policies (from migration 011)
--    The original policies subquery users, which now triggers the recursive
--    users RLS. Replace with the helper function.
-- =============================================================================

DROP POLICY IF EXISTS "Team admin can update own team" ON public.teams;
CREATE POLICY "Team admin can update own team"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (public.is_current_user_team_admin(teams.id));

DROP POLICY IF EXISTS "Team admin can delete own team" ON public.teams;
CREATE POLICY "Team admin can delete own team"
  ON public.teams FOR DELETE
  TO authenticated
  USING (public.is_current_user_team_admin(teams.id));

-- =============================================================================
-- 3. Fix public.team_join_requests admin policies (from migration 011)
-- =============================================================================

DROP POLICY IF EXISTS "Team admin can view team join requests" ON public.team_join_requests;
CREATE POLICY "Team admin can view team join requests"
  ON public.team_join_requests FOR SELECT
  TO authenticated
  USING (public.is_current_user_team_admin(team_join_requests.team_id));

DROP POLICY IF EXISTS "Team admin can review requests" ON public.team_join_requests;
CREATE POLICY "Team admin can review requests"
  ON public.team_join_requests FOR UPDATE
  TO authenticated
  USING (public.is_current_user_team_admin(team_join_requests.team_id))
  WITH CHECK (status IN ('approved', 'rejected'));

-- =============================================================================
-- 4. Users — team-scoped + self-read
-- =============================================================================

-- Self-read already exists: "Users can view own row"

-- Team members can view each other
DROP POLICY IF EXISTS "Team members can view teammates" ON public.users;
CREATE POLICY "Team members can view teammates"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND team_id = public.get_auth_user_team_id()
  );

-- Drop global read-all policy
DROP POLICY IF EXISTS "Authenticated users can view all users" ON public.users;

-- =============================================================================
-- 5. intake_logs — self-read + team-scoped
-- =============================================================================

-- Users can always read their own logs (personal history)
CREATE POLICY "Users can read own intake"
  ON public.intake_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Team members can read team logs
CREATE POLICY "Team members can read team intake"
  ON public.intake_logs FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND team_id = public.get_auth_user_team_id()
  );

-- Drop global read-all policy
DROP POLICY IF EXISTS "Authenticated users can read all intake" ON public.intake_logs;

-- =============================================================================
-- 6. opt_outs — self-read + team-scoped
-- =============================================================================

-- Users can always read their own opt-outs
CREATE POLICY "Users can read own opt_outs"
  ON public.opt_outs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Team members can read team opt-outs
CREATE POLICY "Team members can read team opt_outs"
  ON public.opt_outs FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND team_id = public.get_auth_user_team_id()
  );

-- Drop global read-all policy
DROP POLICY IF EXISTS "Authenticated users can read all opt_outs" ON public.opt_outs;

-- =============================================================================
-- 7. daily_goal_overrides — self-read + team-scoped
-- =============================================================================

-- Users can always read their own overrides
CREATE POLICY "Users can read own daily_goal_overrides"
  ON public.daily_goal_overrides FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Team members can read team overrides
CREATE POLICY "Team members can read team daily_goal_overrides"
  ON public.daily_goal_overrides FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND team_id = public.get_auth_user_team_id()
  );

-- Drop global read-all policy
DROP POLICY IF EXISTS "Authenticated users can read all daily_goal_overrides" ON public.daily_goal_overrides;
