-- Migration 016: Block direct authenticated self-updates to membership fields.
-- This prevents users from escalating privileges by writing users.team_id/team_role
-- directly through the client API. Trusted server/service-role paths remain allowed.

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

DROP TRIGGER IF EXISTS users_block_membership_self_update ON public.users;

CREATE TRIGGER users_block_membership_self_update
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_authenticated_membership_self_update();
