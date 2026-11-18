import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import { activityText } from "../src/lib/activity";
import { errorMessage } from "../src/lib/errors";
import { loanDateBounds, relativeTime } from "../src/lib/format";
import { CATEGORIES, CATEGORY_LABELS } from "../src/lib/labels";

const NOW = Date.parse("2026-11-18T12:00:00.000Z");
const minutesAgo = (n: number) => NOW - n * 60_000;

describe("relativeTime", () => {
  it("formats minutes, hours and days", () => {
    expect(relativeTime(minutesAgo(3), NOW)).toBe("3 minutes ago");
    expect(relativeTime(minutesAgo(60), NOW)).toBe("1 hour ago");
    expect(relativeTime(minutesAgo(2 * 24 * 60), NOW)).toBe("2 days ago");
  });
  it("says just now under a minute", () => {
    expect(relativeTime(NOW - 10_000, NOW)).toBe("just now");
  });
});

describe("activityText", () => {
  const names = { ownerFirstName: "Cara", borrowerFirstName: "Ben" };
  const created = { occurredAt: NOW - 10_000, kind: "notification" as const, eventType: "request.created", status: "delivered" as const };
  const approved = { ...created, eventType: "request.approved", occurredAt: minutesAgo(120) };
  it("speaks from the viewer's side", () => {
    expect(activityText(created, names, "owner", NOW)).toBe("You were e-mailed just now");
    expect(activityText(created, names, "borrower", NOW)).toBe("Cara was e-mailed just now");
    expect(activityText(approved, names, "owner", NOW)).toBe("Ben was e-mailed 2 hours ago");
    expect(activityText(approved, names, "borrower", NOW)).toBe("You were e-mailed 2 hours ago");
    expect(activityText(approved, names, "admin", NOW)).toBe("Ben was e-mailed 2 hours ago");
  });
  it("keeps failures visible", () => {
    expect(activityText({ ...created, status: "failed" }, names, "borrower", NOW)).toBe("E-mail to Cara failed, just now");
    expect(activityText({ ...approved, status: "failed" }, names, "borrower", NOW)).toBe("E-mail to you failed, 2 hours ago");
  });
  it("shows reminders and cancelled loans", () => {
    const reminder = { ...created, kind: "overdue_reminder" as const, eventType: undefined, occurredAt: minutesAgo(2 * 24 * 60) };
    expect(activityText(reminder, names, "owner", NOW)).toBe("Reminder e-mailed to Ben 2 days ago");
    expect(activityText(reminder, names, "borrower", NOW)).toBe("Reminder e-mailed to you 2 days ago");
    expect(activityText({ ...reminder, status: "failed" }, names, "owner", NOW)).toBe("Reminder to Ben failed, 2 days ago");
    expect(activityText({ ...approved, eventType: "loan.cancelled" }, names, "owner", NOW)).toBe("Cancellation e-mailed 2 hours ago");
  });
});

describe("errorMessage", () => {
  it("shows ConvexError text and hides anything else", () => {
    expect(errorMessage(new ConvexError("Only the owner can approve"))).toBe("Only the owner can approve");
    expect(errorMessage(new Error("socket hang up"))).toBe("Something went wrong. Please try again.");
  });
});

describe("loanDateBounds", () => {
  it("matches the backend limits", () => {
    expect(loanDateBounds("2026-11-18", "")).toEqual({
      startMin: "2026-11-18",
      startMax: "2027-02-16",
      endMin: "2026-11-18",
      endMax: "2026-12-17",
    });
    expect(loanDateBounds("2026-11-18", "2026-12-01").endMax).toBe("2026-12-30");
  });
});

describe("labels", () => {
  it("labels every category from the validator", () => {
    for (const c of CATEGORIES) expect(CATEGORY_LABELS[c]).toBeTruthy();
  });
});
