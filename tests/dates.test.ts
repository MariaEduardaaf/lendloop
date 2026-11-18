import { describe, expect, it } from "vitest";
import { daysBetween, isIsoDate, queryDate, rangesOverlap, todayUtc } from "../convex/lib/dates";

describe("dates", () => {
  it("computes today in UTC", () => {
    expect(todayUtc(Date.parse("2026-11-18T23:59:59.000Z"))).toBe("2026-11-18");
  });
  it("validates real calendar dates only", () => {
    expect(isIsoDate("2026-02-28")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("2026-2-3")).toBe(false);
    expect(isIsoDate("tomorrow")).toBe(false);
  });
  it("accepts only a real date as the today of a query", () => {
    expect(queryDate("2026-11-18")).toBe("2026-11-18");
    expect(() => queryDate("yesterday")).toThrow();
    expect(() => queryDate("")).toThrow();
  });
  it("counts days between dates", () => {
    expect(daysBetween("2026-11-18", "2026-11-21")).toBe(3);
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });
  it("detects overlapping ranges, ends included", () => {
    const a = { startDate: "2026-12-01", endDate: "2026-12-05" };
    expect(rangesOverlap(a, { startDate: "2026-12-05", endDate: "2026-12-07" })).toBe(true);
    expect(rangesOverlap(a, { startDate: "2026-12-06", endDate: "2026-12-07" })).toBe(false);
  });
});
