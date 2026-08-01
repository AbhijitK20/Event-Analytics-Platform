# AGENTS.md

## Project Overview

Kamel Ride Event Analytics Platform — a realtime ride event ingestion, simulation, and analytics dashboard.

## Tech Stack

- **Framework:** TanStack Start (React 19 SSR)
- **Styling:** Tailwind CSS v4 with custom oklch design tokens
- **UI:** shadcn/ui (new-york style)
- **Database:** Supabase (Postgres + Realtime)
- **Charts:** Recharts
- **Language:** TypeScript (strict mode)

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run check        # Run all checks (knip + depcheck + tsc)
npm run lint         # ESLint
npm run format       # Prettier
```

## Architecture

- `src/routes/` — File-based routes (TanStack Router)
- `src/features/` — Feature modules (auth, dashboard, simulator)
- `src/hooks/` — Shared React hooks (realtime, broadcast, presence)
- `src/components/ui/` — shadcn/ui components
- `src/integrations/supabase/` — Supabase client + auth middleware
- `src/lib/` — Utilities and shared logic

## Testing

Use `agent-browser` for browser automation testing:

```bash
npm run browse  # Opens browser
npx agent-browser snapshot  # Get accessibility tree
npx agent-browser screenshot  # Take screenshot
```
