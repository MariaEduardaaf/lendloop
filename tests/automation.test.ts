import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "../convex/_generated/api";
import { todayUtc } from "../convex/lib/dates";
import { addLoan, addTool, addUser, errorMessage, newBackend } from "./helpers";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

async function withOverdueLoan() {
  const t = newBackend();
  const ana = await addUser(t, "ana");
  const ben = await addUser(t, "ben");
  const tool = await addTool(t, ana.id);
  const loanId = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: -10, endOffset: -3, status: "approved" });
  return { t, ana, ben, tool, loanId, reminderKey: `reminder:${loanId}:${todayUtc()}` };
}

const events = (t: Awaited<ReturnType<typeof withOverdueLoan>>["t"]) => t.run((ctx) => ctx.db.query("automationEvents").collect());

describe("automation.overdueLoans", () => {
  it("returns the overdue loan with only the fields n8n needs", async () => {
    const { t, loanId, reminderKey } = await withOverdueLoan();
    const result = await t.query(internal.automation.overdueLoans, { asOf: todayUtc() });

    expect(result.asOf).toBe(todayUtc());
    expect(result.loans).toEqual([
      {
        loanId,
        reminderKey,
        borrower: { firstName: "Ben", email: "ben@example.com" },
        tool: { name: "Cordless drill" },
        endDate: expect.any(String),
        daysOverdue: 3,
      },
    ]);
  });

  it("ignores loans that are returned, pending, or not yet due", async () => {
    const { t, ana, ben, tool } = await withOverdueLoan();
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: -9, endOffset: -8, status: "returned" });
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: -9, endOffset: -8, status: "pending" });
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: -1, endOffset: 0, status: "approved" });

    expect((await t.query(internal.automation.overdueLoans, { asOf: todayUtc() })).loans).toHaveLength(1);
  });

  it("skips the loan once today's reminder was delivered, but offers a failed one again", async () => {
    const { t, loanId, reminderKey } = await withOverdueLoan();

    await t.mutation(internal.automation.recordReminder, { loanId, reminderKey, status: "failed", error: "SMTP down" });
    expect((await t.query(internal.automation.overdueLoans, { asOf: todayUtc() })).loans).toHaveLength(1);

    await t.mutation(internal.automation.recordReminder, { loanId, reminderKey, status: "sent" });
    expect((await t.query(internal.automation.overdueLoans, { asOf: todayUtc() })).loans).toHaveLength(0);
  });
});

describe("automation.recordReminder", () => {
  it("is idempotent: the same key twice creates one row", async () => {
    const { t, loanId, reminderKey } = await withOverdueLoan();

    const first = await t.mutation(internal.automation.recordReminder, { loanId, reminderKey, status: "sent" });
    const second = await t.mutation(internal.automation.recordReminder, { loanId, reminderKey, status: "sent" });

    expect(first).toEqual({ ok: true, duplicate: false });
    expect(second).toEqual({ ok: true, duplicate: true });
    const rows = await events(t);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "overdue_reminder", status: "delivered", key: reminderKey });
  });

  it("never downgrades a sent reminder to failed", async () => {
    const { t, loanId, reminderKey } = await withOverdueLoan();
    await t.mutation(internal.automation.recordReminder, { loanId, reminderKey, status: "sent" });
    await t.mutation(internal.automation.recordReminder, { loanId, reminderKey, status: "failed", error: "late retry" });
    expect((await events(t))[0]).toMatchObject({ status: "delivered" });
  });

  it("truncates the stored error and rejects an unknown loan", async () => {
    const { t, loanId, reminderKey } = await withOverdueLoan();
    await t.mutation(internal.automation.recordReminder, { loanId, reminderKey, status: "failed", error: "x".repeat(1000) });
    expect((await events(t))[0].lastError).toHaveLength(200);

    const other = await t.run(async (ctx) => {
      const id = await ctx.db.insert("loans", {
        toolId: (await ctx.db.query("tools").first())!._id,
        ownerId: (await ctx.db.query("users").first())!._id,
        borrowerId: (await ctx.db.query("users").first())!._id,
        startDate: "2026-01-01",
        endDate: "2026-01-02",
        status: "approved",
        createdAt: 0,
      });
      await ctx.db.delete(id);
      return id;
    });
    expect(
      await errorMessage(t.mutation(internal.automation.recordReminder, { loanId: other, reminderKey: `reminder:${other}:${todayUtc()}`, status: "sent" })),
    ).toBe("Loan not found");
  });
});

describe("automation.recordWorkflowError", () => {
  it("is idempotent on executionId", async () => {
    const t = newBackend();
    const body = { executionId: "1234", workflowName: "LendLoop - Overdue reminders", nodeName: "Send email", message: "SMTP refused" };

    expect(await t.mutation(internal.automation.recordWorkflowError, body)).toEqual({ ok: true, duplicate: false });
    expect(await t.mutation(internal.automation.recordWorkflowError, body)).toEqual({ ok: true, duplicate: true });

    const rows = await t.run((ctx) => ctx.db.query("workflowErrors").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ executionId: "1234", nodeName: "Send email" });
  });

  it("truncates long messages", async () => {
    const t = newBackend();
    await t.mutation(internal.automation.recordWorkflowError, { executionId: "9", workflowName: "w", message: "m".repeat(5000) });
    expect((await t.run((ctx) => ctx.db.query("workflowErrors").first()))!.message).toHaveLength(500);
  });
});
