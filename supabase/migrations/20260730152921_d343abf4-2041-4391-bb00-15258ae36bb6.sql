DROP POLICY IF EXISTS "Authenticated can insert events" ON public.events;
DROP POLICY IF EXISTS "Authenticated can delete events" ON public.events;

CREATE POLICY "Users insert their own events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users delete their own events" ON public.events
  FOR DELETE TO authenticated USING (owner_id = auth.uid() OR owner_id IS NULL);

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;