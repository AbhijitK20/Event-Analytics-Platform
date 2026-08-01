-- Fix: Remove the owner_id IS NULL clause from DELETE policy
-- This was a data migration artifact that allows any authenticated user
-- to delete orphaned events, which is a security risk.

-- Drop the old policy
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;

-- Recreate without the owner_id IS NULL gap
CREATE POLICY "Users can delete own events" ON public.events
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Add composite index for owner-scoped queries (dashboard performance)
CREATE INDEX IF NOT EXISTS idx_events_owner_created
  ON public.events (owner_id, created_at DESC);

-- Add composite index for user_id queries (drill-down performance)
CREATE INDEX IF NOT EXISTS idx_events_userid_created
  ON public.events (user_id, created_at DESC);
