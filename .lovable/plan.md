## Context

The project already exists with a working ingestion path (`src/lib/events.ts`), a realtime hook, a Dashboard and a Simulator. This plan upgrades it to the full spec rather than rebuilding it.

Connections note: the database, auth and realtime already run on Lovable Cloud (the managed backend) — no separate Supabase connection step is needed. GitHub and Vercel are not something I can connect for you: use the **GitHub** button in the top bar to create/sync the repo, then import that repo in Vercel (or just use Lovable's own Publish). I'll add the env-var list to the README so the Vercel setup is copy-paste.

## 1. Auth (Google)

- Enable the Google provider (managed credentials, no keys needed) and add email/password as a fallback on the same screen.
- New public `/auth` route: branded sign-in card, "Continue with Google", errors via toast.
- New `/` landing page: product pitch + sign-in CTA; redirects signed-in users to `/dashboard`.
- Move Dashboard and Simulator under the protected `_authenticated` layout → `/dashboard`, `/simulator`.
- Header shows avatar, name, and sign-out when signed in.
- `profiles` table (id, display_name, avatar_url) auto-filled on signup by trigger, RLS scoped to the owner.

## 2. Database changes

- Extend event types with `driver_arrived` and `payment_failed`.
- Add `owner_id uuid` to `events` (the signed-in user who ingested it), default from `auth.uid()`.
- Replace the public demo RLS policies with authenticated-only SELECT/INSERT/DELETE (DELETE powers "Clear events"). Existing demo rows stay readable.
- Keep the existing indexes; realtime stays on.

## 3. Simulator

- Add the two new event types to the dropdown.
- Auto-generate realistic metadata: pickup, destination, fare, vehicle type, city, driver id — with a "randomize metadata" button that fills the JSON editor.
- Buttons: Generate event, Generate 100 random events, Clear events (with confirm dialog).
- Still one ingestion function; the bulk generator inserts in chunks.

## 4. Dashboard

- KPI cards: Total Events, Today's Events, Unique Users, Completion Rate, Average Fare, Cancelled %.
- Charts: events over time (area), events by type (bar), top users (bar), top cities (bar).
- Time-range filter: Today / 7d / 30d / custom range, applied to the query and all cards+charts.
- Recent events table: search (type/user/metadata), sortable columns, pagination.
- Skeletons while loading, empty states, error states, toasts.

## 5. Structure & docs

- Group code as `src/features/dashboard/*`, `src/features/simulator/*`, `src/features/auth/*`; shared fetchers stay in `src/lib/events.ts`.
- README rewritten: architecture, folder structure, schema, setup, env vars, realtime, auth, demo script, Vercel notes.

## Technical details

- Data reads go through TanStack Query with a `["events", range]` key; the realtime INSERT/DELETE subscription invalidates that key — no polling.
- Range filtering pushed into the Postgres query (`created_at >= …`) so charts stay accurate beyond the row cap.
- Protected routes use the managed `_authenticated` gate; only `/` and `/auth` stay public.
- Google OAuth `redirect_uri` is the app origin; the landing page routes to `/dashboard` once the session hydrates.
