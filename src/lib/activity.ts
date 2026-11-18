import { relativeTime } from "./format";
import type { Perspective } from "./loan-stage";
import type { LoanRow } from "./types";

type Activity = LoanRow["activity"][number];
type Names = Pick<LoanRow, "ownerFirstName" | "borrowerFirstName">;

// The lender hears about new and cancelled requests, the borrower about decisions, returns
// and overdue reminders (same rule as convex/notifications.ts). A cancelled loan goes to
// whoever did not cancel it, which the loan row does not say, so that line names nobody.
const OWNER_EVENTS = new Set(["request.created", "request.cancelled"]);

/**
 * One line for the loan activity list, from the viewer's side: "You were e-mailed just now",
 * "Cara was e-mailed 2 hours ago", "E-mail to Cara failed, 2 hours ago".
 */
export function activityText(event: Activity, names: Names, side: Perspective, now: number = Date.now()): string {
  const when = relativeTime(event.occurredAt, now);
  const failed = event.status === "failed";

  if (event.kind === "notification" && event.eventType === "loan.cancelled") {
    return failed ? `Cancellation e-mail failed, ${when}` : `Cancellation e-mailed ${when}`;
  }

  const toOwner = event.kind === "notification" && !!event.eventType && OWNER_EVENTS.has(event.eventType);
  const isViewer = side === (toOwner ? "owner" : "borrower");
  const name = toOwner ? names.ownerFirstName : names.borrowerFirstName;

  if (event.kind === "overdue_reminder") {
    const to = isViewer ? "you" : name;
    return failed ? `Reminder to ${to} failed, ${when}` : `Reminder e-mailed to ${to} ${when}`;
  }
  if (failed) return `E-mail to ${isViewer ? "you" : name} failed, ${when}`;
  return isViewer ? `You were e-mailed ${when}` : `${name} was e-mailed ${when}`;
}
