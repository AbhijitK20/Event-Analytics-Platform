import { useMemo } from "react";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Navigation,
  XCircle,
  Zap,
  Ban,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { EVENT_COLORS, type RideEvent } from "@/lib/events";

const LIFECYCLE_ORDER = [
  "ride_requested",
  "driver_assigned",
  "driver_arrived",
  "ride_started",
  "ride_completed",
] as const;

const LIFECYCLE_ICONS: Record<string, React.ReactNode> = {
  ride_requested: <Zap className="size-4" />,
  driver_assigned: <Navigation className="size-4" />,
  driver_arrived: <MapPin className="size-4" />,
  ride_started: <Clock className="size-4" />,
  ride_completed: <CheckCircle2 className="size-4" />,
  ride_cancelled: <XCircle className="size-4" />,
  payment_success: <CreditCard className="size-4" />,
  payment_failed: <Ban className="size-4" />,
};

function MetadataEntry({
  label,
  value,
  index = 0,
}: {
  label: string;
  value: unknown;
  index?: number;
}) {
  if (value === null || value === undefined || value === "") return null;
  const display = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
  return (
    <div
      className="flex flex-col gap-1 animate-slide-in-left"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
        {label}
      </span>
      <span className="text-sm font-mono text-foreground/90 break-all">{display}</span>
    </div>
  );
}

function RideLifecycle({ events }: { events: RideEvent[] }) {
  const lifecycleEvents = useMemo(() => {
    const sorted = [...events].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return sorted.filter((e) => [...LIFECYCLE_ORDER, "ride_cancelled"].includes(e.event_type));
  }, [events]);

  if (lifecycleEvents.length === 0) return null;

  const completedSteps = new Set(lifecycleEvents.map((e) => e.event_type));
  const wasCancelled = completedSteps.has("ride_cancelled");

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Ride Lifecycle
      </h4>
      <div className="relative ml-2">
        {/* Animated vertical progress line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border/60" />
        <div
          className="absolute left-[7px] top-2 w-px bg-gradient-to-b from-emerald-500 to-primary transition-all duration-700 ease-out"
          style={{
            height: `${Math.min(100, (completedSteps.size / LIFECYCLE_ORDER.length) * 100)}%`,
          }}
        />

        <div className="space-y-3">
          {LIFECYCLE_ORDER.map((step, i) => {
            const event = lifecycleEvents.find((e) => e.event_type === step);
            const isCompleted = completedSteps.has(step);
            const isCurrent =
              isCompleted && !completedSteps.has(LIFECYCLE_ORDER[i + 1] ?? "") && !wasCancelled;

            return (
              <div
                key={step}
                className="flex items-start gap-3 relative animate-slide-in-left"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div
                  className={`size-[15px] rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 transition-all duration-300 ${
                    isCurrent
                      ? "border-primary bg-primary/20 animate-pulse-glow"
                      : isCompleted
                        ? "border-emerald-500 bg-emerald-500/20"
                        : "border-border bg-background"
                  }`}
                >
                  {isCompleted && (
                    <div
                      className={`size-1.5 rounded-full ${
                        isCurrent ? "bg-primary" : "bg-emerald-500"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0 -mt-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        isCompleted ? "text-foreground" : "text-muted-foreground/60"
                      }`}
                    >
                      {step.replace(/_/g, " ")}
                    </span>
                    {LIFECYCLE_ICONS[step] && (
                      <span
                        className={`${isCompleted ? "text-emerald-400" : "text-muted-foreground/30"}`}
                      >
                        {LIFECYCLE_ICONS[step]}
                      </span>
                    )}
                  </div>
                  {event && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {wasCancelled && (
            <div className="flex items-start gap-3 relative">
              <div className="size-[15px] rounded-full border-2 border-rose-500 bg-rose-500/20 flex items-center justify-center flex-shrink-0 z-10">
                <div className="size-1.5 rounded-full bg-rose-500" />
              </div>
              <div className="flex-1 min-w-0 -mt-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-rose-400">ride cancelled</span>
                  <span className="text-rose-400">
                    <XCircle className="size-4" />
                  </span>
                </div>
                {lifecycleEvents.find((e) => e.event_type === "ride_cancelled") && (
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {new Date(
                      lifecycleEvents.find((e) => e.event_type === "ride_cancelled")!.created_at,
                    ).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventDetailSheet({
  event,
  open,
  onOpenChange,
  relatedEvents,
}: {
  event: RideEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relatedEvents: RideEvent[];
}) {
  if (!event) return null;

  const meta = (event.metadata ?? {}) as Record<string, unknown>;
  const metaEntries = Object.entries(meta);
  const colorConfig = EVENT_COLORS[event.event_type];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            {colorConfig && (
              <span
                className="size-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: colorConfig.hex }}
              />
            )}
            <SheetTitle className="text-base">{event.event_type.replace(/_/g, " ")}</SheetTitle>
          </div>
          <SheetDescription className="font-mono text-xs">{event.id}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Core fields */}
          <div className="grid grid-cols-2 gap-4">
            <MetadataEntry label="Event Type" value={event.event_type} />
            <MetadataEntry label="User ID" value={event.user_id} />
            <MetadataEntry label="Timestamp" value={new Date(event.created_at).toLocaleString()} />
            <MetadataEntry
              label="Owner"
              value={(event as Record<string, unknown>).owner_id as string}
            />
          </div>

          <Separator />

          {/* Metadata */}
          {metaEntries.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Metadata
              </h4>
              <div className="grid gap-3">
                {metaEntries.map(([key, val], i) => (
                  <MetadataEntry key={key} label={key} value={val} index={i} />
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Ride Lifecycle */}
          {relatedEvents.length > 0 && <RideLifecycle events={relatedEvents} />}

          {/* Related Events */}
          {relatedEvents.length > 1 && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Related Events ({relatedEvents.length})
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {[...relatedEvents]
                    .sort(
                      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                    )
                    .map((re) => {
                      const reColor = EVENT_COLORS[re.event_type];
                      return (
                        <div
                          key={re.id}
                          className="flex items-center gap-2 rounded-lg border border-border/30 bg-muted/20 px-3 py-2"
                        >
                          {reColor && (
                            <span
                              className="size-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: reColor.hex }}
                            />
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[9px] font-semibold border shrink-0 ${
                              reColor?.badge ?? ""
                            }`}
                          >
                            {re.event_type.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground/60 ml-auto font-mono">
                            {new Date(re.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
