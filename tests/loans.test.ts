import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { todayUtc } from "../convex/lib/dates";
import { api } from "../convex/_generated/api";
import { addLoan, addTool, addUser, errorMessage, inDays, newBackend } from "./helpers";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function setup() {
  const t = newBackend();
  const ana = await addUser(t, "ana"); // owner
  const ben = await addUser(t, "ben"); // borrower
  const cara = await addUser(t, "cara"); // bystander
  const tool = await addTool(t, ana.id);
  return { t, ana, ben, cara, tool };
}

const scheduledCount = (t: Awaited<ReturnType<typeof setup>>["t"]) =>
  t.run(async (ctx) => (await ctx.db.system.query("_scheduled_functions").collect()).length);

describe("loans.request", () => {
  it("creates a pending request and schedules the notification", async () => {
    const { t, ben, tool } = await setup();
    const loanId = await ben.as.mutation(api.loans.request, { toolId: tool, startDate: inDays(1), endDate: inDays(3) });

    expect(await t.run((ctx) => ctx.db.get(loanId))).toMatchObject({ status: "pending", borrowerId: ben.id });
    expect(await scheduledCount(t)).toBe(1);
  });

  it("rejects your own tool", async () => {
    const { ana, tool } = await setup();
    expect(await errorMessage(ana.as.mutation(api.loans.request, { toolId: tool, startDate: inDays(1), endDate: inDays(2) }))).toMatch(
      /own tool/,
    );
  });

  it("rejects bad dates", async () => {
    const { ben, tool } = await setup();
    const ask = (startDate: string, endDate: string) =>
      errorMessage(ben.as.mutation(api.loans.request, { toolId: tool, startDate, endDate }));

    expect(await ask(inDays(-1), inDays(1))).toMatch(/in the past/);
    expect(await ask(inDays(3), inDays(2))).toMatch(/before the start/);
    expect(await ask(inDays(1), inDays(31))).toMatch(/at most 30 days/); // 31 days inclusive
    expect(await ask(inDays(91), inDays(92))).toMatch(/90 days ahead/);
    expect(await ask("tomorrow", "later")).toMatch(/Dates must look like/);
  });

  it("allows exactly 30 days and today as start", async () => {
    const { ben, tool } = await setup();
    await expect(
      ben.as.mutation(api.loans.request, { toolId: tool, startDate: inDays(0), endDate: inDays(29) }),
    ).resolves.toBeDefined();
  });

  it("rejects a second pending request for the same tool", async () => {
    const { ben, tool } = await setup();
    await ben.as.mutation(api.loans.request, { toolId: tool, startDate: inDays(1), endDate: inDays(2) });
    expect(await errorMessage(ben.as.mutation(api.loans.request, { toolId: tool, startDate: inDays(5), endDate: inDays(6) }))).toMatch(
      /already have a pending/,
    );
  });

  it("rejects removed tools", async () => {
    const { t, ben, tool } = await setup();
    await t.run((ctx) => ctx.db.patch(tool, { status: "removed" }));
    expect(await errorMessage(ben.as.mutation(api.loans.request, { toolId: tool, startDate: inDays(1), endDate: inDays(2) }))).toBe(
      "Tool not found",
    );
  });
});

describe("approve and decline", () => {
  it("only the owner can approve or decline", async () => {
    const { t, ana, ben, cara, tool } = await setup();
    const loan = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 1, endOffset: 2, status: "pending" });

    expect(await errorMessage(ben.as.mutation(api.loans.approve, { loanId: loan }))).toMatch(/Only the owner/);
    expect(await errorMessage(cara.as.mutation(api.loans.approve, { loanId: loan }))).toMatch(/Only the owner/);
    expect(await errorMessage(ben.as.mutation(api.loans.decline, { loanId: loan }))).toMatch(/Only the owner/);
    expect(await t.run((ctx) => ctx.db.get(loan))).toMatchObject({ status: "pending" });

    await ana.as.mutation(api.loans.approve, { loanId: loan });
    expect(await t.run((ctx) => ctx.db.get(loan))).toMatchObject({ status: "approved" });
    expect(await scheduledCount(t)).toBe(1);
  });

  it("decline moves a pending request to declined, once", async () => {
    const { t, ana, ben, tool } = await setup();
    const loan = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 1, endOffset: 2, status: "pending" });
    await ana.as.mutation(api.loans.decline, { loanId: loan });
    expect(await t.run((ctx) => ctx.db.get(loan))).toMatchObject({ status: "declined" });
    expect(await errorMessage(ana.as.mutation(api.loans.decline, { loanId: loan }))).toMatch(/no longer pending/);
  });

  it("approve rejects a request whose dates have passed, decline still works", async () => {
    const { t, ana, ben, tool } = await setup();
    const over = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: -5, endOffset: -1, status: "pending" });
    const started = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: -1, endOffset: 0, status: "pending" });

    expect(await errorMessage(ana.as.mutation(api.loans.approve, { loanId: over }))).toMatch(/already passed/);
    expect(await t.run((ctx) => ctx.db.get(over))).toMatchObject({ status: "pending" });
    expect(await scheduledCount(t)).toBe(0);

    const rows = await ana.as.query(api.loans.incoming, { today: todayUtc() });
    expect(rows.find((r) => r._id === over)).toMatchObject({ expired: true, overdue: false });
    expect(rows.find((r) => r._id === started)).toMatchObject({ expired: false });

    // A range that has started but not ended can still be approved, and the stale one declined.
    await expect(ana.as.mutation(api.loans.approve, { loanId: started })).resolves.toBeNull();
    await expect(ana.as.mutation(api.loans.decline, { loanId: over })).resolves.toBeNull();
  });

  it("approve rejects an overlapping approved loan", async () => {
    const { t, ana, ben, cara, tool } = await setup();
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: cara.id, startOffset: 2, endOffset: 5, status: "approved" });
    const overlapping = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 5, endOffset: 7, status: "pending" });
    const free = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 6, endOffset: 8, status: "pending" });

    expect(await errorMessage(ana.as.mutation(api.loans.approve, { loanId: overlapping }))).toMatch(/overlap/);
    await expect(ana.as.mutation(api.loans.approve, { loanId: free })).resolves.toBeNull();
  });

  it("a returned loan no longer blocks the same dates", async () => {
    const { t, ana, ben, cara, tool } = await setup();
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: cara.id, startOffset: 1, endOffset: 5, status: "returned" });
    const loan = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 2, endOffset: 3, status: "pending" });
    await expect(ana.as.mutation(api.loans.approve, { loanId: loan })).resolves.toBeNull();
  });
});

describe("cancel and return", () => {
  it("only the borrower can cancel, and only while pending", async () => {
    const { t, ana, ben, tool } = await setup();
    const loan = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 1, endOffset: 2, status: "pending" });

    expect(await errorMessage(ana.as.mutation(api.loans.cancel, { loanId: loan }))).toMatch(/your own requests/);
    await ben.as.mutation(api.loans.cancel, { loanId: loan });
    expect(await t.run((ctx) => ctx.db.get(loan))).toMatchObject({ status: "cancelled" });
    expect(await errorMessage(ben.as.mutation(api.loans.cancel, { loanId: loan }))).toMatch(/Only pending/);
  });

  it("an approved loan cannot be cancelled by the borrower", async () => {
    const { t, ana, ben, tool } = await setup();
    const loan = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 1, endOffset: 2, status: "approved" });
    expect(await errorMessage(ben.as.mutation(api.loans.cancel, { loanId: loan }))).toMatch(/Only pending/);
  });

  it("only the owner can mark a loan as returned", async () => {
    const { t, ana, ben, tool } = await setup();
    const loan = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: -2, endOffset: 1, status: "approved" });

    expect(await errorMessage(ben.as.mutation(api.loans.markReturned, { loanId: loan }))).toMatch(/Only the lender/);
    await ana.as.mutation(api.loans.markReturned, { loanId: loan });
    expect(await t.run((ctx) => ctx.db.get(loan))).toMatchObject({ status: "returned" });
    expect(await errorMessage(ana.as.mutation(api.loans.markReturned, { loanId: loan }))).toMatch(/Only approved/);
  });
});

describe("loan views", () => {
  it("each side only sees its own loans, with the activity line", async () => {
    const { t, ana, ben, cara, tool } = await setup();
    const loan = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: -5, endOffset: -1, status: "approved" });
    await t.run((ctx) =>
      ctx.db.insert("automationEvents", {
        loanId: loan,
        kind: "overdue_reminder",
        key: `reminder:${loan}:${inDays(0)}`,
        status: "delivered",
        attempts: 1,
        occurredAt: Date.now(),
      }),
    );

    const mine = await ben.as.query(api.loans.myRequests, { today: todayUtc() });
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ toolName: "Cordless drill", ownerFirstName: "Ana", overdue: true });
    expect(mine[0].activity[0]).toMatchObject({ kind: "overdue_reminder", status: "delivered" });
    // No email or user id of the other party in the row.
    expect(JSON.stringify(mine[0])).not.toContain("example.com");

    expect(await ana.as.query(api.loans.incoming, { today: todayUtc() })).toHaveLength(1);
    expect(await cara.as.query(api.loans.incoming, { today: todayUtc() })).toHaveLength(0);
    expect(await cara.as.query(api.loans.myRequests, { today: todayUtc() })).toHaveLength(0);
  });
});
