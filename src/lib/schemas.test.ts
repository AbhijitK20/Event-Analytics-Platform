import { describe, it, expect } from "vitest";
import { NewEventSchema, FetchEventsQuerySchema, DateRangeSchema } from "./schemas";

describe("NewEventSchema", () => {
  it("accepts valid event", () => {
    const result = NewEventSchema.parse({
      event_type: "ride_requested",
      user_id: "user_001",
    });
    expect(result.event_type).toBe("ride_requested");
    expect(result.user_id).toBe("user_001");
  });

  it("accepts event with metadata", () => {
    const result = NewEventSchema.parse({
      event_type: "ride_completed",
      user_id: "user_002",
      metadata: { fare: 25.5, city: "Lagos" },
    });
    expect(result.metadata).toEqual({ fare: 25.5, city: "Lagos" });
  });

  it("rejects invalid event_type", () => {
    expect(() =>
      NewEventSchema.parse({ event_type: "invalid_type", user_id: "user_001" }),
    ).toThrow();
  });

  it("rejects empty user_id", () => {
    expect(() => NewEventSchema.parse({ event_type: "ride_requested", user_id: "" })).toThrow(
      "user_id is required",
    );
  });

  it("rejects user_id with special characters", () => {
    expect(() =>
      NewEventSchema.parse({ event_type: "ride_requested", user_id: "user@001" }),
    ).toThrow("alphanumeric");
  });

  it("rejects user_id over 128 chars", () => {
    expect(() =>
      NewEventSchema.parse({
        event_type: "ride_requested",
        user_id: "a".repeat(129),
      }),
    ).toThrow("too long");
  });

  it("accepts user_id with underscores and hyphens", () => {
    const result = NewEventSchema.parse({
      event_type: "ride_requested",
      user_id: "user_001-test",
    });
    expect(result.user_id).toBe("user_001-test");
  });

  it("defaults metadata to undefined", () => {
    const result = NewEventSchema.parse({
      event_type: "ride_requested",
      user_id: "user_001",
    });
    expect(result.metadata).toBeUndefined();
  });
});

describe("FetchEventsQuerySchema", () => {
  it("accepts valid query with defaults", () => {
    const result = FetchEventsQuerySchema.parse({
      from: "2025-01-01T00:00:00.000Z",
      to: "2025-01-31T23:59:59.999Z",
    });
    expect(result.limit).toBe(2000);
  });

  it("accepts custom limit", () => {
    const result = FetchEventsQuerySchema.parse({
      from: "2025-01-01T00:00:00.000Z",
      to: "2025-01-31T23:59:59.999Z",
      limit: 100,
    });
    expect(result.limit).toBe(100);
  });

  it("rejects limit over 5000", () => {
    expect(() =>
      FetchEventsQuerySchema.parse({
        from: "2025-01-01T00:00:00.000Z",
        to: "2025-01-31T23:59:59.999Z",
        limit: 5001,
      }),
    ).toThrow();
  });

  it("rejects invalid datetime", () => {
    expect(() =>
      FetchEventsQuerySchema.parse({
        from: "not-a-date",
        to: "2025-01-31T23:59:59.999Z",
      }),
    ).toThrow();
  });
});

describe("DateRangeSchema", () => {
  it("accepts valid datetime strings", () => {
    const result = DateRangeSchema.parse({
      from: "2025-01-01T00:00:00.000Z",
      to: "2025-01-31T23:59:59.999Z",
    });
    expect(result.from).toBeTruthy();
    expect(result.to).toBeTruthy();
  });
});
