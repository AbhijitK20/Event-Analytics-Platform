import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type PresenceState = {
  user_id: string;
  name: string;
  page: string;
  online_at: string;
};

const CHANNEL_NAME = "dashboard-presence";

export function usePresence(userName: string, page: string) {
  const [onlineCount, setOnlineCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const ch = supabase.channel(CHANNEL_NAME);

    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<PresenceState>();
      const users = Object.values(state).flat();
      setOnlineUsers(users);
      setOnlineCount(users.length);
    });

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({
          user_id: `user_${Date.now()}`,
          name: userName,
          page,
          online_at: new Date().toISOString(),
        });
      }
    });

    setChannel(ch);

    return () => {
      void supabase.removeChannel(ch);
    };
  }, [userName, page]);

  const updatePage = useCallback(
    async (newPage: string) => {
      if (!channel) return;
      await channel.track({
        user_id: `user_${Date.now()}`,
        name: userName,
        page: newPage,
        online_at: new Date().toISOString(),
      });
    },
    [channel, userName],
  );

  return { onlineCount, onlineUsers, updatePage };
}
