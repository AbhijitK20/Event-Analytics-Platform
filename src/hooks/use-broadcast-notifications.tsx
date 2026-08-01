import { useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Zap, CheckCircle2, Ban, CreditCard, XCircle, Navigation } from "lucide-react";

type EventPayload = {
  event_type: string;
  user_id: string;
  city?: string;
  fare?: number;
};

const EVENT_TOASTS: Record<string, { title: string; icon: React.ReactNode; color: string }> = {
  ride_requested: {
    title: "New ride requested",
    icon: <Zap className="size-4" />,
    color: "text-sky-400",
  },
  driver_assigned: {
    title: "Driver assigned",
    icon: <Navigation className="size-4" />,
    color: "text-violet-400",
  },
  ride_started: {
    title: "Ride started",
    icon: <Zap className="size-4" />,
    color: "text-amber-400",
  },
  ride_completed: {
    title: "Ride completed",
    icon: <CheckCircle2 className="size-4" />,
    color: "text-emerald-400",
  },
  ride_cancelled: {
    title: "Ride cancelled",
    icon: <XCircle className="size-4" />,
    color: "text-rose-400",
  },
  payment_success: {
    title: "Payment received",
    icon: <CreditCard className="size-4" />,
    color: "text-lime-400",
  },
  payment_failed: {
    title: "Payment failed",
    icon: <Ban className="size-4" />,
    color: "text-red-400",
  },
};

const CHANNEL_NAME = "ride-notifications";

export function useBroadcastNotifications() {
  useEffect(() => {
    const channel = supabase
      .channel(CHANNEL_NAME)
      .on("broadcast", { event: "new_event" }, ({ payload }) => {
        const p = payload as EventPayload;
        const config = EVENT_TOASTS[p.event_type];
        const label = config?.title ?? p.event_type.replace(/_/g, " ");
        const detail = [p.city, p.user_id, p.fare ? `$${p.fare}` : ""].filter(Boolean).join(" · ");

        toast(label, {
          description: detail || undefined,
          icon: config?.icon,
          className: "text-xs",
          duration: 4000,
        });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);
}

export function useBroadcastSender() {
  const broadcastEvent = useCallback(async (event: EventPayload) => {
    const channel = supabase.channel(CHANNEL_NAME);
    await channel.send({
      type: "broadcast",
      event: "new_event",
      payload: event,
    });
  }, []);

  return { broadcastEvent };
}
