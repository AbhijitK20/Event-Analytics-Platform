import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, RotateCcw, Plus, Trash2, ChevronRight, Zap, Clock } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EVENT_TYPES, EVENT_COLORS, ingestEvents } from "@/lib/events";
import { buildMetadata } from "@/features/simulator/metadata";
import { useBroadcastSender } from "@/hooks/use-broadcast-notifications";

type ScenarioStep = {
  id: string;
  event_type: string;
  delay_ms: number;
};

type ScenarioPreset = {
  name: string;
  description: string;
  steps: Omit<ScenarioStep, "id">[];
};

const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    name: "Happy Ride",
    description: "Complete ride lifecycle with payment",
    steps: [
      { event_type: "ride_requested", delay_ms: 0 },
      { event_type: "driver_assigned", delay_ms: 1500 },
      { event_type: "driver_arrived", delay_ms: 3000 },
      { event_type: "ride_started", delay_ms: 1000 },
      { event_type: "ride_completed", delay_ms: 5000 },
      { event_type: "payment_success", delay_ms: 500 },
    ],
  },
  {
    name: "Ride Cancelled",
    description: "Ride cancelled by rider before pickup",
    steps: [
      { event_type: "ride_requested", delay_ms: 0 },
      { event_type: "driver_assigned", delay_ms: 1500 },
      { event_type: "ride_cancelled", delay_ms: 2000 },
    ],
  },
  {
    name: "Payment Failed",
    description: "Ride completes but payment fails",
    steps: [
      { event_type: "ride_requested", delay_ms: 0 },
      { event_type: "driver_assigned", delay_ms: 1000 },
      { event_type: "driver_arrived", delay_ms: 2000 },
      { event_type: "ride_started", delay_ms: 1000 },
      { event_type: "ride_completed", delay_ms: 4000 },
      { event_type: "payment_failed", delay_ms: 500 },
    ],
  },
  {
    name: "No Show",
    description: "Driver arrives but rider never shows",
    steps: [
      { event_type: "ride_requested", delay_ms: 0 },
      { event_type: "driver_assigned", delay_ms: 1500 },
      { event_type: "driver_arrived", delay_ms: 3000 },
      { event_type: "ride_cancelled", delay_ms: 5000 },
    ],
  },
];

let stepId = 0;
function makeStep(event_type: string, delay_ms: number): ScenarioStep {
  return { id: `step-${++stepId}`, event_type, delay_ms };
}

export function ScenarioBuilder({
  onEventSent,
}: {
  onEventSent?: (event_type: string, user_id: string, city?: string) => void;
}) {
  const [steps, setSteps] = useState<ScenarioStep[]>([]);
  const [userId, setUserId] = useState("user_001");
  const [running, setRunning] = useState(false);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const abortRef = useRef(false);
  const { broadcastEvent } = useBroadcastSender();

  const addStep = (event_type?: string) => {
    setSteps((prev) => [...prev, makeStep(event_type ?? EVENT_TYPES[0], 1000)]);
  };

  const removeStep = (id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  };

  const updateStep = (id: string, patch: Partial<ScenarioStep>) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const loadPreset = (preset: ScenarioPreset) => {
    setSteps(preset.steps.map((s) => makeStep(s.event_type, s.delay_ms)));
  };

  const runScenario = useCallback(async () => {
    if (steps.length === 0 || running) return;
    setRunning(true);
    abortRef.current = false;
    const meta = buildMetadata();

    for (let i = 0; i < steps.length; i++) {
      if (abortRef.current) break;
      setCurrentStepIdx(i);
      const step = steps[i];
      if (!step) break;

      if (step.delay_ms > 0 && i > 0) {
        await new Promise((resolve) => setTimeout(resolve, step.delay_ms));
        if (abortRef.current) break;
      }

      try {
        await ingestEvents([
          {
            event_type: step.event_type,
            user_id: userId,
            metadata: { ...meta, step_index: i, total_steps: steps.length },
          },
        ]);
        const city = meta.city as string | undefined;
        broadcastEvent({
          event_type: step.event_type,
          user_id: userId,
          city,
          fare: meta.fare as number | undefined,
        });
        onEventSent?.(step.event_type, userId, city);
      } catch (e) {
        toast.error("Scenario step failed", { description: (e as Error).message });
        break;
      }
    }

    setRunning(false);
    setCurrentStepIdx(-1);
  }, [steps, running, userId, broadcastEvent, onEventSent]);

  const stop = () => {
    abortRef.current = true;
    setRunning(false);
    setCurrentStepIdx(-1);
  };

  const reset = () => {
    stop();
    setSteps([]);
  };

  return (
    <Card className="panel-surface animate-fade-in-up stagger-3">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Play className="size-4 text-primary" />
          Scenario Builder
        </CardTitle>
        <CardDescription>
          Chain events into sequences with configurable delays. Each step is sent in order.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Presets */}
        <div className="space-y-2">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Quick scenarios
          </Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => loadPreset(preset)}
                disabled={running}
                className="group flex items-center gap-3 rounded-xl border border-border/40 bg-muted/15 p-3 text-left transition-all duration-200 hover:bg-primary/[0.04] hover:border-primary/20 disabled:opacity-50"
              >
                <span className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary flex-shrink-0">
                  <Zap className="size-3.5" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{preset.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{preset.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/50">
                  {preset.steps.length} steps
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Steps ({steps.length})
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-[10px] text-muted-foreground">User</Label>
                <Input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="h-7 w-28 font-mono text-xs"
                  placeholder="user_001"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addStep()}
                disabled={running}
                className="h-7 text-xs gap-1"
              >
                <Plus className="size-3" /> Add step
              </Button>
            </div>
          </div>

          {steps.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border/40 py-8 text-xs text-muted-foreground/60">
              No steps. Add one or pick a preset above.
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step, i) => {
                const isActive = running && currentStepIdx === i;
                const isDone = running && currentStepIdx > i;
                const color = EVENT_COLORS[step.event_type];

                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-300 ${
                      isActive
                        ? "border-primary/40 bg-primary/5 shadow-sm animate-pulse-glow"
                        : isDone
                          ? "border-emerald-500/20 bg-emerald-500/5 opacity-60"
                          : "border-border/30 bg-muted/15"
                    }`}
                  >
                    <span className="text-[10px] text-muted-foreground/50 font-mono w-5 text-right">
                      {i + 1}
                    </span>
                    {color && (
                      <span
                        className="size-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                    )}
                    <Select
                      value={step.event_type}
                      onValueChange={(v) => updateStep(step.id, { event_type: v })}
                      disabled={running}
                    >
                      <SelectTrigger className="h-7 w-[160px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map((t) => (
                          <SelectItem key={t} value={t} className="text-xs">
                            {t.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-1">
                      <Clock className="size-3 text-muted-foreground/40" />
                      <Input
                        type="number"
                        value={step.delay_ms}
                        onChange={(e) =>
                          updateStep(step.id, { delay_ms: Math.max(0, Number(e.target.value)) })
                        }
                        className="h-7 w-20 font-mono text-xs"
                        min={0}
                        step={500}
                        disabled={running}
                      />
                      <span className="text-[10px] text-muted-foreground/40">ms</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStep(step.id)}
                      disabled={running}
                      className="size-7 p-0 text-muted-foreground/40 hover:text-rose-400"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Controls */}
        {steps.length > 0 && (
          <div className="space-y-3 pt-1">
            {running && (
              <div className="space-y-1">
                <Progress
                  value={steps.length > 0 ? ((currentStepIdx + 1) / steps.length) * 100 : 0}
                  className="h-1.5"
                />
                <p className="text-[10px] text-muted-foreground text-center">
                  Step {currentStepIdx + 1} of {steps.length}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              {running ? (
                <Button variant="destructive" size="sm" onClick={stop} className="gap-1.5">
                  <Pause className="size-3.5" /> Stop
                </Button>
              ) : (
                <Button size="sm" onClick={runScenario} className="gap-1.5">
                  <Play className="size-3.5" /> Run scenario
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                disabled={running}
                className="gap-1.5"
              >
                <RotateCcw className="size-3.5" /> Reset
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
