import { useState, useCallback, useEffect } from "react";
import { AlertTriangle, Bell, BellOff, CheckCircle2, Plus, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type AlertMetric = "cancellation_rate" | "avg_fare" | "event_count" | "payment_failure_rate";
type AlertCondition = "above" | "below";

type AlertRule = {
  id: string;
  name: string;
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
  enabled: boolean;
};

type AlertViolation = {
  ruleId: string;
  ruleName: string;
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
  actual: number;
  timestamp: number;
};

const METRIC_LABELS: Record<AlertMetric, string> = {
  cancellation_rate: "Cancellation Rate (%)",
  avg_fare: "Average Fare ($)",
  event_count: "Event Count",
  payment_failure_rate: "Payment Failure Rate (%)",
};

function evaluateRule(rule: AlertRule, value: number): boolean {
  if (!rule.enabled) return false;
  if (rule.condition === "above") return value > rule.threshold;
  return value < rule.threshold;
}

function computeMetricValue(
  metric: AlertMetric,
  stats: {
    cancelledPct: number;
    avgFare: number;
    today: number;
    byType: { type: string; count: number }[];
  },
): number {
  switch (metric) {
    case "cancellation_rate":
      return stats.cancelledPct;
    case "avg_fare":
      return stats.avgFare;
    case "event_count":
      return stats.today;
    case "payment_failure_rate": {
      const total = stats.byType.reduce((s, t) => s + t.count, 0);
      const failures = stats.byType.find((t) => t.type === "payment failed")?.count ?? 0;
      return total === 0 ? 0 : (failures / total) * 100;
    }
  }
}

const STORAGE_KEY = "kamel-alert-rules";

function loadRules(): AlertRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}

function saveRules(rules: AlertRule[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  } catch {
    // localStorage unavailable
  }
}

const DEFAULT_RULES: AlertRule[] = [
  {
    id: "default-cancel",
    name: "High cancellation rate",
    metric: "cancellation_rate",
    condition: "above",
    threshold: 15,
    enabled: true,
  },
  {
    id: "default-payment",
    name: "Payment failures spike",
    metric: "payment_failure_rate",
    condition: "above",
    threshold: 10,
    enabled: true,
  },
];

export function AlertRulesPanel({
  stats,
}: {
  stats: {
    cancelledPct: number;
    avgFare: number;
    today: number;
    byType: { type: string; count: number }[];
  };
}) {
  const [rules, setRules] = useState<AlertRule[]>(loadRules);
  const [violations, setViolations] = useState<AlertViolation[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [newName, setNewName] = useState("");
  const [newMetric, setNewMetric] = useState<AlertMetric>("cancellation_rate");
  const [newCondition, setNewCondition] = useState<AlertCondition>("above");
  const [newThreshold, setNewThreshold] = useState("10");

  useEffect(() => {
    saveRules(rules);
  }, [rules]);

  useEffect(() => {
    const newViolations: AlertViolation[] = [];
    for (const rule of rules) {
      const value = computeMetricValue(rule.metric, stats);
      if (evaluateRule(rule, value)) {
        newViolations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          metric: rule.metric,
          condition: rule.condition,
          threshold: rule.threshold,
          actual: value,
          timestamp: Date.now(),
        });
      }
    }
    setViolations(newViolations);
  }, [rules, stats]);

  const addRule = () => {
    if (!newName.trim()) return;
    setRules((prev) => [
      ...prev,
      {
        id: `rule-${Date.now()}`,
        name: newName.trim(),
        metric: newMetric,
        condition: newCondition,
        threshold: Number(newThreshold) || 10,
        enabled: true,
      },
    ]);
    setNewName("");
  };

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const activeViolations = violations.filter((v) => {
    const rule = rules.find((r) => r.id === v.ruleId);
    return rule?.enabled;
  });

  return (
    <Card className="panel-surface animate-fade-in-up stagger-5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            Alert Rules
          </CardTitle>
          <div className="flex items-center gap-2">
            {activeViolations.length > 0 && (
              <Badge
                variant="outline"
                className="gap-1.5 border-amber-500/30 text-amber-400 bg-amber-500/5 animate-pulse"
              >
                <AlertTriangle className="size-3" />
                {activeViolations.length} active
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPanel(!showPanel)}
              className="h-7 text-xs"
            >
              {showPanel ? "Hide" : "Manage"}
            </Button>
          </div>
        </div>
        <CardDescription>
          Set thresholds for key metrics. Alerts trigger when conditions are met.
        </CardDescription>
      </CardHeader>

      {/* Active violations */}
      {activeViolations.length > 0 && !showPanel && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {activeViolations.map((v, i) => (
              <div
                key={`${v.ruleId}-${i}`}
                className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2"
              >
                <AlertTriangle className="size-4 text-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{v.ruleName}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {METRIC_LABELS[v.metric]} is {v.actual.toFixed(1)} (threshold: {v.condition}{" "}
                    {v.threshold})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}

      {/* Management panel */}
      {showPanel && (
        <CardContent className="space-y-4 pt-0">
          {/* Existing rules */}
          <div className="space-y-2">
            {rules.map((rule) => {
              const value = computeMetricValue(rule.metric, stats);
              const triggered = evaluateRule(rule, value);
              return (
                <div
                  key={rule.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                    triggered
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border/30 bg-muted/15"
                  }`}
                >
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                    className="scale-75"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{rule.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {METRIC_LABELS[rule.metric]} {rule.condition} {rule.threshold}{" "}
                      <span className="text-foreground/70">(current: {value.toFixed(1)})</span>
                    </p>
                  </div>
                  {triggered && <AlertTriangle className="size-3.5 text-amber-400" />}
                  {!triggered && rule.enabled && (
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteRule(rule.id)}
                    className="size-7 p-0 text-muted-foreground/40 hover:text-rose-400"
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Add new rule */}
          <div className="rounded-lg border border-dashed border-border/40 p-3 space-y-3">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              New rule
            </Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Rule name"
                className="h-8 text-xs"
              />
              <Select value={newMetric} onValueChange={(v) => setNewMetric(v as AlertMetric)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METRIC_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={newCondition}
                onValueChange={(v) => setNewCondition(v as AlertCondition)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="above" className="text-xs">
                    Above
                  </SelectItem>
                  <SelectItem value="below" className="text-xs">
                    Below
                  </SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={newThreshold}
                onChange={(e) => setNewThreshold(e.target.value)}
                placeholder="Threshold"
                className="h-8 text-xs font-mono"
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={addRule}
              disabled={!newName.trim()}
              className="h-7 text-xs gap-1.5"
            >
              <Plus className="size-3" /> Add rule
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
