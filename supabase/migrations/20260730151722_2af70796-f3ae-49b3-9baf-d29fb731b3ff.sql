CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  user_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.events TO anon;
GRANT SELECT, INSERT ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public demo can read events" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public demo can insert events" ON public.events FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX events_created_at_idx ON public.events (created_at DESC);
CREATE INDEX events_event_type_idx ON public.events (event_type);
CREATE INDEX events_user_id_idx ON public.events (user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.events;