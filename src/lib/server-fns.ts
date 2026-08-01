import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { NewEventSchema, FetchEventsQuerySchema, type ValidatedNewEvent } from "./schemas";

// Rate limiting: simple in-memory tracker
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 500; // max events per window

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    throw new Error(`Rate limit exceeded. Max ${RATE_LIMIT_MAX} events per minute.`);
  }

  entry.count++;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}, 60_000);

async function requireAuth() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Authentication required");
  return data.user;
}

// Simplified event type for serialization (no Record<string, unknown>)
type SerializableEvent = {
  id: string;
  event_type: string;
  user_id: string;
  metadata: Record<string, string | number | boolean | null> | null;
  created_at: string;
};

export const ingestEventsFn = createServerFn({ method: "POST" })
  .validator((input: { events: ValidatedNewEvent[] }) => {
    const validated = input.events.map((e) => NewEventSchema.parse(e));
    if (validated.length === 0) throw new Error("No events to ingest");
    if (validated.length > 500) throw new Error("Max 500 events per request");
    return { events: validated };
  })
  .handler(async ({ data }) => {
    const user = await requireAuth();
    checkRateLimit(user.id);

    const rows = data.events.map((e) => ({
      event_type: e.event_type,
      user_id: e.user_id,
      metadata: (e.metadata ?? {}) as never,
      owner_id: user.id,
    }));

    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await supabase.from("events").insert(rows.slice(i, i + 100));
      if (error) throw new Error(error.message);
    }

    return { count: rows.length };
  });

export const fetchEventsFn = createServerFn({ method: "GET" })
  .validator((input: { from: string; to: string; limit: number }) =>
    FetchEventsQuerySchema.parse(input),
  )
  .handler(async ({ data }): Promise<SerializableEvent[]> => {
    await requireAuth();

    const { data: rows, error } = await supabase
      .from("events")
      .select("id, event_type, user_id, metadata, created_at")
      .gte("created_at", data.from)
      .lte("created_at", data.to)
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (error) throw new Error(error.message);
    return (rows ?? []) as SerializableEvent[];
  });

export const fetchTotalCountFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<number> => {
    await requireAuth();

    const { count, error } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true });

    if (error) throw new Error(error.message);
    return count ?? 0;
  },
);

export const clearEventsFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ deleted: boolean }> => {
    const user = await requireAuth();

    const { error } = await supabase.from("events").delete().eq("owner_id", user.id);

    if (error) throw new Error(error.message);
    return { deleted: true };
  },
);
