import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Invalidates event queries whenever rows are ingested or removed. */
export function useRealtimeEvents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("events-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, () => {
        queryClient.invalidateQueries({ queryKey: ["events"] });
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
