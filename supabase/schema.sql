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

DROP TABLE IF EXISTS public.notifications      CASCADE;
DROP TABLE IF EXISTS public.team_join_requests CASCADE;
DROP TABLE IF EXISTS public.opt_outs           CASCADE;
DROP TABLE IF EXISTS public.daily_goal_overrides CASCADE;
DROP TABLE IF EXISTS public.intake_logs        CASCADE;
DROP TABLE IF EXISTS public.users              CASCADE;
DROP TABLE IF EXISTS public.teams              CASCADE;

DROP TRIGGER  IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.prevent_authenticated_membership_self_update();
DROP FUNCTION IF EXISTS public.deactivate_inactive_users();
DROP FUNCTION IF EXISTS public.get_auth_user_team_id();
DROP FUNCTION IF EXISTS public.is_current_user_team_admin(UUID);

DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Public avatar read"           ON storage.objects;


-- ============================================================
-- 1. public.teams (basic policies only)
--    Admin UPDATE/DELETE policies are added after public.users
--    is created, because they use helper functions that reference
--    the users table.
-- ============================================================

CREATE TABLE public.teams (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  created_by UUID        NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX teams_slug_idx ON public.teams (slug);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can browse teams
CREATE POLICY "Authenticated users can view all teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create teams
CREATE POLICY "Authenticated users can insert teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);


-- ============================================================
-- 2. public.users
--    Mirror of auth.users with app-specific fields.
--    Auto-populated via trigger on every new sign-up.
-- ============================================================

CREATE TABLE public.users (
  id           UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT        NOT NULL,
  display_name TEXT,
  daily_goal   NUMERIC(6,1) NOT NULL DEFAULT 32.0,
  avatar_url   TEXT,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  team_id      UUID        REFERENCES public.teams(id) ON DELETE SET NULL,
  team_role    TEXT        CHECK (team_role IN ('admin', 'member')),
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

-- Block direct authenticated self-updates to membership fields.
-- Team membership and role changes must flow through trusted server paths.
CREATE OR REPLACE FUNCTION public.prevent_authenticated_membership_self_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(auth.role(), '') = 'authenticated'
    AND auth.uid() = NEW.id
    AND (
      OLD.team_id IS DISTINCT FROM NEW.team_id
      OR OLD.team_role IS DISTINCT FROM NEW.team_role
    ) THEN
    RAISE EXCEPTION 'Direct membership updates are not allowed.';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER users_block_membership_self_update
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.prevent_authenticated_membership_self_update();

-- Partial index for fast lookup of inactive users
CREATE INDEX users_inactive_idx ON public.users (id) WHERE is_active = false;

-- Index for looking up team members
CREATE INDEX users_team_id_idx ON public.users (team_id) WHERE team_id IS NOT NULL;

-- ============================================================
-- 3. RLS helper functions
--    Defined after public.users so the function bodies validate.
--    SECURITY DEFINER bypasses RLS — safe because they only read
--    the calling user's own team context, never arbitrary data.
-- ============================================================

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


-- ============================================================
-- 4. public.teams — admin policies (now that helpers exist)
-- ============================================================

-- Team members can view each other (added here after helper functions)
CREATE POLICY "Team members can view teammates"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND team_id = public.get_auth_user_team_id()
  );

CREATE POLICY "Team admin can update own team"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (public.is_current_user_team_admin(teams.id));

CREATE POLICY "Team admin can delete own team"
  ON public.teams FOR DELETE
  TO authenticated
  USING (public.is_current_user_team_admin(teams.id));


-- ============================================================
-- 5. public.intake_logs
--    One row per logging event (append-only).
--    Multiple entries per user per day are summed at query time.
-- ============================================================

CREATE TABLE public.intake_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE        NOT NULL DEFAULT current_date,
  ounces     NUMERIC(6,1) NOT NULL CHECK (ounces > 0),
  team_id    UUID        REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Efficient look-up of a single user's entries for a given date
CREATE INDEX intake_logs_user_date_idx ON public.intake_logs (user_id, date);
-- Cross-user date-range queries
CREATE INDEX intake_logs_date_idx ON public.intake_logs (date);
-- Team-scoped queries
CREATE INDEX intake_logs_team_date_idx ON public.intake_logs (team_id, date) WHERE team_id IS NOT NULL;

ALTER TABLE public.intake_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own intake"
  ON public.intake_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own intake"
  ON public.intake_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Team members can read team intake"
  ON public.intake_logs FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND team_id = public.get_auth_user_team_id()
  );

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
-- 6. Storage RLS policies for the "avatars" bucket
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
-- 7. public.opt_outs
--    Each row = one user's opt-out window (inclusive on both ends).
--    opted_out_by tracks who initiated the opt-out.
-- ============================================================

CREATE TABLE public.opt_outs (
  id             UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opted_out_by   UUID  REFERENCES auth.users(id) ON DELETE SET NULL,
  start_date     DATE  NOT NULL,
  end_date       DATE  NOT NULL,
  team_id        UUID  REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT opt_outs_date_order CHECK (end_date >= start_date)
);

CREATE INDEX opt_outs_user_start_end_idx
  ON public.opt_outs (user_id, start_date, end_date);
-- Cross-user date-range queries
CREATE INDEX opt_outs_date_range_idx ON public.opt_outs (start_date, end_date);
CREATE INDEX opt_outs_team_dates_idx
  ON public.opt_outs (team_id, start_date, end_date) WHERE team_id IS NOT NULL;

ALTER TABLE public.opt_outs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own opt_outs"
  ON public.opt_outs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Team members can read team opt_outs"
  ON public.opt_outs FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND team_id = public.get_auth_user_team_id()
  );

CREATE POLICY "Users can insert own opt_out"
  ON public.opt_outs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND auth.uid() = opted_out_by
    AND (
      team_id IS NULL
      OR team_id = public.get_auth_user_team_id()
    )
  );

CREATE POLICY "Users can delete own opt_out"
  ON public.opt_outs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Actor can delete opt_out they created"
  ON public.opt_outs FOR DELETE
  TO authenticated
  USING (auth.uid() = opted_out_by);

-- Atomic function: find users inactive for 7+ days and deactivate them.
-- Defined here because it references both intake_logs and opt_outs.
CREATE OR REPLACE FUNCTION public.deactivate_inactive_users()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH inactive AS (
    SELECT u.id
    FROM public.users u
    WHERE u.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.intake_logs il
        WHERE il.user_id = u.id
          AND il.date >= CURRENT_DATE - INTERVAL '7 days'
      )
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


-- ============================================================
-- 8. public.daily_goal_overrides
--    Per-day override of a user's default daily_goal.
-- ============================================================

CREATE TABLE public.daily_goal_overrides (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date       DATE        NOT NULL,
  daily_goal NUMERIC(6,1) NOT NULL CHECK (daily_goal > 0),
  team_id    UUID        REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX daily_goal_overrides_team_date_idx
  ON public.daily_goal_overrides (team_id, date) WHERE team_id IS NOT NULL;
-- Covering index for date-based goal lookups
CREATE INDEX daily_goal_overrides_date_idx
  ON public.daily_goal_overrides (date)
  INCLUDE (user_id, daily_goal);

ALTER TABLE public.daily_goal_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own daily_goal_overrides"
  ON public.daily_goal_overrides FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Team members can read team daily_goal_overrides"
  ON public.daily_goal_overrides FOR SELECT
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND team_id = public.get_auth_user_team_id()
  );

CREATE POLICY "Users can insert own daily_goal_override"
  ON public.daily_goal_overrides FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily_goal_override"
  ON public.daily_goal_overrides FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily_goal_override"
  ON public.daily_goal_overrides FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 9. public.team_join_requests
--    Tracks requests to join teams.
-- ============================================================

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

CREATE UNIQUE INDEX team_join_requests_one_pending_per_user
  ON public.team_join_requests (requester_user_id)
  WHERE status = 'pending';

CREATE INDEX team_join_requests_team_status_idx
  ON public.team_join_requests (team_id, status);

ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own join requests"
  ON public.team_join_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_user_id);

CREATE POLICY "Team admin can view team join requests"
  ON public.team_join_requests FOR SELECT
  TO authenticated
  USING (public.is_current_user_team_admin(team_join_requests.team_id));

CREATE POLICY "Users can create join requests"
  ON public.team_join_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_user_id AND status = 'pending');

CREATE POLICY "Users can cancel own pending request"
  ON public.team_join_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = requester_user_id AND status = 'pending');

CREATE POLICY "Team admin can review requests"
  ON public.team_join_requests FOR UPDATE
  TO authenticated
  USING (public.is_current_user_team_admin(team_join_requests.team_id))
  WITH CHECK (status IN ('approved', 'rejected'));


-- ============================================================
-- 10. public.notifications
--     In-app notifications for team events.
-- ============================================================

CREATE TABLE public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN (
    'join_request',
    'request_approved',
    'request_rejected',
    'team_deleted',
    'member_kicked',
    'member_left'
  )),
  message    TEXT        NOT NULL,
  link       TEXT,
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX notifications_user_unread_idx
  ON public.notifications (user_id, created_at DESC)
  WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ============================================================
-- 11. Notification expiry function
--     Deletes notifications older than 30 days.
--     Called daily by /api/cron/expire-notifications.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_expired_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.notifications
    WHERE created_at < NOW() - INTERVAL '30 days'
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;
  RETURN deleted_count;
END;
$$;


-- ============================================================
-- 12. Real-time
--     Enable postgres_changes subscriptions on tables used by
--     the live dashboard and notification bell.
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.intake_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.opt_outs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_goal_overrides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.team_join_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

ALTER TABLE public.teams REPLICA IDENTITY FULL;
ALTER TABLE public.intake_logs REPLICA IDENTITY FULL;
ALTER TABLE public.opt_outs REPLICA IDENTITY FULL;
ALTER TABLE public.users REPLICA IDENTITY FULL;
ALTER TABLE public.daily_goal_overrides REPLICA IDENTITY FULL;
ALTER TABLE public.team_join_requests REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
