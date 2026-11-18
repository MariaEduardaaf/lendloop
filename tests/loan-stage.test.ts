import { describe, expect, it } from "vitest";
import { availabilitySentence, bookedText, stripCells } from "../src/lib/availability";
import { loanStage, type StageInput } from "../src/lib/loan-stage";

const TODAY = "2026-11-18"; // a Wednesday
const loan = (over: Partial<StageInput>): StageInput => ({
  status: "pending",
  startDate: "2026-11-21",
  endDate: "2026-11-23",
  ownerFirstName: "Cara",
  borrowerFirstName: "Ben",
  ...over,
});
const both = (over: Partial<StageInput>) => [loanStage(loan(over), TODAY, "borrower"), loanStage(loan(over), TODAY, "owner")];

describe("loanStage", () => {
  it("pending waits for the lender", () => {
    const [b, o] = both({});
    expect(b).toEqual({ key: "pending", group: "waiting", text: "Waiting for Cara" });
    expect(o.text).toBe("Waiting for your answer");
  });
  it("pending with past dates is expired", () => {
    const [b] = both({ startDate: "2026-11-10", endDate: "2026-11-12" });
    expect(b).toEqual({ key: "expired", group: "past", text: "Dates passed, never answered" });
  });
  it("approved before the start date is upcoming", () => {
    const [b, o] = both({ status: "approved" });
    expect(b).toEqual({ key: "upcoming", group: "upcoming", text: "Starts Sat 21 Nov" });
    expect(o.text).toBe("Starts Sat 21 Nov");
  });
  it("approved and started is out", () => {
    const [b, o] = both({ status: "approved", startDate: "2026-11-16", endDate: "2026-11-20" });
    expect(b).toEqual({ key: "out", group: "out", text: "Out now, back Fri 20 Nov" });
    expect(o.text).toBe("With Ben, back Fri 20 Nov");
  });
  it("starting today counts as out", () => {
    expect(loanStage(loan({ status: "approved", startDate: TODAY }), TODAY, "borrower").key).toBe("out");
  });
  it("due today", () => {
    const [b, o] = both({ status: "approved", startDate: "2026-11-16", endDate: TODAY });
    expect(b).toEqual({ key: "due_today", group: "out", text: "Due back today" });
    expect(o.text).toBe("With Ben, due back today");
  });
  it("late counts the days since the due date", () => {
    const [b] = both({ status: "approved", startDate: "2026-11-10", endDate: "2026-11-15" });
    expect(b).toEqual({ key: "late", group: "out", text: "3 days late, was due 15 Nov" });
    expect(loanStage(loan({ status: "approved", startDate: "2026-11-10", endDate: "2026-11-17" }), TODAY, "owner").text).toBe(
      "1 day late, was due 17 Nov",
    );
  });
  it("returned shows the return date", () => {
    const [b] = both({ status: "returned", returnedAt: Date.parse("2026-11-03T15:00:00Z") });
    expect(b).toEqual({ key: "returned", group: "past", text: "Returned 3 Nov" });
    expect(loanStage(loan({ status: "returned" }), TODAY, "owner").text).toBe("Returned");
  });
  it("declined and cancelled", () => {
    const [b, o] = both({ status: "declined" });
    expect(b).toEqual({ key: "declined", group: "past", text: "Cara declined" });
    expect(o.text).toBe("You declined");
    expect(loanStage(loan({ status: "cancelled" }), TODAY, "owner")).toEqual({ key: "cancelled", group: "past", text: "Cancelled" });
  });
});

describe("availability", () => {
  const free = { outUntil: null, late: false, bookings: [] };
  it("free with a later booking and my pending request", () => {
    const a = { ...free, bookings: [{ startDate: "2026-11-25", endDate: "2026-11-27" }], myPendingRequest: { startDate: "2026-11-19", endDate: "2026-11-20" } };
    expect(availabilitySentence(TODAY, a)).toEqual({ text: "Free now. Booked 25 to 27 Nov. You asked for 19 to 20 Nov", tone: "free" });
    expect(stripCells(TODAY, a).map((c) => c.state[0]).join("")).toBe("fmmffffbbbffff");
    expect(bookedText(TODAY, a)).toBe("Booked: 25 to 27 Nov");
    expect(bookedText(TODAY, free)).toBeNull();
  });
  it("out and late", () => {
    const out = { ...free, outUntil: "2026-11-20", bookings: [{ startDate: "2026-11-16", endDate: "2026-11-20" }] };
    expect(availabilitySentence(TODAY, out)).toEqual({ text: "Out, back Fri 20 Nov", tone: "out" });
    expect(availabilitySentence(TODAY, { ...out, outUntil: TODAY }).text).toBe("Out, due back today");
    const late = { ...free, outUntil: "2026-11-15", late: true };
    expect(availabilitySentence(TODAY, late)).toEqual({ text: "3 days late, was due 15 Nov", tone: "late" });
    expect(stripCells(TODAY, late)[0].state).toBe("booked");
    expect(bookedText(TODAY, late)).toBe("Still out and overdue.");
  });
});
