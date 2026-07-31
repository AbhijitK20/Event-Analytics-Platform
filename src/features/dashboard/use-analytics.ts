import { useMemo } from "react";
import type { RideEvent } from "@/lib/events";

export function formatType(type: string) {
  return type.replace(/_/g, " ");
}

function countBy(events: RideEvent[], key: (e: RideEvent) => string | undefined) {
  return events.reduce<Record<string, number>>((acc, e) => {
    const k = key(e);
    if (!k) return acc;
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});
}

function toSorted(record: Record<string, number>, label: string, take?: number) {
  const rows = Object.entries(record)
    .map(([name, count]) => ({ [label]: name, count }) as Record<string, string | number>)
    .sort((a, b) => (b.count as number) - (a.count as number));
  return take ? rows.slice(0, take) : rows;
}

export function useAnalytics(events: RideEvent[], spanMs: number) {
  return useMemo(() => {
    const todayKey = new Date().toDateString();
    const today = events.filter((e) => new Date(e.created_at).toDateString() === todayKey).length;
    const uniqueUsers = new Set(events.map((e) => e.user_id)).size;

    const completed = events.filter((e) => e.event_type === "ride_completed").length;
    const cancelled = events.filter((e) => e.event_type === "ride_cancelled").length;
    const requested = events.filter((e) => e.event_type === "ride_requested").length;
    const completionRate = requested === 0 ? 0 : Math.min(100, (completed / requested) * 100);
    const cancelledPct = events.length === 0 ? 0 : (cancelled / events.length) * 100;

    const fares = events
      .map((e) => Number((e.metadata as Record<string, unknown> | null)?.fare))
      .filter((n) => Number.isFinite(n) && n > 0);
    const avgFare = fares.length === 0 ? 0 : fares.reduce((a, b) => a + b, 0) / fares.length;

    const byType = toSorted(
      countBy(events, (e) => formatType(e.event_type)),
      "type",
    ) as { type: string; count: number }[];

    const topUsers = toSorted(
      countBy(events, (e) => e.user_id),
      "user",
      7,
    ) as {
      user: string;
      count: number;
    }[];

    const topCities = toSorted(
      countBy(events, (e) => {
        const city = (e.metadata as Record<string, unknown> | null)?.city;
        return typeof city === "string" ? city : undefined;
      }),
      "city",
      7,
    ) as { city: string; count: number }[];

    // Bucket by hour for short ranges, by day otherwise.
    const byHour = spanMs <= 36 * 3600 * 1000;
    const buckets = new Map<string, number>();
    const step = byHour ? 3600 * 1000 : 24 * 3600 * 1000;
    const slots = Math.min(byHour ? 24 : 30, Math.max(6, Math.ceil(spanMs / step)));
    const fmt = (d: Date) =>
      byHour
        ? `${String(d.getHours()).padStart(2, "0")}:00`
        : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    for (let i = slots - 1; i >= 0; i--) buckets.set(fmt(new Date(Date.now() - i * step)), 0);
    for (const e of events) {
      const key = fmt(new Date(e.created_at));
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    const overTime = Array.from(buckets, ([bucket, count]) => ({ bucket, count }));

    return {
      today,
      uniqueUsers,
      completionRate,
      cancelledPct,
      avgFare,
      byType,
      topUsers,
      topCities,
      overTime,
      bucketLabel: byHour ? "hour" : "day",
    };
  }, [events, spanMs]);
}
