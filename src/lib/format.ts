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
