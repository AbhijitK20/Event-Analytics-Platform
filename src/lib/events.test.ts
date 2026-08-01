import { describe, it, expect } from "vitest";
import { resolveRange, EVENT_TYPES, EVENT_COLORS, type RideEvent } from "./events";

describe("EVENT_TYPES", () => {
  it("contains 8 event types", () => {
    expect(EVENT_TYPES).toHaveLength(8);
  });

  it("includes all expected types", () => {
    expect(EVENT_TYPES).toContain("ride_requested");
    expect(EVENT_TYPES).toContain("driver_assigned");
    expect(EVENT_TYPES).toContain("ride_completed");
    expect(EVENT_TYPES).toContain("payment_success");
    expect(EVENT_TYPES).toContain("payment_failed");
  });
});

describe("EVENT_COLORS", () => {
  it("has a color config for every event type", () => {
    for (const type of EVENT_TYPES) {
      const config = EVENT_COLORS[type];
      expect(config).toBeDefined();
      expect(config!.badge).toBeTruthy();
      expect(config!.hex).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

describe("resolveRange", () => {
  it("returns today range starting at midnight", () => {
    const range = resolveRange("today");
    expect(range.from.getHours()).toBe(0);
    expect(range.from.getMinutes()).toBe(0);
    expect(range.from.getSeconds()).toBe(0);
    expect(range.to).toBeInstanceOf(Date);
  });

  it("returns 7-day range", () => {
    const range = resolveRange("7d");
    const diff = range.to.getTime() - range.from.getTime();
    expect(diff).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -3);
  });

  it("returns 30-day range", () => {
    const range = resolveRange("30d");
    const diff = range.to.getTime() - range.from.getTime();
    expect(diff).toBeCloseTo(30 * 24 * 60 * 60 * 1000, -3);
  });

  it("returns custom range when provided", () => {
    const from = new Date("2025-01-01");
    const to = new Date("2025-01-15");
    const range = resolveRange("custom", { from, to });
    expect(range.from).toBe(from);
    expect(range.to).toBe(to);
  });

  it("defaults custom range end to now", () => {
    const from = new Date("2025-01-01");
    const before = Date.now();
    const range = resolveRange("custom", { from });
    const after = Date.now();
    expect(range.from).toBe(from);
    expect(range.to.getTime()).toBeGreaterThanOrEqual(before);
    expect(range.to.getTime()).toBeLessThanOrEqual(after);
  });
});
