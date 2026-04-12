-- Migration 017: Harden opt_out INSERT policy.
-- Self opt-outs are still allowed through authenticated client writes.
-- Team opt-outs are now server-enforced via trusted backend logic,
-- preventing direct client API bypasses.

DROP POLICY IF EXISTS "Users can insert opt_out as actor" ON public.opt_outs;
DROP POLICY IF EXISTS "Users can insert own opt_out" ON public.opt_outs;

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
