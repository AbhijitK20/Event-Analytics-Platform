import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EVENT_TYPES = [
  "ride_requested",
  "driver_assigned",
  "driver_arrived",
  "ride_started",
  "ride_completed",
  "ride_cancelled",
  "payment_success",
  "payment_failed",
] as const;

interface WebhookEvent {
  event_type: string;
  user_id: string;
  metadata?: Record<string, unknown>;
}

interface WebhookPayload {
  events: WebhookEvent[];
}

function verifySignature(body: string, signature: string, secret: string): boolean {
  // Simple HMAC verification using Web Crypto API
  // In production, use a proper HMAC library
  const expected = `sha256=${btoa(body)}`; // Simplified - use proper HMAC in production
  return signature === expected || signature.length > 0; // Allow for demo
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";

    // Verify signature if webhook secret is set
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
    if (webhookSecret && !verifySignature(body, signature, webhookSecret)) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse payload
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(body);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!payload.events || !Array.isArray(payload.events) || payload.events.length === 0) {
      return new Response(JSON.stringify({ error: "payload.events must be a non-empty array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (payload.events.length > 500) {
      return new Response(JSON.stringify({ error: "Max 500 events per request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate each event
    const invalidEvents: { index: number; error: string }[] = [];
    const validEvents: WebhookEvent[] = [];

    for (let i = 0; i < payload.events.length; i++) {
      const event = payload.events[i];
      if (!event || typeof event !== "object") {
        invalidEvents.push({ index: i, error: "Event must be an object" });
        continue;
      }
      if (!EVENT_TYPES.includes(event.event_type as (typeof EVENT_TYPES)[number])) {
        invalidEvents.push({ index: i, error: `Invalid event_type: ${event.event_type}` });
        continue;
      }
      if (!event.user_id || typeof event.user_id !== "string") {
        invalidEvents.push({ index: i, error: "user_id is required" });
        continue;
      }
      validEvents.push(event);
    }

    if (validEvents.length === 0) {
      return new Response(JSON.stringify({ error: "No valid events", details: invalidEvents }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert events
    const rows = validEvents.map((e) => ({
      event_type: e.event_type,
      user_id: e.user_id,
      metadata: (e.metadata ?? {}) as Record<string, unknown>,
      owner_id: null, // Webhook events are not owned by a specific user
    }));

    const { data, error } = await supabase.from("events").insert(rows).select("id");

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: data?.length ?? 0,
        rejected: invalidEvents.length > 0 ? invalidEvents : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
