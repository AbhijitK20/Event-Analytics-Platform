import { describe, it, expect } from "vitest";

// Extract pure computation logic from alert-rules.tsx for testing
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

const mockStats = {
  cancelledPct: 12,
  avgFare: 25,
  today: 150,
  byType: [
    { type: "ride requested", count: 100 },
    { type: "ride completed", count: 80 },
    { type: "ride cancelled", count: 12 },
    { type: "payment failed", count: 8 },
  ],
};

describe("evaluateRule", () => {
  it("triggers when value is above threshold", () => {
    const rule: AlertRule = {
      id: "1",
      name: "Test",
      metric: "cancellation_rate",
      condition: "above",
      threshold: 10,
      enabled: true,
    };
    expect(evaluateRule(rule, 15)).toBe(true);
  });

  it("does not trigger when value is below threshold", () => {
    const rule: AlertRule = {
      id: "1",
      name: "Test",
      metric: "cancellation_rate",
      condition: "above",
      threshold: 10,
      enabled: true,
    };
    expect(evaluateRule(rule, 5)).toBe(false);
  });

  it("does not trigger when value equals threshold", () => {
    const rule: AlertRule = {
      id: "1",
      name: "Test",
      metric: "cancellation_rate",
      condition: "above",
      threshold: 10,
      enabled: true,
    };
    expect(evaluateRule(rule, 10)).toBe(false);
  });

  it("triggers 'below' condition correctly", () => {
    const rule: AlertRule = {
      id: "1",
      name: "Test",
      metric: "avg_fare",
      condition: "below",
      threshold: 20,
      enabled: true,
    };
    expect(evaluateRule(rule, 15)).toBe(true);
    expect(evaluateRule(rule, 25)).toBe(false);
  });

  it("does not trigger when disabled", () => {
    const rule: AlertRule = {
      id: "1",
      name: "Test",
      metric: "cancellation_rate",
      condition: "above",
      threshold: 10,
      enabled: false,
    };
    expect(evaluateRule(rule, 100)).toBe(false);
  });
});

describe("computeMetricValue", () => {
  it("returns cancellation_rate", () => {
    expect(computeMetricValue("cancellation_rate", mockStats)).toBe(12);
  });

  it("returns avg_fare", () => {
    expect(computeMetricValue("avg_fare", mockStats)).toBe(25);
  });

  it("returns event_count", () => {
    expect(computeMetricValue("event_count", mockStats)).toBe(150);
  });

  it("computes payment_failure_rate correctly", () => {
    // 8 failures / 200 total events = 4%
    const result = computeMetricValue("payment_failure_rate", mockStats);
    expect(result).toBeCloseTo(4, 1);
  });

  it("returns 0 for payment_failure_rate when no events", () => {
    const emptyStats = { ...mockStats, byType: [] };
    expect(computeMetricValue("payment_failure_rate", emptyStats)).toBe(0);
  });
});
