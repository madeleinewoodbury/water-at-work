-- Adds a function to delete notifications older than 30 days.
-- Called daily by the /api/cron/expire-notifications route.
-- CREATE OR REPLACE is idempotent — safe to run on a live database.

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
