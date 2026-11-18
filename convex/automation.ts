import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { daysBetween, todayUtc } from "./lib/dates";

// Internal functions behind the n8n -> Convex HTTP endpoints (see http.ts).
// They are internal so the only way in is a request with a valid signature.

const OVERDUE_LIMIT = 500;

const reminderKeyFor = (loanId: string, day: string) => `reminder:${loanId}:${day}`;

/**
 * Approved, unreturned loans whose end date has passed. A loan is skipped once a
 * reminder with today's key was delivered, so a manual re-run the same day does not
 * email the borrower twice. A failed reminder is offered again.
 */
export const overdueLoans = internalQuery({
  args: {},
  handler: async (ctx) => {
    const asOf = todayUtc();
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_status_endDate", (q) => q.eq("status", "approved").lt("endDate", asOf))
      .take(OVERDUE_LIMIT);

    const result = [];
    for (const loan of loans) {
      const reminderKey = reminderKeyFor(loan._id, asOf);
      const existing = await ctx.db
        .query("automationEvents")
        .withIndex("by_key", (q) => q.eq("key", reminderKey))
        .unique();
      if (existing?.status === "delivered") continue;

      const [borrower, tool] = await Promise.all([ctx.db.get(loan.borrowerId), ctx.db.get(loan.toolId)]);
      if (!borrower || !tool) continue;
      result.push({
        loanId: loan._id,
        reminderKey,
        borrower: { firstName: borrower.firstName, email: borrower.email },
        tool: { name: tool.name },
        endDate: loan.endDate,
        daysOverdue: daysBetween(loan.endDate, asOf),
      });
    }
    return { asOf, loans: result };
  },
});

/**
 * Idempotent write-back of a reminder result. The key is unique, so a retry from n8n
 * updates the same row ("duplicate": true) and never creates a second reminder.
 * A failed row can be upgraded to sent by a later attempt, a sent row is never downgraded.
 */
export const recordReminder = internalMutation({
  args: {
    loanId: v.string(),
    reminderKey: v.string(),
    status: v.union(v.literal("sent"), v.literal("failed")),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { loanId, reminderKey, status, error }) => {
    const id = ctx.db.normalizeId("loans", loanId);
    if (!id || !(await ctx.db.get(id))) throw new ConvexError("Loan not found");

    const outcome = status === "sent" ? ("delivered" as const) : ("failed" as const);
    const lastError = outcome === "failed" ? (error ?? "Reminder failed").slice(0, 200) : undefined;

    const existing = await ctx.db
      .query("automationEvents")
      .withIndex("by_key", (q) => q.eq("key", reminderKey))
      .unique();
    if (existing) {
      if (existing.status !== "delivered") {
        await ctx.db.patch(existing._id, {
          status: outcome,
          attempts: existing.attempts + 1,
          lastError,
          occurredAt: Date.now(),
        });
      }
      return { ok: true, duplicate: true };
    }
    await ctx.db.insert("automationEvents", {
      loanId: id,
      kind: "overdue_reminder",
      key: reminderKey,
      status: outcome,
      attempts: 1,
      lastError,
      occurredAt: Date.now(),
    });
    return { ok: true, duplicate: false };
  },
});

/** Idempotent on executionId: n8n retrying the error workflow does not duplicate rows. */
export const recordWorkflowError = internalMutation({
  args: {
    executionId: v.string(),
    workflowName: v.string(),
    nodeName: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("workflowErrors")
      .withIndex("by_execution", (q) => q.eq("executionId", args.executionId))
      .first();
    if (existing) return { ok: true, duplicate: true };

    await ctx.db.insert("workflowErrors", {
      executionId: args.executionId,
      workflowName: args.workflowName.slice(0, 100),
      nodeName: args.nodeName?.slice(0, 100),
      message: args.message.slice(0, 500),
      occurredAt: Date.now(),
    });
    return { ok: true, duplicate: false };
  },
});
