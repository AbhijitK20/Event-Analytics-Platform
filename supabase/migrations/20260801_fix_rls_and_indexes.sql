-- Fix: Remove the owner_id IS NULL clause from DELETE policy
-- This was a data migration artifact that allows any authenticated user
-- to delete orphaned events, which is a security risk.

-- Drop the old policies
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;
DROP POLICY IF EXISTS "Authenticated can read events" ON public.events;

-- Recreate DELETE without the owner_id IS NULL gap
CREATE POLICY "Users can delete own events" ON public.events
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Users can ONLY see their own events
CREATE POLICY "Users read own events" ON public.events
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Add composite index for owner-scoped queries (dashboard performance)
CREATE INDEX IF NOT EXISTS idx_events_owner_created
  ON public.events (owner_id, created_at DESC);

-- Add composite index for user_id queries (drill-down performance)
CREATE INDEX IF NOT EXISTS idx_events_userid_created
  ON public.events (user_id, created_at DESC);
