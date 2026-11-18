import { addDays, daysFrom, formatDay, formatShort, formatShortRange, plural } from "./format";

// The 14-day availability strip on every tool, and the one sentence that says the same in words.

export const STRIP_DAYS = 14;

type Range = { startDate: string; endDate: string };

export type ToolAvailability = {
  outUntil: string | null;
  late: boolean;
  bookings: Range[];
  myPendingRequest?: Range | null;
};

export type StripCell = { date: string; state: "free" | "booked" | "mine" };

const covers = (r: Range, date: string) => r.startDate <= date && date <= r.endDate;

/** One cell per day from today. A late tool is still out today, so today counts as booked. */
export function stripCells(today: string, a: ToolAvailability): StripCell[] {
  return Array.from({ length: STRIP_DAYS }, (_, i) => {
    const date = addDays(today, i);
    if ((i === 0 && a.late) || a.bookings.some((b) => covers(b, date))) return { date, state: "booked" };
    if (a.myPendingRequest && covers(a.myPendingRequest, date)) return { date, state: "mine" };
    return { date, state: "free" };
  });
}

/** "Free now", "Out, back Fri 20 Nov", "3 days late, was due 15 Nov", plus the next booking or my request. */
export function availabilitySentence(today: string, a: ToolAvailability): { text: string; tone: "free" | "out" | "late" } {
  let text: string;
  let tone: "free" | "out" | "late";
  if (a.late && a.outUntil) {
    text = `${plural(daysFrom(a.outUntil, today), "day")} late, was due ${formatShort(a.outUntil)}`;
    tone = "late";
  } else if (a.outUntil) {
    text = a.outUntil === today ? "Out, due back today" : `Out, back ${formatDay(a.outUntil)}`;
    tone = "out";
  } else {
    const next = a.bookings.find((b) => b.startDate > today);
    text = next ? `Free now. Booked ${formatShortRange(next.startDate, next.endDate)}` : "Free now";
    tone = "free";
  }
  if (a.myPendingRequest) {
    const { startDate, endDate } = a.myPendingRequest;
    text += `. You asked for ${formatShortRange(startDate, endDate)}`;
  }
  return { text, tone };
}

/** Upcoming booked ranges for the request form ("Booked: 25 to 27 Nov, 1 to 3 Dec"). */
export function bookedText(today: string, a: ToolAvailability): string | null {
  const ranges = a.bookings.filter((b) => b.endDate >= today).map((b) => formatShortRange(b.startDate, b.endDate));
  const parts = [a.late ? "Still out and overdue." : "", ranges.length ? `Booked: ${ranges.join(", ")}` : ""];
  return parts.filter(Boolean).join(" ") || null;
}
