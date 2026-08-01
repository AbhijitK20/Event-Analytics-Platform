import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  Ban,
  CalendarClock,
  CheckCircle2,
  Eye,
  PieChart as PieIcon,
  Radio,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";
import { useBroadcastNotifications } from "@/hooks/use-broadcast-notifications";
import { usePresence } from "@/hooks/use-presence";
import { fetchEvents, fetchTotalCount, resolveRange, type RangeKey } from "@/lib/events";
import { useAnalytics } from "@/features/dashboard/use-analytics";
import {
  CHART_COLORS,
  ChartTip,
  DonutTooltip,
  EmptyState,
  Kpi,
} from "@/features/dashboard/components";
import { EventsTable } from "@/features/dashboard/events-table";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Kamel Ride Event Analytics" },
      {
        name: "description",
        content:
          "Live KPIs, event volume trends and recent ride events streaming from the Kamel ingestion pipeline.",
      },
      { property: "og:title", content: "Dashboard — Kamel Ride Event Analytics" },
      {
        property: "og:description",
        content: "Live KPIs, event volume trends and recent ride events from the Kamel pipeline.",
      },
    ],
  }),
  component: Dashboard,
});

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "custom", label: "Custom" },
];

function computeSparkData(events: ReturnType<typeof useAnalytics>["overTime"]): number[] {
  return events.map((e) => e.count);
}

function Dashboard() {
  useRealtimeEvents();
  useBroadcastNotifications();
  const { onlineCount } = usePresence("Viewer", "dashboard");

  const [rangeKey, setRangeKey] = useState<RangeKey>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range = useMemo(
    () =>
      resolveRange(rangeKey, {
        from: customFrom ? new Date(customFrom) : undefined,
        to: customTo ? new Date(`${customTo}T23:59:59`) : undefined,
      }),
    [rangeKey, customFrom, customTo],
  );

  const eventsQuery = useQuery({
    queryKey: ["events", "range", rangeKey, range.from.toISOString().slice(0, 13), customTo],
    queryFn: () => fetchEvents(range),
  });
  const totalQuery = useQuery({ queryKey: ["events", "count"], queryFn: fetchTotalCount });

  const events = eventsQuery.data ?? [];
  const stats = useAnalytics(events, range.to.getTime() - range.from.getTime());
  const loading = eventsQuery.isLoading;

  const sparkData = useMemo(() => computeSparkData(stats.overTime), [stats.overTime]);

  if (eventsQuery.isError) {
    return (
      <Card className="panel-surface border-destructive/40 animate-fade-in-scale">
        <CardHeader>
          <CardTitle className="text-destructive">Couldn't load analytics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>{(eventsQuery.error as Error).message}</p>
          <Button variant="outline" size="sm" onClick={() => eventsQuery.refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Realtime analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every ingested ride event lands here the moment it is written.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onlineCount > 0 && (
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
            >
              <Eye className="size-3" /> {onlineCount} online
            </Badge>
          )}
          <Badge variant="outline" className="gap-2 border-primary/30 text-primary bg-primary/5">
            <Radio className="size-3.5 animate-pulse" /> Live stream
          </Badge>
        </div>
      </div>

      {/* Range Selector */}
      <div className="flex flex-wrap items-center gap-2 animate-fade-in-up stagger-1">
        <div className="flex rounded-xl border border-border/60 bg-muted/30 p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRangeKey(r.key)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${
                rangeKey === r.key
                  ? "bg-primary/15 text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {rangeKey === "custom" ? (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="h-9 w-[150px]"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="h-9 w-[150px]"
            />
          </div>
        ) : null}
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Kpi
          label="Total Events"
          value={totalQuery.isError ? "—" : (totalQuery.data ?? 0)}
          icon={<Activity className="size-4.5" />}
          loading={totalQuery.isLoading}
          sparkData={sparkData}
          index={0}
        />
        <Kpi
          label="Today's Events"
          value={stats.today}
          icon={<CalendarClock className="size-4.5" />}
          loading={loading}
          sparkData={sparkData}
          index={1}
        />
        <Kpi
          label="Unique Users"
          value={stats.uniqueUsers}
          icon={<Users className="size-4.5" />}
          loading={loading}
          sparkData={sparkData}
          index={2}
        />
        <Kpi
          label="Completion Rate"
          value={`${stats.completionRate.toFixed(0)}%`}
          icon={<CheckCircle2 className="size-4.5" />}
          loading={loading}
          trend={{ value: Math.round(stats.completionRate - 75), label: "vs target" }}
          sparkData={sparkData}
          index={3}
        />
        <Kpi
          label="Average Fare"
          value={`$${stats.avgFare.toFixed(2)}`}
          icon={<Wallet className="size-4.5" />}
          loading={loading}
          sparkData={sparkData}
          index={4}
        />
        <Kpi
          label="Cancelled %"
          value={`${stats.cancelledPct.toFixed(1)}%`}
          icon={<Ban className="size-4.5" />}
          loading={loading}
          trend={{
            value: stats.cancelledPct > 10 ? -Math.round(stats.cancelledPct) : 0,
            label: stats.cancelledPct > 10 ? "high" : "normal",
          }}
          sparkData={sparkData}
          index={5}
        />
      </div>

      {/* Events Over Time */}
      <Card className="panel-surface animate-fade-in-up stagger-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Events over time
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              by {stats.bucketLabel}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] pt-2">
          {loading ? (
            <Skeleton className="size-full rounded-lg" />
          ) : events.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.overTime} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="vol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="bucket"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  allowDecimals={false}
                  width={32}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<ChartTip />}
                  cursor={{ stroke: "var(--primary)", strokeOpacity: 0.3 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#vol)"
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: "var(--chart-1)",
                    stroke: "var(--background)",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Two-column: Top Users + Top Cities */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="panel-surface animate-fade-in-up stagger-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top users</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            {loading ? (
              <Skeleton className="size-full rounded-lg" />
            ) : stats.topUsers.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topUsers} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <defs>
                    <linearGradient id="bar-user" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="user"
                    width={80}
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={<ChartTip />}
                    cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="url(#bar-user)" barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="panel-surface animate-fade-in-up stagger-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top cities</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px] pt-2">
            {loading ? (
              <Skeleton className="size-full rounded-lg" />
            ) : stats.topCities.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topCities} layout="vertical" margin={{ left: 8, right: 12 }}>
                  <defs>
                    <linearGradient id="bar-city" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" hide allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="city"
                    width={80}
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    content={<ChartTip />}
                    cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="url(#bar-city)" barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Events by Type - Donut */}
      <Card className="panel-surface animate-fade-in-up stagger-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <PieIcon className="size-4 text-muted-foreground" />
            Events by type
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] pt-2">
          {loading ? (
            <Skeleton className="size-full rounded-lg" />
          ) : stats.byType.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="flex h-full items-center gap-6">
              <div className="h-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.byType}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius="45%"
                      outerRadius="80%"
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {stats.byType.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-shrink-0 space-y-2 pr-4">
                {stats.byType.map((entry, i) => (
                  <div key={entry.type} className="flex items-center gap-2.5 text-xs">
                    <span
                      className="size-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                    />
                    <span className="text-muted-foreground truncate max-w-[100px]">
                      {entry.type}
                    </span>
                    <span className="font-semibold tabular-nums ml-auto">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events Table */}
      <Card className="panel-surface animate-fade-in-up stagger-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent events</CardTitle>
        </CardHeader>
        <CardContent>
          <EventsTable events={events} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
