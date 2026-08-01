import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Send, Shuffle, Sparkles, Trash2, Zap, Clock, ChevronRight, Play } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  EVENT_TYPES,
  EVENT_COLORS,
  clearEvents,
  fetchEvents,
  resolveRange,
  ingestEvents,
} from "@/lib/events";
import {
  buildMetadata,
  buildPresets,
  buildSampleEvents,
  type PresetEvent,
} from "@/features/simulator/metadata";
import { useBroadcastSender } from "@/hooks/use-broadcast-notifications";

export const Route = createFileRoute("/_authenticated/simulator")({
  head: () => ({
    meta: [
      { title: "Event Simulator — Kamel Ride Event Analytics" },
      {
        name: "description",
        content:
          "Generate synthetic ride events and push them through the Kamel ingestion pipeline.",
      },
      { property: "og:title", content: "Event Simulator — Kamel Ride Event Analytics" },
      {
        property: "og:description",
        content:
          "Generate synthetic ride events and push them through the Kamel ingestion pipeline.",
      },
    ],
  }),
  component: Simulator,
});

type FeedItem = {
  id: string;
  event_type: string;
  user_id: string;
  time: string;
  city?: string;
};

function LiveFeed({ events }: { events: FeedItem[] }) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [events.length]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          Live feed
        </span>
      </div>
      <div
        ref={feedRef}
        className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin"
        style={{ maxHeight: 320 }}
      >
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground/60 py-8">
            No events yet. Generate or send one to see it appear here.
          </div>
        ) : (
          events.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-2.5 rounded-lg border border-border/30 bg-muted/20 px-3 py-2 animate-fade-in-up transition-colors hover:bg-muted/40"
            >
              <Badge
                variant="outline"
                className={`text-[9px] font-semibold border shrink-0 ${EVENT_COLORS[e.event_type]?.badge ?? ""}`}
              >
                {e.event_type.replace(/_/g, " ")}
              </Badge>
              <span className="text-[11px] text-muted-foreground font-mono truncate">
                {e.user_id}
              </span>
              {e.city && (
                <span className="text-[10px] text-muted-foreground/60 ml-auto truncate">
                  {e.city}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground/50 tabular-nums ml-auto whitespace-nowrap flex items-center gap-1">
                <Clock className="size-2.5" />
                {e.time}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Simulator() {
  const queryClient = useQueryClient();
  const [eventType, setEventType] = useState<string>(EVENT_TYPES[0]);
  const [userId, setUserId] = useState("user_001");
  const [metadata, setMetadata] = useState(() => JSON.stringify(buildMetadata(), null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["events"] });
  const { broadcastEvent } = useBroadcastSender();

  const recentEventsQuery = useQuery({
    queryKey: ["events", "simulator-feed"],
    queryFn: () => fetchEvents(resolveRange("today"), 20),
    refetchInterval: 5000,
  });

  const presets = useMemo(() => buildPresets(), []);

  const addFeedItem = (event_type: string, user_id: string, city?: string) => {
    const item: FeedItem = {
      id: `${Date.now()}-${Math.random()}`,
      event_type,
      user_id,
      time: new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      city,
    };
    setFeedItems((prev) => [item, ...prev].slice(0, 15));
  };

  const single = useMutation({
    mutationFn: async () => {
      if (!userId.trim()) throw new Error("User id is required");
      let parsed: Record<string, unknown> = {};
      const raw = metadata.trim();
      if (raw) {
        try {
          parsed = JSON.parse(raw);
        } catch {
          throw new Error("Metadata must be valid JSON");
        }
        if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
          throw new Error("Metadata must be a JSON object");
        }
      }
      return ingestEvents([{ event_type: eventType, user_id: userId.trim(), metadata: parsed }]);
    },
    onSuccess: () => {
      toast.success("Event ingested", { description: `${eventType} → ${userId}` });
      const city = (() => {
        try {
          return JSON.parse(metadata).city as string | undefined;
        } catch {
          return undefined;
        }
      })();
      addFeedItem(eventType, userId, city);
      broadcastEvent({
        event_type: eventType,
        user_id: userId,
        city,
        fare: (() => {
          try {
            return JSON.parse(metadata).fare as number | undefined;
          } catch {
            return undefined;
          }
        })(),
      });
      invalidate();
    },
    onError: (e: Error) => toast.error("Ingestion failed", { description: e.message }),
  });

  const presetMutation = useMutation({
    mutationFn: async (preset: PresetEvent) => {
      return ingestEvents([
        { event_type: preset.event_type, user_id: preset.user_id, metadata: preset.metadata },
      ]);
    },
    onSuccess: (_n, preset) => {
      toast.success("Preset event sent", { description: preset.label });
      addFeedItem(preset.event_type, preset.user_id, preset.metadata.city as string | undefined);
      broadcastEvent({
        event_type: preset.event_type,
        user_id: preset.user_id,
        city: preset.metadata.city as string | undefined,
        fare: preset.metadata.fare as number | undefined,
      });
      invalidate();
    },
    onError: (e: Error) => toast.error("Ingestion failed", { description: e.message }),
  });

  const batch = useMutation({
    mutationFn: () => ingestEvents(buildSampleEvents(100)),
    onSuccess: (n) => {
      toast.success(`${n} random events ingested`);
      for (let i = 0; i < Math.min(5, n); i++) {
        const ev = buildSampleEvents(1)[0];
        if (ev) addFeedItem(ev.event_type, ev.user_id, ev.metadata?.city as string | undefined);
      }
      broadcastEvent({ event_type: "ride_requested", user_id: "batch", city: "Multiple cities" });
      invalidate();
    },
    onError: (e: Error) => toast.error("Ingestion failed", { description: e.message }),
  });

  const clear = useMutation({
    mutationFn: clearEvents,
    onSuccess: () => {
      toast.success("Your events were cleared");
      setFeedItems([]);
      invalidate();
    },
    onError: (e: Error) => toast.error("Clear failed", { description: e.message }),
  });

  const recentFeed: FeedItem[] = (recentEventsQuery.data ?? []).slice(0, 10).map((e) => ({
    id: e.id,
    event_type: e.event_type,
    user_id: e.user_id,
    time: new Date(e.created_at).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    city: (e.metadata as Record<string, unknown> | null)?.city as string | undefined,
  }));

  const mergedFeed = [
    ...feedItems,
    ...recentFeed.filter((r) => !feedItems.some((f) => f.id === r.id)),
  ].slice(0, 15);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Event simulator</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Push synthetic ride events into the ingestion pipeline. The dashboard updates in realtime.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Custom Event Form */}
        <Card className="panel-surface lg:col-span-2 animate-fade-in-up stagger-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              Custom event
            </CardTitle>
            <CardDescription>
              Every field maps directly to a row in the events table.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="event-type"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Event type
                </Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger id="event-type" className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        <span className="flex items-center gap-2">
                          <span
                            className={`size-1.5 rounded-full ${EVENT_COLORS[t]?.badge.split(" ")[0] ?? "bg-muted"}`}
                          />
                          {t.replace(/_/g, " ")}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="user-id"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  User id
                </Label>
                <Input
                  id="user-id"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="user_001"
                  className="h-10 font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="metadata"
                  className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
                >
                  Metadata (JSON)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMetadata(JSON.stringify(buildMetadata(), null, 2));
                    setJsonError(null);
                  }}
                  className="h-7 text-xs gap-1.5"
                >
                  <Shuffle className="size-3" /> Randomize
                </Button>
              </div>
              <div className="relative rounded-lg border border-border/60 bg-background/50 overflow-hidden">
                <div className="flex items-center gap-1.5 border-b border-border/40 bg-muted/20 px-3 py-1.5">
                  <span className="size-2 rounded-full bg-rose-500/60" />
                  <span className="size-2 rounded-full bg-amber-500/60" />
                  <span className="size-2 rounded-full bg-emerald-500/60" />
                  <span className="ml-2 text-[10px] text-muted-foreground/50 font-mono">
                    metadata.json
                  </span>
                </div>
                <Textarea
                  id="metadata"
                  rows={10}
                  spellCheck={false}
                  className="font-mono text-xs border-0 rounded-none focus-visible:ring-0 bg-transparent"
                  value={metadata}
                  onChange={(e) => {
                    setMetadata(e.target.value);
                    if (!e.target.value.trim()) return setJsonError(null);
                    try {
                      JSON.parse(e.target.value);
                      setJsonError(null);
                    } catch {
                      setJsonError("Invalid JSON");
                    }
                  }}
                />
              </div>
              {jsonError ? (
                <p className="text-xs text-destructive flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-destructive" />
                  {jsonError}
                </p>
              ) : null}
            </div>

            <Button
              onClick={() => single.mutate()}
              disabled={single.isPending || Boolean(jsonError)}
              className="w-full sm:w-auto gap-2"
            >
              <Send className="size-4" />
              {single.isPending ? "Ingesting…" : "Generate event"}
            </Button>
          </CardContent>
        </Card>

        {/* Live Feed */}
        <Card className="panel-surface h-fit animate-fade-in-up stagger-2">
          <CardContent className="p-4">
            <LiveFeed events={mergedFeed} />
          </CardContent>
        </Card>
      </div>

      {/* Preset Events */}
      <Card className="panel-surface animate-fade-in-up stagger-3">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Play className="size-4 text-primary" />
            Quick presets
          </CardTitle>
          <CardDescription>
            Send a realistic event with one click. Each preset includes a full metadata payload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => presetMutation.mutate(preset)}
                disabled={presetMutation.isPending}
                className="group flex items-center gap-3 rounded-xl border border-border/40 bg-muted/15 p-3.5 text-left transition-all duration-200 hover:bg-primary/[0.04] hover:border-primary/20 hover:shadow-sm disabled:opacity-50"
              >
                <span
                  className={`size-9 rounded-lg flex items-center justify-center flex-shrink-0 ${EVENT_COLORS[preset.event_type]?.badge.split(" ").slice(0, 2).join(" ") ?? "bg-muted"}`}
                >
                  <Zap className="size-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{preset.label}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{preset.description}</p>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Batch Operations */}
      <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-up stagger-4">
        <Card className="panel-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Demo the pipeline
            </CardTitle>
            <CardDescription>
              Insert 100 randomised events across every event type, user and city.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={() => batch.mutate()}
              disabled={batch.isPending}
            >
              <Sparkles className="size-4" />
              {batch.isPending ? "Generating…" : "Generate 100 random events"}
            </Button>
          </CardContent>
        </Card>

        <Card className="panel-surface">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trash2 className="size-4 text-muted-foreground" />
              Danger zone
            </CardTitle>
            <CardDescription>Permanently delete every event you have ingested.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  disabled={clear.isPending}
                >
                  <Trash2 className="size-4" />
                  {clear.isPending ? "Clearing…" : "Clear all events"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear all your events?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes every event you have ingested. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => clear.mutate()}>Clear events</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
