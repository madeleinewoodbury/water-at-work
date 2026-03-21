-- Reset script for development
-- Clears all app data. Run in the Supabase SQL Editor.
--
-- Note: auth.users cannot be deleted via SQL in most Supabase setups.
-- Use the seed script (npx tsx scripts/seed.ts) which calls
-- supabase.auth.admin.deleteUser() to fully reset, including auth users.
-- The CASCADE constraints on public.users and intake_logs will auto-clean
-- app data when auth users are deleted.

-- If you just need to clear app data without touching auth:
DELETE FROM public.intake_logs;

-- Reset display names and goals to defaults:
UPDATE public.users SET display_name = NULL, daily_goal = 32;
