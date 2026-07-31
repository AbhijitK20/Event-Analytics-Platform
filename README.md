# Kamel Ride — Event Analytics Platform

An internal engineering dashboard for ride events: simulate events, ingest them into Postgres, and watch analytics update in realtime.

## Architecture

```
Simulator UI ──► ingestEvents()  ──►  Postgres (events)
                                        │
                                        ├─ Realtime change stream
                                        ▼
                              React Query cache invalidation
                                        ▼
                                 Dashboard (KPIs, charts, table)
```

- **Frontend**: React 19 + TypeScript, TanStack Start/Router, TanStack Query, Tailwind v4, shadcn/ui, Recharts.
- **Backend**: managed Postgres with Row Level Security, Realtime and Auth (Lovable Cloud, powered by Supabase). No edge functions — the browser client talks to Postgres through the Data API under RLS.
- **Auth**: Google OAuth (managed credentials) plus email/password fallback.

## Folder structure

```
src/
  features/
    auth/         use-auth-user.ts        session + profile hook
    dashboard/    use-analytics.ts        KPI/chart aggregation
                  components.tsx          KPI card, tooltip, empty state
                  events-table.tsx        search + sort + pagination
    simulator/    metadata.ts             realistic metadata + bulk generator
  hooks/          use-realtime-events.ts  realtime subscription
  lib/            events.ts               single ingestion path + fetchers
  routes/
    __root.tsx                 shell, header, avatar menu, toaster
    index.tsx                  public landing page
    auth.tsx                   sign-in / sign-up
    _authenticated/route.tsx   protected gate
    _authenticated/dashboard.tsx
    _authenticated/simulator.tsx
```

## Database schema

`public.events`

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | primary key |
| `event_type` | text | see event types below |
| `user_id` | text | app-level user identifier |
| `metadata` | jsonb | pickup, destination, fare, vehicle_type, city, driver_id |
| `owner_id` | uuid | the signed-in account that ingested the row |
| `created_at` | timestamptz | defaults to `now()` |

Indexes on `created_at`, `event_type`, `user_id`. Realtime replication enabled.

`public.profiles` — `id` (references the auth user), `display_name`, `avatar_url`, timestamps. Rows are created automatically on signup by a trigger.

**RLS**: only signed-in users can read events; users may insert and delete only their own rows (`owner_id = auth.uid()`). Profiles are readable and editable by their owner only.

Event types: `ride_requested`, `driver_assigned`, `driver_arrived`, `ride_started`, `ride_completed`, `ride_cancelled`, `payment_success`, `payment_failed`.

## Setup

```bash
bun install
bun run dev
```

## Environment variables

Provisioned automatically in Lovable. For an external deploy (e.g. Vercel), set:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_PROJECT_ID=
```

Copy the values from the project's `.env`. Never expose the service role key to the client.

## How realtime works

`useRealtimeEvents()` subscribes to `postgres_changes` on `public.events`. Any insert or delete invalidates the `["events"]` React Query keys, so the dashboard refetches immediately. No polling, no manual refresh.

## How authentication works

`/` and `/auth` are public. Everything under `src/routes/_authenticated/` is gated: the layout checks the session client-side and redirects to `/auth` when there is none. Google sign-in uses the managed OAuth broker and returns to the app origin; a trigger creates the profile row on first sign-in. The header renders the avatar, name and sign-out once a session exists.

## How to demo

1. Open the landing page and **Sign in with Google**.
2. Go to **Simulator** → **Generate 100 random events**.
3. Open **Dashboard** — KPIs, charts and the events table populate; switch between Today / 7 days / 30 days / custom range.
4. Back in **Simulator**, submit a custom event and watch the dashboard update live without refreshing.
5. Use **Clear events** to reset your own data.

## Deploying

Connect the project to GitHub from the Lovable top bar, then import the repository into Vercel and add the environment variables above. Alternatively publish directly from Lovable.
