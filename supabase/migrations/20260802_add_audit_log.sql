-- Audit log table for tracking all event mutations
CREATE TABLE IF NOT EXISTS public.event_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid,
  action text NOT NULL CHECK (action IN ('insert', 'delete')),
  event_type text,
  user_id text,
  owner_id uuid,
  snapshot jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.event_audit_log TO authenticated;
GRANT ALL ON public.event_audit_log TO service_role;

ALTER TABLE public.event_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own audit logs" ON public.event_audit_log
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "System can insert audit logs" ON public.event_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_audit_log_owner_created
  ON public.event_audit_log (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_event_id
  ON public.event_audit_log (event_id);

-- Trigger function to log inserts
CREATE OR REPLACE FUNCTION public.log_event_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.event_audit_log (event_id, action, event_type, user_id, owner_id, snapshot)
  VALUES (NEW.id, 'insert', NEW.event_type, NEW.user_id, NEW.owner_id, to_jsonb(NEW));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger function to log deletes
CREATE OR REPLACE FUNCTION public.log_event_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.event_audit_log (event_id, action, event_type, user_id, owner_id, snapshot)
  VALUES (OLD.id, 'delete', OLD.event_type, OLD.user_id, OLD.owner_id, to_jsonb(OLD));
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS audit_event_insert ON public.events;
DROP TRIGGER IF EXISTS audit_event_delete ON public.events;

-- Create triggers
CREATE TRIGGER audit_event_insert
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.log_event_insert();

CREATE TRIGGER audit_event_delete
  AFTER DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.log_event_delete();
