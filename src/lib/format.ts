import { LIMITS } from "@convex/lib/validators";

const MS_PER_DAY = 86_400_000;

/** "2026-12-01" shown as "1 Dec 2026". Dates are UTC calendar days, so no time zone shift. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00.000Z`),
  );
}

export function formatDateRange(startDate: string, endDate: string): string {
  return startDate === endDate ? formatDate(startDate) : `${formatDate(startDate)} to ${formatDate(endDate)}`;
}

const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const DAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const DAY_MONTH = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** "2026-11-20" as "Fri 20 Nov", for dates close to today. */
export function formatDay(iso: string): string {
  return DAY.format(utc(iso));
}

/** "2026-11-15" as "15 Nov". */
export function formatShort(iso: string): string {
  return DAY_MONTH.format(utc(iso));
}

/** A compact range: "25 to 27 Nov", "30 Nov to 2 Dec", or one day "25 Nov". */
export function formatShortRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatShort(startDate);
  const sameMonth = startDate.slice(0, 7) === endDate.slice(0, 7);
  return `${sameMonth ? utc(startDate).getUTCDate() : formatShort(startDate)} to ${formatShort(endDate)}`;
}

/** Whole days from a to b (b minus a). */
export function daysFrom(a: string, b: string): number {
  return Math.round((utc(b).getTime() - utc(a).getTime()) / MS_PER_DAY);
}

/** "Sat 21 Nov to Mon 23 Nov (3 days)", the dates of a loan as people say them. */
export function formatLoanDates(startDate: string, endDate: string): string {
  const days = plural(daysFrom(startDate, endDate) + 1, "day");
  const range = startDate === endDate ? formatDay(startDate) : `${formatDay(startDate)} to ${formatDay(endDate)}`;
  return `${range} (${days})`;
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Adds whole days to an ISO date. */
export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(`${iso}T00:00:00.000Z`) + days * MS_PER_DAY).toISOString().slice(0, 10);
}

/** The date limits the backend enforces (see assertValidLoanRange), for the date inputs. */
export function loanDateBounds(today: string, startDate: string) {
  const lastStart = addDays(today, LIMITS.maxDaysAhead);
  const from = startDate || today;
  return {
    startMin: today,
    startMax: lastStart,
    endMin: from,
    endMax: addDays(from, LIMITS.maxLoanDays - 1),
  };
}

const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "month", ms: 30 * MS_PER_DAY },
  { unit: "day", ms: MS_PER_DAY },
  { unit: "hour", ms: 3_600_000 },
  { unit: "minute", ms: 60_000 },
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "always" });

/** "3 minutes ago", "2 days ago". Under a minute is "just now". */
export function relativeTime(timestamp: number, now: number = Date.now()): string {
  const elapsed = Math.max(0, now - timestamp);
  const match = UNITS.find(({ ms }) => elapsed >= ms);
  if (!match) return "just now";
  return rtf.format(-Math.floor(elapsed / match.ms), match.unit);
}
