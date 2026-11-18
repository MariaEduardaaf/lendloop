import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { signedHeaders } from "./lib/hmac";
import { NOTIFICATION_TYPES, type NotificationType } from "./lib/validators";

// Convex -> n8n: request notifications. Scheduled from the mutation that changes the loan.

const MAX_ATTEMPTS = 5;
// Wait before attempt 2, 3, 4, 5: 5 s, 30 s, 2 min, 10 min.
const RETRY_DELAYS_MS = [5_000, 30_000, 120_000, 600_000];

/** eventId looks like "<loanId>:<type>" (see lib/notify.ts). */
function parseEventId(eventId: string): { loanId: string; type: NotificationType } | null {
  const [loanId, type, ...extra] = eventId.split(":");
  if (!loanId || extra.length > 0) return null;
  const known = NOTIFICATION_TYPES.find((t) => t === type);
  return known ? { loanId, type: known } : null;
}

/**
 * Builds the payload n8n receives. Data minimization: the recipient's first name and
 * email (needed to send the message), the other party's first name, the tool name and
 * the loan dates. No ids of users, no phone, no address, no description.
 */
export const buildPayload = internalQuery({
  args: { eventId: v.string() },
  handler: async (ctx, { eventId }) => {
    const parsed = parseEventId(eventId);
    if (!parsed) return null;
    const loanId = ctx.db.normalizeId("loans", parsed.loanId);
    if (!loanId) return null;
    const loan = await ctx.db.get(loanId);
    if (!loan) return null;
    const [tool, owner, borrower] = await Promise.all([
      ctx.db.get(loan.toolId),
      ctx.db.get(loan.ownerId),
      ctx.db.get(loan.borrowerId),
    ]);
    if (!tool || !owner || !borrower) return null;

    // The owner hears about new and cancelled requests, the borrower about decisions and returns.
    const ownerIsRecipient = parsed.type === "request.created" || parsed.type === "request.cancelled";
    const recipient = ownerIsRecipient ? owner : borrower;
    const counterparty = ownerIsRecipient ? borrower : owner;

    return {
      eventId,
      type: parsed.type,
      occurredAt: new Date().toISOString(),
      loanId,
      recipient: { firstName: recipient.firstName, email: recipient.email },
      counterpartyFirstName: counterparty.firstName,
      tool: { name: tool.name },
      loan: { startDate: loan.startDate, endDate: loan.endDate, status: loan.status },
    };
  },
});

/**
 * Stores the outcome of a notification. Idempotent on the key: a second call updates
 * the existing row instead of creating a new one, and a delivered row is never
 * downgraded to failed by a late duplicate.
 */
export const recordOutcome = internalMutation({
  args: {
    eventId: v.string(),
    status: v.union(v.literal("delivered"), v.literal("failed")),
    attempts: v.number(),
    lastError: v.optional(v.string()),
  },
  handler: async (ctx, { eventId, status, attempts, lastError }) => {
    const parsed = parseEventId(eventId);
    const loanId = parsed && ctx.db.normalizeId("loans", parsed.loanId);
    if (!parsed || !loanId) return;

    const key = `notification:${eventId}`;
    const existing = await ctx.db
      .query("automationEvents")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (existing) {
      if (existing.status === "delivered") {
        await ctx.db.patch(existing._id, { attempts: Math.max(existing.attempts, attempts) });
      } else {
        await ctx.db.patch(existing._id, { status, attempts, lastError, occurredAt: Date.now() });
      }
      return;
    }
    await ctx.db.insert("automationEvents", {
      loanId,
      kind: "notification",
      key,
      eventType: parsed.type,
      status,
      attempts,
      lastError,
      occurredAt: Date.now(),
    });
  },
});

/** One delivery attempt. On failure it schedules the next attempt, or records "failed" after the last. */
export const deliver = internalAction({
  args: { eventId: v.string(), attempt: v.number() },
  handler: async (ctx, { eventId, attempt }) => {
    const payload = await ctx.runQuery(internal.notifications.buildPayload, { eventId });
    if (!payload) return; // the loan or its people are gone, nothing to tell

    const url = process.env.N8N_REQUEST_WEBHOOK_URL;
    const secret = process.env.CONVEX_TO_N8N_SECRET;
    let error: string | null = null;
    let retryable = true;

    if (!url || !secret) {
      error = "Webhook is not configured";
      retryable = false; // retrying cannot fix a missing setting
    } else {
      try {
        const rawBody = JSON.stringify(payload);
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(await signedHeaders({ secret, method: "POST", pathname: new URL(url).pathname, rawBody })),
          },
          body: rawBody,
          signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) error = `HTTP ${response.status}`;
      } catch {
        error = "Network error"; // never log the payload or the exception text: they may hold personal data
      }
    }

    if (error === null) {
      await ctx.runMutation(internal.notifications.recordOutcome, { eventId, status: "delivered", attempts: attempt });
    } else if (retryable && attempt < MAX_ATTEMPTS) {
      await ctx.scheduler.runAfter(RETRY_DELAYS_MS[attempt - 1], internal.notifications.deliver, {
        eventId,
        attempt: attempt + 1,
      });
    } else {
      await ctx.runMutation(internal.notifications.recordOutcome, {
        eventId,
        status: "failed",
        attempts: attempt,
        lastError: error,
      });
    }
  },
});
