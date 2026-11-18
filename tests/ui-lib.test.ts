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
  const base = { occurredAt: minutesAgo(3) };
  it("names the notified side from the event type", () => {
    const created = { ...base, kind: "notification" as const, eventType: "request.created", status: "delivered" as const };
    expect(activityText(created, NOW)).toBe("Owner notified 3 minutes ago");
    expect(activityText({ ...created, eventType: "request.approved" }, NOW)).toBe("Borrower notified 3 minutes ago");
  });
  it("shows reminders and failures", () => {
    const reminder = { ...base, kind: "overdue_reminder" as const, eventType: undefined, status: "delivered" as const };
    expect(activityText({ ...reminder, occurredAt: minutesAgo(2 * 24 * 60) }, NOW)).toBe("Reminder sent 2 days ago");
    const failed = { ...base, kind: "notification" as const, eventType: "request.created", status: "failed" as const };
    expect(activityText(failed, NOW)).toBe("Notification failed 3 minutes ago");
    expect(activityText({ ...reminder, status: "failed" }, NOW)).toBe("Reminder failed 3 minutes ago");
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
