import type { ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const ACCENT_COLORS = [
  "from-amber-500/20 to-orange-500/5",
  "from-emerald-500/20 to-teal-500/5",
  "from-violet-500/20 to-purple-500/5",
  "from-rose-500/20 to-pink-500/5",
  "from-sky-500/20 to-blue-500/5",
  "from-lime-500/20 to-green-500/5",
];

const SPARKLINE_COLORS = ["#f59e0b", "#10b981", "#8b5cf6", "#f43f5e", "#0ea5e9", "#84cc16"];

export function Kpi({
  label,
  value,
  icon,
  loading,
  trend,
  sparkData,
  index = 0,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  loading?: boolean;
  trend?: { value: number; label: string };
  sparkData?: number[];
  index?: number;
}) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const sparkColor = SPARKLINE_COLORS[index % SPARKLINE_COLORS.length];
  const chartData = sparkData?.map((v, i) => ({ v, i })) ?? [];

  return (
    <Card
      className={`panel-surface glow-hover relative overflow-hidden animate-fade-in-up stagger-${Math.min(index + 1, 6)}`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${accent} pointer-events-none opacity-80`}
      />
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: "inset 0 0 30px -10px var(--primary)" }}
      />
      <CardContent className="relative flex items-end justify-between gap-3 p-5 pt-6">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">
            {label}
          </p>
          {loading ? (
            <Skeleton className="mt-2.5 h-10 w-28" />
          ) : (
            <p className="mt-2 text-4xl font-bold tracking-tight tabular-nums font-mono">{value}</p>
          )}
          {trend && !loading && (
            <div className="mt-2.5 flex items-center gap-1.5">
              {trend.value > 0 ? (
                <TrendingUp className="size-3.5 text-emerald-400" />
              ) : trend.value < 0 ? (
                <TrendingDown className="size-3.5 text-rose-400" />
              ) : (
                <Minus className="size-3.5 text-muted-foreground" />
              )}
              <span
                className={`text-xs font-semibold ${
                  trend.value > 0
                    ? "text-emerald-400"
                    : trend.value < 0
                      ? "text-rose-400"
                      : "text-muted-foreground"
                }`}
              >
                {trend.value > 0 ? "+" : ""}
                {trend.value}%
              </span>
              <span className="text-[11px] text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary shadow-lg shadow-primary/10 inset-shadow">
            {icon}
          </span>
          {chartData.length > 0 && !loading && (
            <div className="w-20 h-8 opacity-70">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id={`spark-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={sparkColor} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="v"
                    stroke={sparkColor}
                    strokeWidth={1.5}
                    fill={`url(#spark-${index})`}
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

type TipProps = {
  active?: boolean;
  label?: string | number;
  payload?: { value: number; payload: Record<string, unknown> }[];
};

export function ChartTip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  const first = payload[0];
  if (!first) return null;
  const row = first.payload;
  const title = label ?? row.user ?? row.city ?? row.type ?? "";
  const color = (row.fill as string) ?? (row.color as string) ?? "var(--chart-1)";
  return (
    <div className="glass rounded-xl border border-border/50 px-4 py-3 text-xs shadow-xl">
      <p className="font-semibold text-foreground mb-1">{String(title)}</p>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{first.value}</span> events
        </span>
      </div>
    </div>
  );
}

export function DonutTooltip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null;
  const first = payload[0];
  if (!first) return null;
  const data = first.payload as { type: string; count: number; fill?: string };
  return (
    <div className="glass rounded-xl border border-border/50 px-4 py-3 text-xs shadow-xl">
      <p className="font-semibold text-foreground mb-1">{data.type}</p>
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ backgroundColor: data.fill }} />
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{data.count}</span> events
        </span>
      </div>
    </div>
  );
}

export function EmptyState({ message = "No events in this range" }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 text-center px-4">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/50 mb-1">
        <svg
          className="size-6 text-muted-foreground/50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-foreground/80">{message}</p>
      <p className="text-xs text-muted-foreground max-w-[220px]">
        Head to the Simulator and generate sample events to populate the pipeline.
      </p>
    </div>
  );
}
