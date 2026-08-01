import { describe, it, expect } from "vitest";
import { buildMetadata, buildSampleEvents, buildPresets } from "./metadata";
import { EVENT_TYPES } from "@/lib/events";

describe("buildMetadata", () => {
  it("returns an object with required fields", () => {
    const meta = buildMetadata();
    expect(meta).toHaveProperty("pickup");
    expect(meta).toHaveProperty("destination");
    expect(meta).toHaveProperty("fare");
    expect(meta).toHaveProperty("vehicle_type");
    expect(meta).toHaveProperty("city");
    expect(meta).toHaveProperty("driver_id");
    expect(meta).toHaveProperty("surge");
  });

  it("generates numeric fare", () => {
    const meta = buildMetadata();
    expect(typeof meta.fare).toBe("number");
    expect(meta.fare).toBeGreaterThan(0);
  });

  it("generates different results on multiple calls", () => {
    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const meta = buildMetadata();
      results.add(`${meta.pickup}-${meta.destination}`);
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("pickup and destination are usually different", () => {
    let differentCount = 0;
    for (let i = 0; i < 20; i++) {
      const meta = buildMetadata();
      if (meta.pickup !== meta.destination) differentCount++;
    }
    // With 8 places and retry logic, almost all should differ
    expect(differentCount).toBeGreaterThanOrEqual(18);
  });
});

describe("buildSampleEvents", () => {
  it("generates requested number of events", () => {
    const events = buildSampleEvents(10);
    expect(events).toHaveLength(10);
  });

  it("each event has valid event_type", () => {
    const events = buildSampleEvents(20);
    for (const event of events) {
      expect(EVENT_TYPES).toContain(event.event_type);
    }
  });

  it("each event has a user_id", () => {
    const events = buildSampleEvents(5);
    for (const event of events) {
      expect(event.user_id).toBeTruthy();
      expect(event.user_id).toMatch(/^user_\d{3}$/);
    }
  });

  it("each event has metadata", () => {
    const events = buildSampleEvents(5);
    for (const event of events) {
      expect(event.metadata).toBeDefined();
      expect(event.metadata).toHaveProperty("fare");
      expect(event.metadata).toHaveProperty("city");
    }
  });

  it("defaults to 100 events", () => {
    const events = buildSampleEvents();
    expect(events).toHaveLength(100);
  });
});

describe("buildPresets", () => {
  it("returns 6 presets", () => {
    const presets = buildPresets();
    expect(presets).toHaveLength(6);
  });

  it("each preset has required fields", () => {
    const presets = buildPresets();
    for (const preset of presets) {
      expect(preset.label).toBeTruthy();
      expect(preset.description).toBeTruthy();
      expect(EVENT_TYPES).toContain(preset.event_type);
      expect(preset.user_id).toMatch(/^user_\d{3}$/);
      expect(preset.metadata).toHaveProperty("fare");
    }
  });

  it("includes ride_requested preset", () => {
    const presets = buildPresets();
    const requested = presets.find((p) => p.event_type === "ride_requested");
    expect(requested).toBeDefined();
    expect(requested!.label).toBe("Request a ride");
  });

  it("includes payment_failed preset", () => {
    const presets = buildPresets();
    const failed = presets.find((p) => p.event_type === "payment_failed");
    expect(failed).toBeDefined();
    expect(failed!.metadata).toHaveProperty("error");
  });
});
