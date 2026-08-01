import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { describeError, consumeLastCapturedError } from "./error-capture";

describe("describeError", () => {
  it("describes a simple Error", () => {
    const error = new Error("test message");
    const result = describeError(error);
    expect(result).toContain("test message");
    expect(result).toContain("Error");
  });

  it("describes an error with cause chain", () => {
    const cause = new Error("root cause");
    const error = new Error("wrapper", { cause });
    const result = describeError(error);
    expect(result).toContain("wrapper");
    expect(result).toContain("caused by:");
    expect(result).toContain("root cause");
  });

  it("describes a string error", () => {
    const result = describeError("plain string error");
    expect(result).toBe("plain string error");
  });

  it("describes a non-Error object", () => {
    const result = describeError({ code: 500, message: "fail" });
    expect(result).toContain("fail");
  });

  it("describes an error with status code", () => {
    const error = new Error("not found") as Error & { status: number };
    error.status = 404;
    const result = describeError(error);
    expect(result).toContain("status 404");
  });

  it("truncates at depth limit", () => {
    let current: Error = new Error("level 0");
    for (let i = 1; i <= 10; i++) {
      current = new Error(`level ${i}`, { cause: current });
    }
    const result = describeError(current);
    // Should have at most 5 levels
    const causeCount = (result.match(/caused by:/g) ?? []).length;
    expect(causeCount).toBeLessThanOrEqual(4);
  });

  it("handles circular references safely", () => {
    const obj: Record<string, unknown> = { a: 1 };
    obj.self = obj;
    const result = describeError(obj);
    expect(result).toBeTruthy();
  });
});

describe("consumeLastCapturedError", () => {
  it("returns undefined when no error captured", () => {
    expect(consumeLastCapturedError()).toBeUndefined();
  });
});
