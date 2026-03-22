-- Enable real-time for intake_logs and opt_outs
ALTER publication supabase_realtime ADD TABLE public.intake_logs;
ALTER publication supabase_realtime ADD TABLE public.opt_outs;

-- Include full row data in DELETE events (needed to identify user_id)
ALTER TABLE public.intake_logs REPLICA IDENTITY FULL;
ALTER TABLE public.opt_outs REPLICA IDENTITY FULL;
