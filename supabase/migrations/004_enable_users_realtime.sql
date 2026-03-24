-- Enable real-time for users table
-- Allows dashboard clients to receive live updates when a user changes
-- their display_name, daily_goal, or avatar_url.
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

-- Match the convention used for intake_logs and opt_outs.
-- Ensures full row data is available in change events.
ALTER TABLE public.users REPLICA IDENTITY FULL;
