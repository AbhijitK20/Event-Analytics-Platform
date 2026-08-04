# Kamel Ride — Realtime Event Analytics Platform

A full-stack realtime ride event ingestion, simulation, and analytics dashboard built with React 19, TanStack Start, Supabase, and Recharts.

## Architecture

```
Simulator UI ──► ingestEvents() ──► Postgres (events table)
                                          │
                                          ├─ Realtime change stream
                                          ├─ Audit log triggers
                                          ├─ Row Level Security (owner_id = auth.uid())
                                          ▼
                                React Query cache invalidation
                                          ▼
                                   Dashboard (KPIs, charts, map, table)

External Systems ──► Webhook Edge Function ──► Postgres (events)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | TanStack Start (React 19 SSR) |
| **Styling** | Tailwind CSS v4 with custom oklch design tokens |
| **UI Components** | shadcn/ui (new-york style) |
| **Database** | Supabase (Postgres + Realtime) |
| **Charts** | Recharts |
| **Language** | TypeScript (strict mode) |
| **Auth** | Supabase Auth (Google OAuth + email/password) |
| **Testing** | Vitest |
| **CI/CD** | GitHub Actions |
| **Deploy** | Vercel |

## Setup

```bash
npm install
npm run dev
```

## Environment Variables

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_PROJECT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

Copy values from `.env`. Never expose the service role key to the client.

## Features

### Authentication
- **Google OAuth** — one-click sign in
- **Email/Password** — create account with email confirmation
- **Forgot Password** — reset via email link

### Realtime Dashboard
- **6 KPI Cards** — total events, today's events, unique users, completion rate, average fare, cancelled %
- **Events Over Time** — area chart with hourly/daily buckets
- **Top Users & Cities** — horizontal bar charts (click to drill-down)
- **Events by Type** — donut chart with hover-expand
- **City Map** — interactive bubble map of event density
- **Alert Rules** — configurable threshold-based alerts (cancellation rate, payment failures)
- **Quick Start** — one-click sample data generation for new users
- **PDF Export** — download dashboard report

### Event Simulator
- **Custom Events** — select event type, user ID, JSON metadata
- **6 Quick Presets** — one-click realistic events
- **4 Scenarios** — Happy Ride, Ride Cancelled, Payment Failed, No Show (chain events with delays)
- **Batch Generate** — 100 random events
- **Live Feed** — real-time event stream
- **Danger Zone** — clear all events

### Webhook Endpoint
- **Supabase Edge Function** — external systems push events via POST
- **HMAC Verification** — shared secret authentication
- **Batch Support** — up to 500 events per request
- **Payload Validation** — Zod schema validation

### Audit Log
- **Event Mutation Tracking** — every INSERT/DELETE logged via triggers
- **Searchable & Filterable** — filter by action type, search by event type/user
- **Replay** — re-ingest any past event

### Security
- **Row Level Security** — users only see their own events
- **CSP Headers** — Content Security Policy, X-Frame-Options, X-Content-Type-Options
- **CSRF Protection** — TanStack Start CSRF middleware
- **Rate Limiting** — max 500 events per minute per user
- **Input Validation** — Zod schemas on data boundaries

### UX & Design
- **Dark/Light Theme** — toggle with localStorage persistence
- **Micro-interactions** — button press feedback, card hover glow, chart animations
- **Skeleton Loading** — shimmer sweep placeholders
- **Debounced Search** — 300ms debounce on events table
- **Error Boundaries** — per-section error isolation

## Database Schema

### `events`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| event_type | text | Event type (8 possible values) |
| user_id | text | User identifier |
| metadata | jsonb | Event metadata (fare, city, vehicle, etc.) |
| owner_id | uuid | Auth user who created the event |
| created_at | timestamptz | Timestamp |

### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | FK to auth.users |
| display_name | text | User's display name |
| avatar_url | text | Profile picture URL |

### `event_audit_log`
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| event_id | uuid | Reference to events table |
| action | text | 'insert' or 'delete' |
| event_type | text | Event type |
| snapshot | jsonb | Full event data at time of mutation |
| created_at | timestamptz | Timestamp |

**Event types:** `ride_requested`, `driver_assigned`, `driver_arrived`, `ride_started`, `ride_completed`, `ride_cancelled`, `payment_success`, `payment_failed`

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run check        # Run all checks (knip + depcheck + tsc)
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Vitest
```

## Testing

```bash
npm run test         # Run all tests
npm run test:watch   # Watch mode
```

63 unit tests across 6 test files covering:
- Event utilities (resolveRange, EVENT_TYPES, EVENT_COLORS)
- Zod validation schemas
- Simulator metadata generation
- Alert rules evaluation
- Error capture system

## CI/CD

GitHub Actions pipeline runs on every push/PR:
1. Lint (ESLint)
2. Type check (TypeScript)
3. Tests (Vitest)
4. Build (Vite)

## Deploy

1. Push to GitHub
2. Import into Vercel
3. Add environment variables
4. Deploy

### Webhook Edge Function

```bash
npx supabase functions deploy ingest-webhook
```

### Database Migrations

Apply SQL from `supabase/migrations/` via the Supabase Dashboard SQL Editor.

## Demo

1. Sign in with Google or create an account
2. Dashboard shows Quick Start → click "Generate 50 sample events"
3. Go to Simulator → try custom events, presets, and scenarios
4. Check the Audit Log for event mutation history
5. Click "PDF" to export a dashboard report
6. Toggle light/dark theme
7. Export events as CSV from the dashboard table
