import { ConvexError } from "convex/values";
import { LIMITS } from "./validators";

// All dates are ISO strings (YYYY-MM-DD). "Today" is the UTC date on the server,
// a documented simplification: no per-user time zones.

const MS_PER_DAY = 86_400_000;

export function todayUtc(nowMs: number = Date.now()): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

/** True for real calendar dates in YYYY-MM-DD form (rejects 2026-02-30). */
export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/**
 * Checks the "today" a query received as an argument. Queries do not read the clock:
 * Convex caches a query result until the data it read changes, so a query that called
 * Date.now() could keep answering with yesterday's date. The caller passes the date
 * instead, which also makes it part of the cache key. It only shifts display flags
 * (availability, overdue). Every rule is enforced in mutations, against the server clock.
 */
export function queryDate(today: string): string {
  if (!isIsoDate(today)) throw new ConvexError("Invalid date");
  return today;
}

/** The ISO date n days after (or before, if negative) the given ISO date. */
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00.000Z`) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** Whole days from a to b (b minus a). Both must be valid ISO dates. */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00.000Z`) - Date.parse(`${a}T00:00:00.000Z`)) / MS_PER_DAY);
}

/** Throws a user-readable ConvexError when the requested range breaks a rule. */
export function assertValidLoanRange(startDate: string, endDate: string, today: string): void {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    throw new ConvexError("Dates must look like 2026-12-31");
  }
  if (startDate < today) throw new ConvexError("The start date cannot be in the past");
  if (endDate < startDate) throw new ConvexError("The end date cannot be before the start date");
  // Inclusive: 1 Dec to 30 Dec is 30 days.
  if (daysBetween(startDate, endDate) + 1 > LIMITS.maxLoanDays) {
    throw new ConvexError(`A loan can last at most ${LIMITS.maxLoanDays} days`);
  }
  if (daysBetween(today, startDate) > LIMITS.maxDaysAhead) {
    throw new ConvexError(`You can only request up to ${LIMITS.maxDaysAhead} days ahead`);
  }
}

/** Two inclusive ranges overlap when each starts before the other ends. */
export function rangesOverlap(
  a: { startDate: string; endDate: string },
  b: { startDate: string; endDate: string },
): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}
