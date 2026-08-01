import { supabase } from "@/integrations/supabase/client";

export default async function handler() {
  const start = Date.now();

  try {
    const { error } = await supabase.from("events").select("id", { count: "exact", head: true });
    const latency = Date.now() - start;

    if (error) {
      return Response.json(
        {
          status: "degraded",
          supabase: { status: "error", message: error.message, latencyMs: latency },
          timestamp: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    return Response.json({
      status: "healthy",
      supabase: { status: "connected", latencyMs: latency },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return Response.json(
      {
        status: "unhealthy",
        supabase: { status: "error", message: (err as Error).message },
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
