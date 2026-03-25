-- Migration: Add team opt-out support
-- Allows teammates to opt out users who have zero water logged after a cutoff time.
-- The opted_out_by column tracks who initiated the opt-out.

-- 1. Add opted_out_by column (nullable for backward compat with existing rows)
ALTER TABLE public.opt_outs
  ADD COLUMN IF NOT EXISTS opted_out_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Backfill: all existing opt-outs are self-opt-outs
UPDATE public.opt_outs SET opted_out_by = user_id WHERE opted_out_by IS NULL;

-- 3. New INSERT policy: allows inserts where the actor is the authenticated user
--    Works alongside existing "Users can insert own opt_out" policy during transition.
--    Covers both self opt-outs (uid = user_id = opted_out_by)
--    and team opt-outs (uid = opted_out_by, user_id = target).
CREATE POLICY "Users can insert opt_out as actor"
  ON public.opt_outs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = opted_out_by);

-- 4. New DELETE policy: the actor who created the opt-out can undo it.
--    Existing "Users can delete own opt_out" (auth.uid() = user_id) remains,
--    so the subject can always opt themselves back in.
CREATE POLICY "Actor can delete opt_out they created"
  ON public.opt_outs FOR DELETE
  TO authenticated
  USING (auth.uid() = opted_out_by);
