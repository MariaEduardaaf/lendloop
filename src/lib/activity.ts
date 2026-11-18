import { relativeTime } from "./format";
import type { LoanRow } from "./types";

type Activity = LoanRow["activity"][number];

// Owner is the recipient for new and cancelled requests, the borrower for the rest
// (same rule as the Convex notification code).
const OWNER_EVENTS = new Set(["request.created", "request.cancelled"]);

function attemptsText(attempts: number): string {
  return `${attempts} ${attempts === 1 ? "attempt" : "attempts"}`;
}

/** One line for the loan activity list, e.g. "Owner notified 3 minutes ago". */
export function activityText(event: Activity, now: number = Date.now()): string {
  if (event.kind === "overdue_reminder") {
    return event.status === "delivered"
      ? `Reminder sent ${relativeTime(event.occurredAt, now)}`
      : `Reminder failed after ${attemptsText(event.attempts)}`;
  }
  if (event.status === "failed") return `Notification failed after ${attemptsText(event.attempts)}`;
  const who = event.eventType && OWNER_EVENTS.has(event.eventType) ? "Owner" : "Borrower";
  return `${who} notified ${relativeTime(event.occurredAt, now)}`;
}
