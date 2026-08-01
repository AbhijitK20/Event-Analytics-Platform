import { describe, it, expect } from "vitest";
import { formatType } from "./use-analytics";
import type { RideEvent } from "@/lib/events";

// Extract the pure computation logic from useAnalytics for testing
function computeAnalytics(events: RideEvent[], spanMs: number) {
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

  return {
    today,
    uniqueUsers,
    completionRate,
    cancelledPct,
    avgFare,
  };
}

function makeEvent(overrides: Partial<RideEvent> & { event_type: string }): RideEvent {
  return {
    id: `evt-${Math.random().toString(36).slice(2, 8)}`,
    user_id: "user_001",
    created_at: new Date().toISOString(),
    metadata: null,
    ...overrides,
  };
}

describe("formatType", () => {
  it("replaces underscores with spaces", () => {
    expect(formatType("ride_requested")).toBe("ride requested");
    expect(formatType("payment_failed")).toBe("payment failed");
    expect(formatType("driver_arrived")).toBe("driver arrived");
  });

  it("returns unchanged string if no underscores", () => {
    expect(formatType("completed")).toBe("completed");
  });
});

describe("computeAnalytics", () => {
  it("returns zeros for empty events", () => {
    const stats = computeAnalytics([], 86400000);
    expect(stats.today).toBe(0);
    expect(stats.uniqueUsers).toBe(0);
    expect(stats.completionRate).toBe(0);
    expect(stats.cancelledPct).toBe(0);
    expect(stats.avgFare).toBe(0);
  });

  it("computes unique users correctly", () => {
    const events = [
      makeEvent({ event_type: "ride_requested", user_id: "user_001" }),
      makeEvent({ event_type: "ride_requested", user_id: "user_002" }),
      makeEvent({ event_type: "ride_requested", user_id: "user_001" }),
    ];
    const stats = computeAnalytics(events, 86400000);
    expect(stats.uniqueUsers).toBe(2);
  });

  it("computes completion rate", () => {
    const events = [
      makeEvent({ event_type: "ride_requested" }),
      makeEvent({ event_type: "ride_requested" }),
      makeEvent({ event_type: "ride_requested" }),
      makeEvent({ event_type: "ride_completed" }),
      makeEvent({ event_type: "ride_completed" }),
    ];
    const stats = computeAnalytics(events, 86400000);
    expect(stats.completionRate).toBeCloseTo(66.67, 1);
  });

  it("returns 0 completion rate when no ride_requested events", () => {
    const events = [
      makeEvent({ event_type: "ride_completed" }),
      makeEvent({ event_type: "ride_completed" }),
    ];
    const stats = computeAnalytics(events, 86400000);
    expect(stats.completionRate).toBe(0);
  });

  it("caps completion rate at 100%", () => {
    const events = [
      makeEvent({ event_type: "ride_requested" }),
      makeEvent({ event_type: "ride_completed" }),
      makeEvent({ event_type: "ride_completed" }),
    ];
    const stats = computeAnalytics(events, 86400000);
    expect(stats.completionRate).toBe(100);
  });

  it("computes cancelled percentage", () => {
    const events = [
      makeEvent({ event_type: "ride_requested" }),
      makeEvent({ event_type: "ride_cancelled" }),
      makeEvent({ event_type: "ride_cancelled" }),
    ];
    const stats = computeAnalytics(events, 86400000);
    expect(stats.cancelledPct).toBeCloseTo(66.67, 1);
  });

  it("computes average fare from metadata", () => {
    const events = [
      makeEvent({ event_type: "ride_completed", metadata: { fare: 10 } }),
      makeEvent({ event_type: "ride_completed", metadata: { fare: 20 } }),
      makeEvent({ event_type: "ride_completed", metadata: { fare: 30 } }),
    ];
    const stats = computeAnalytics(events, 86400000);
    expect(stats.avgFare).toBe(20);
  });

  it("ignores non-numeric fares", () => {
    const events = [
      makeEvent({ event_type: "ride_completed", metadata: { fare: 10 } }),
      makeEvent({ event_type: "ride_completed", metadata: { fare: "invalid" } }),
      makeEvent({ event_type: "ride_completed", metadata: { fare: null } }),
    ];
    const stats = computeAnalytics(events, 86400000);
    expect(stats.avgFare).toBe(10);
  });

  it("ignores negative fares", () => {
    const events = [
      makeEvent({ event_type: "ride_completed", metadata: { fare: -5 } }),
      makeEvent({ event_type: "ride_completed", metadata: { fare: 20 } }),
    ];
    const stats = computeAnalytics(events, 86400000);
    expect(stats.avgFare).toBe(20);
  });
});
