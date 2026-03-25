-- Cleanup: Remove the old INSERT policy now that all code uses opted_out_by.
-- Run this AFTER deploying the code that includes opted_out_by in all inserts.
DROP POLICY IF EXISTS "Users can insert own opt_out" ON public.opt_outs;
