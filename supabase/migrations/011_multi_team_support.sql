-- Migration 011: Multi-team support
-- Adds teams, team_join_requests tables; adds team_id/team_role to users;
-- adds team_id to intake_logs, opt_outs, daily_goal_overrides.
-- All changes are additive and nullable — the existing app continues unchanged.

-- =============================================================================
-- 1. Create public.teams (basic policies only — admin policies added after
--    users.team_id exists in step 3)
-- =============================================================================
CREATE TABLE public.teams (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  created_by UUID        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX teams_slug_idx ON public.teams (slug);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can browse teams (for the /teams listing page)
CREATE POLICY "Authenticated users can view all teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create teams
CREATE POLICY "Authenticated users can insert teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- =============================================================================
-- 2. Add team_id and team_role to public.users
-- =============================================================================
ALTER TABLE public.users
  ADD COLUMN team_id   UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD COLUMN team_role TEXT CHECK (team_role IN ('admin', 'member'));

CREATE INDEX users_team_id_idx ON public.users (team_id) WHERE team_id IS NOT NULL;

-- =============================================================================
-- 3. Teams admin policies (now that users.team_id exists)
-- =============================================================================

-- Team admin can update their team (rename, etc.)
CREATE POLICY "Team admin can update own team"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.team_id = teams.id
      AND u.team_role = 'admin'
  ));

-- Team admin can delete their team
CREATE POLICY "Team admin can delete own team"
  ON public.teams FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.team_id = teams.id
      AND u.team_role = 'admin'
  ));

-- =============================================================================
-- 4. Add nullable team_id to activity tables
-- =============================================================================
ALTER TABLE public.intake_logs
  ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE public.opt_outs
  ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

ALTER TABLE public.daily_goal_overrides
  ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- Composite indexes for team-scoped queries
CREATE INDEX intake_logs_team_date_idx
  ON public.intake_logs (team_id, date) WHERE team_id IS NOT NULL;

CREATE INDEX opt_outs_team_dates_idx
  ON public.opt_outs (team_id, start_date, end_date) WHERE team_id IS NOT NULL;

CREATE INDEX daily_goal_overrides_team_date_idx
  ON public.daily_goal_overrides (team_id, date) WHERE team_id IS NOT NULL;

-- =============================================================================
-- 5. Create public.team_join_requests
-- =============================================================================
CREATE TABLE public.team_join_requests (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id           UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  requester_user_id UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status            TEXT        NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce max one pending request per user
CREATE UNIQUE INDEX team_join_requests_one_pending_per_user
  ON public.team_join_requests (requester_user_id)
  WHERE status = 'pending';

-- Index for admin to list pending requests for their team
CREATE INDEX team_join_requests_team_status_idx
  ON public.team_join_requests (team_id, status);

ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- Requester can view their own requests
CREATE POLICY "Users can view own join requests"
  ON public.team_join_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_user_id);

-- Team admin can view requests for their team
CREATE POLICY "Team admin can view team join requests"
  ON public.team_join_requests FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.team_id = team_join_requests.team_id
      AND u.team_role = 'admin'
  ));

-- Users can create join requests
CREATE POLICY "Users can create join requests"
  ON public.team_join_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_user_id AND status = 'pending');

-- Requester can cancel (delete) their own pending request
CREATE POLICY "Users can cancel own pending request"
  ON public.team_join_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_user_id AND status = 'pending');

-- Team admin can update (approve/reject) requests
CREATE POLICY "Team admin can review requests"
  ON public.team_join_requests FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid()
      AND u.team_id = team_join_requests.team_id
      AND u.team_role = 'admin'
  ))
  WITH CHECK (status IN ('approved', 'rejected'));

-- =============================================================================
-- 6. Enable real-time for new tables
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER TABLE public.teams REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.team_join_requests;
ALTER TABLE public.team_join_requests REPLICA IDENTITY FULL;
