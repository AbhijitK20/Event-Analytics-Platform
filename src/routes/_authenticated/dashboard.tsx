import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
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
  Sector,
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
  X,
  Sparkles,
  Download,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";
import { useBroadcastNotifications } from "@/hooks/use-broadcast-notifications";
import { usePresence } from "@/hooks/use-presence";
import { useAuthUser } from "@/features/auth/use-auth-user";
import {
  fetchEvents,
  fetchTotalCount,
  ingestEvents,
  resolveRange,
  type RangeKey,
} from "@/lib/events";
import { buildSampleEvents } from "@/features/simulator/metadata";
import { useAnalytics } from "@/features/dashboard/use-analytics";
import {
  CHART_COLORS,
  ChartTip,
  DonutTooltip,
  EmptyState,
  Kpi,
} from "@/features/dashboard/components";
import { EventsTable } from "@/features/dashboard/events-table";
import { AlertRulesPanel } from "@/features/dashboard/alert-rules";
import { CityMap } from "@/features/dashboard/city-map";
import { ErrorBoundary } from "@/components/error-boundary";
import { exportDashboardToPdf } from "@/features/dashboard/pdf-export";

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
  const { profile } = useAuthUser();
  const { onlineCount } = usePresence(profile.name || "Viewer", "dashboard");

  const timeOfDay = (() => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  })();

  const [rangeKey, setRangeKey] = useState<RangeKey>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [filterCity, setFilterCity] = useState<string | null>(null);
  const [filterUser, setFilterUser] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const quickStartMutation = useMutation({
    mutationFn: () => ingestEvents(buildSampleEvents(50)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

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
    staleTime: 30_000,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });
  const totalQuery = useQuery({
    queryKey: ["events", "count"],
    queryFn: fetchTotalCount,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });

  const events = eventsQuery.data ?? [];
  const filteredEvents = useMemo(() => {
    let result = events;
    if (filterCity) {
      result = result.filter((e) => {
        const city = (e.metadata as Record<string, unknown> | null)?.city;
        return typeof city === "string" && city === filterCity;
      });
    }
    if (filterUser) {
      result = result.filter((e) => e.user_id === filterUser);
    }
    return result;
  }, [events, filterCity, filterUser]);
  const stats = useAnalytics(filteredEvents, range.to.getTime() - range.from.getTime());
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
    <div className="space-y-6 gradient-mesh min-h-screen -mx-6 -my-8 px-6 py-8">
      {/* Greeting — Nodus-style */}
      <div className="flex flex-wrap items-end justify-between gap-3 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Good {timeOfDay}, {profile.name.split(" ")[0]}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You have {totalQuery.data ?? 0} events tracked today.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filterCity && (
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/30 text-primary bg-primary/5 cursor-pointer hover:bg-primary/10 animate-slide-in-left active:scale-95"
              onClick={() => setFilterCity(null)}
            >
              City: {filterCity}
              <X className="size-3 transition-transform duration-200 group-hover:rotate-90" />
            </Badge>
          )}
          {filterUser && (
            <Badge
              variant="outline"
              className="gap-1.5 border-primary/30 text-primary bg-primary/5 cursor-pointer hover:bg-primary/10 animate-slide-in-left active:scale-95"
              onClick={() => setFilterUser(null)}
            >
              User: {filterUser}
              <X className="size-3 transition-transform duration-200 group-hover:rotate-90" />
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() =>
              exportDashboardToPdf(
                {
                  totalEvents: totalQuery.data ?? 0,
                  todayEvents: stats.today,
                  uniqueUsers: stats.uniqueUsers,
                  completionRate: stats.completionRate,
                  avgFare: stats.avgFare,
                  cancelledPct: stats.cancelledPct,
                },
                profile.name,
              )
            }
          >
            <Download className="size-3" /> PDF
          </Button>
          {onlineCount > 0 && (
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
            >
              <Eye className="size-3" /> {onlineCount} online
            </Badge>
          )}
          <Badge variant="outline" className="gap-2 border-cyan-500/30 text-cyan-400 bg-cyan-500/5">
            <Radio className="size-3.5 animate-pulse" /> Live stream
          </Badge>
        </div>
      </div>

      {/* Range Selector */}
      <div className="flex flex-wrap items-center gap-2 animate-fade-in-up stagger-1">
        <div className="relative flex rounded-xl border border-border/60 bg-muted/30 p-1">
          {RANGES.map((r, i) => (
            <button
              key={r.key}
              onClick={() => setRangeKey(r.key)}
              className={`relative rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors duration-200 z-10 ${
                rangeKey === r.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
          <span
            className="absolute top-1 bottom-1 rounded-lg bg-primary/15 shadow-sm transition-all duration-300 ease-out"
            style={{
              left: `calc(${RANGES.findIndex((r) => r.key === rangeKey) * (100 / RANGES.length)}% + 4px)`,
              width: `calc(${100 / RANGES.length}% - 8px)`,
            }}
          />
        </div>
        {rangeKey === "custom" ? (
          <div className="flex items-center gap-2 animate-fade-in-scale">
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

      {/* Quick Start — only show when empty */}
      {!loading && events.length === 0 && (
        <Card className="panel-surface animate-fade-in-up border-dashed border-primary/20">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-float">
              <Activity className="size-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Welcome to Kamel Ride!</h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Your dashboard is empty. Generate sample ride events to see analytics in action, or
                head to the Simulator to create custom events.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => quickStartMutation.mutate()}
                disabled={quickStartMutation.isPending}
                className="gap-2"
              >
                <Sparkles className="size-4" />
                {quickStartMutation.isPending ? "Generating…" : "Generate 50 sample events"}
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/simulator">Open Simulator</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Grid — asymmetric: hero card spans 2 cols */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="sm:col-span-2 xl:col-span-1">
          <Kpi
            label="Total Events"
            value={totalQuery.isError ? "—" : (totalQuery.data ?? 0)}
            icon={<Activity className="size-4.5" />}
            loading={totalQuery.isLoading}
            sparkData={sparkData}
            index={0}
          />
        </div>
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
      <ErrorBoundary sectionName="Events over time chart">
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
                <AreaChart
                  data={stats.overTime}
                  margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
                >
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
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
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
      </ErrorBoundary>

      {/* Two-column: Top Users + Top Cities */}
      <ErrorBoundary sectionName="Top users and cities charts">
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
                  <BarChart
                    data={stats.topUsers}
                    layout="vertical"
                    margin={{ left: 8, right: 12 }}
                    onClick={(data) => {
                      if (data?.activePayload?.[0]) {
                        const user = data.activePayload[0].payload.user as string;
                        setFilterUser(filterUser === user ? null : user);
                      }
                    }}
                  >
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
                    <Bar
                      dataKey="count"
                      radius={[0, 8, 8, 0]}
                      fill="url(#bar-user)"
                      barSize={18}
                      className="cursor-pointer"
                      isAnimationActive={true}
                      animationDuration={600}
                      animationEasing="ease-out"
                    />
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
                  <BarChart
                    data={stats.topCities}
                    layout="vertical"
                    margin={{ left: 8, right: 12 }}
                    onClick={(data) => {
                      if (data?.activePayload?.[0]) {
                        const city = data.activePayload[0].payload.city as string;
                        setFilterCity(filterCity === city ? null : city);
                      }
                    }}
                  >
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
                    <Bar
                      dataKey="count"
                      radius={[0, 8, 8, 0]}
                      fill="url(#bar-city)"
                      barSize={18}
                      className="cursor-pointer"
                      isAnimationActive={true}
                      animationDuration={600}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </ErrorBoundary>

      {/* Event Map */}
      {!loading && stats.topCities.length > 0 && (
        <CityMap
          cities={stats.topCities}
          onCityClick={(city) => setFilterCity(filterCity === city ? null : city)}
          activeCity={filterCity}
        />
      )}

      {/* Alert Rules */}
      {!loading && (
        <AlertRulesPanel
          stats={{
            cancelledPct: stats.cancelledPct,
            avgFare: stats.avgFare,
            today: stats.today,
            byType: stats.byType,
          }}
        />
      )}

      {/* Events by Type - Donut */}
      <ErrorBoundary sectionName="Events by type chart">
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
                <div className="h-full flex-1 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {CHART_COLORS.map((color, i) => (
                          <linearGradient
                            key={i}
                            id={`donut-grad-${i}`}
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={stats.byType}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius="50%"
                        outerRadius="82%"
                        paddingAngle={2}
                        strokeWidth={0}
                        isAnimationActive={true}
                        animationBegin={200}
                        animationDuration={800}
                        animationEasing="ease-out"
                        activeShape={(props: {
                          cx?: number;
                          cy?: number;
                          innerRadius?: number;
                          outerRadius?: number;
                          startAngle?: number;
                          endAngle?: number;
                          fill?: string;
                        }) => {
                          const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
                            props;
                          return (
                            <g>
                              <Sector
                                cx={cx}
                                cy={cy}
                                innerRadius={innerRadius! - 2}
                                outerRadius={outerRadius! + 6}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                fill={fill}
                                opacity={0.9}
                              />
                              <Sector
                                cx={cx}
                                cy={cy}
                                innerRadius={outerRadius! + 8}
                                outerRadius={outerRadius! + 12}
                                startAngle={startAngle}
                                endAngle={endAngle}
                                fill={fill}
                                opacity={0.4}
                              />
                            </g>
                          );
                        }}
                      >
                        {stats.byType.map((_, i) => (
                          <Cell key={i} fill={`url(#donut-grad-${i % CHART_COLORS.length})`} />
                        ))}
                      </Pie>
                      <Tooltip content={<DonutTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold font-mono tabular-nums">
                      {events.length}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      events
                    </span>
                  </div>
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
      </ErrorBoundary>

      {/* Recent Events Table */}
      <Card className="panel-surface animate-fade-in-up stagger-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Recent events
            {(filterCity || filterUser) && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">(filtered)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EventsTable events={filteredEvents} loading={loading} />
        </CardContent>
      </Card>
    </div>
  );
}
