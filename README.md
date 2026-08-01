# Kamel Ride — Event Analytics Platform

A realtime ride event ingestion, simulation, and analytics dashboard.

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

- **Frontend**: React 19 + TypeScript, TanStack Start/Router, TanStack Query, Tailwind v4, shadcn/ui, Recharts
- **Backend**: Supabase (Postgres + Realtime + Auth) with Row Level Security
- **Auth**: Google OAuth + email/password
- **Deploy**: Vercel (Nitro preset)

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

Copy values from `.env`. Never expose the service role key to the client.

## Features

- **Event Simulator** — generate synthetic ride events (single, batch, presets)
- **Realtime Dashboard** — KPIs, charts, events table, all updating live
- **Broadcast Notifications** — toast notifications when events are ingested
- **Presence Tracking** — shows how many users are online
- **Light/Dark Theme** — toggle with localStorage persistence
- **CSV Export** — download filtered events
- **Google OAuth + Email/Password** authentication

## Database Schema

`public.events` — id, event_type, user_id, metadata (jsonb), owner_id, created_at

Event types: `ride_requested`, `driver_assigned`, `driver_arrived`, `ride_started`, `ride_completed`, `ride_cancelled`, `payment_success`, `payment_failed`

## Deploy

1. Push to GitHub
2. Import into Vercel
3. Add environment variables
4. Deploy

## Demo

1. Sign in with Google or email
2. Go to Simulator → Generate 100 random events
3. Watch the Dashboard update in realtime
4. Try the presets and custom events
5. Toggle light/dark theme
6. Export events as CSV
