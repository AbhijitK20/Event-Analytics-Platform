import { supabase } from "@/integrations/supabase/client";
import { ingestEventsFn, fetchEventsFn, fetchTotalCountFn, clearEventsFn } from "./server-fns";
import { NewEventSchema } from "./schemas";

export const EVENT_TYPES = [
  "ride_requested",
  "driver_assigned",
  "driver_arrived",
  "ride_started",
  "ride_completed",
  "ride_cancelled",
  "payment_success",
  "payment_failed",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_COLORS: Record<string, { badge: string; hex: string }> = {
  ride_requested: { badge: "bg-sky-500/15 text-sky-400 border-sky-500/20", hex: "#38bdf8" },
  driver_assigned: {
    badge: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    hex: "#a78bfa",
  },
  driver_arrived: { badge: "bg-blue-500/15 text-blue-400 border-blue-500/20", hex: "#60a5fa" },
  ride_started: { badge: "bg-amber-500/15 text-amber-400 border-amber-500/20", hex: "#fbbf24" },
  ride_completed: {
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    hex: "#34d399",
  },
  ride_cancelled: { badge: "bg-rose-500/15 text-rose-400 border-rose-500/20", hex: "#fb7185" },
  payment_success: { badge: "bg-lime-500/15 text-lime-400 border-lime-500/20", hex: "#a3e635" },
  payment_failed: { badge: "bg-red-500/15 text-red-400 border-red-500/20", hex: "#f87171" },
};

export type RideEvent = {
  id: string;
  event_type: string;
  user_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type NewEvent = {
  event_type: string;
  user_id: string;
  metadata?: Record<string, unknown>;
};

export type RangeKey = "today" | "7d" | "30d" | "custom";

export type DateRange = { from: Date; to: Date };

export function resolveRange(key: RangeKey, custom?: Partial<DateRange>): DateRange {
  const to = new Date();
  if (key === "custom" && custom?.from) {
    return { from: custom.from, to: custom.to ?? to };
  }
  const from = new Date();
  if (key === "today") from.setHours(0, 0, 0, 0);
  if (key === "7d") from.setDate(from.getDate() - 7);
  if (key === "30d") from.setDate(from.getDate() - 30);
  return { from, to };
}

/** Single ingestion path: every event in the app goes through here. */
export async function ingestEvents(events: NewEvent[]) {
  // Validate each event against Zod schema
  const validated = events.map((e) => NewEventSchema.parse(e));
  const result = await ingestEventsFn({ data: { events: validated } });
  return result.count;
}

export async function clearEvents() {
  await clearEventsFn({ data: undefined });
}

export async function fetchEvents(range: DateRange, limit = 2000): Promise<RideEvent[]> {
  const result = await fetchEventsFn({
    data: {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      limit,
    },
  });
  return result as unknown as RideEvent[];
}

export async function fetchTotalCount(): Promise<number> {
  return fetchTotalCountFn({ data: undefined });
}
