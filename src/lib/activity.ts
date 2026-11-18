import { relativeTime } from "./format";
import type { LoanRow } from "./types";

type Activity = LoanRow["activity"][number];

// Owner is the recipient for new and cancelled requests, the borrower for the rest
// (same rule as the Convex notification code).
const OWNER_EVENTS = new Set(["request.created", "request.cancelled"]);

/** One line for the loan activity list, e.g. "Owner notified 3 minutes ago". */
export function activityText(event: Activity, now: number = Date.now()): string {
  const when = relativeTime(event.occurredAt, now);
  if (event.kind === "overdue_reminder") {
    return event.status === "delivered" ? `Reminder sent ${when}` : `Reminder failed ${when}`;
  }
  if (event.status === "failed") return `Notification failed ${when}`;
  const who = event.eventType && OWNER_EVENTS.has(event.eventType) ? "Owner" : "Borrower";
  return `${who} notified ${when}`;
}
