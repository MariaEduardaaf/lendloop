import { ConvexError, v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { signedHeaders } from "./lib/hmac";
import { NOTIFICATION_TYPES, type NotificationType } from "./lib/validators";

// Convex -> n8n: request notifications. Scheduled from the mutation that changes the loan.
//
// The hand-off is asynchronous on purpose. n8n answers 2xx as soon as it has verified
// the signature and stored the event id, then sends the message and reports the result
// to POST /n8n/notifications. If the webhook answered only after the e-mail went out,
// a slow mail server would let this request time out while n8n is still working, and
// the retry would be acknowledged as a duplicate of an attempt that later fails.

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
 * Builds the payload n8n receives, with only what the message needs: the event id and
 * type, the recipient's first name and e-mail, the other party's first name, the tool
 * name and the loan dates. No ids of users, no status, no description.
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
    // A cancelled loan goes to whoever did not cancel it.
    const ownerIsRecipient =
      parsed.type === "request.created" ||
      parsed.type === "request.cancelled" ||
      (parsed.type === "loan.cancelled" && loan.cancelledBy === "borrower");
    const recipient = ownerIsRecipient ? owner : borrower;
    const counterparty = ownerIsRecipient ? borrower : owner;

    return {
      eventId,
      type: parsed.type,
      recipient: { firstName: recipient.firstName, email: recipient.email },
      counterpartyFirstName: counterparty.firstName,
      tool: { name: tool.name },
      loan: { startDate: loan.startDate, endDate: loan.endDate },
    };
  },
});

/**
 * Stores the outcome of a notification. Idempotent on the key: a second report updates
 * the existing row instead of creating a new one, a failed row can be upgraded to
 * delivered by a later report, and a delivered row is never downgraded.
 *
 * Two callers: n8n reports what happened to the message (POST /n8n/notifications), and
 * `deliver` records a failure when the event never reached n8n.
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
    if (!parsed || !loanId || !(await ctx.db.get(loanId))) throw new ConvexError("Unknown event");

    const key = `notification:${eventId}`;
    const error = status === "failed" ? (lastError ?? "Notification failed").slice(0, 200) : undefined;
    const existing = await ctx.db
      .query("automationEvents")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (existing) {
      if (existing.status !== "delivered") {
        await ctx.db.patch(existing._id, { status, attempts, lastError: error, occurredAt: Date.now() });
      }
      return { ok: true, duplicate: true };
    }
    await ctx.db.insert("automationEvents", {
      loanId,
      kind: "notification",
      key,
      eventType: parsed.type,
      status,
      attempts,
      lastError: error,
      occurredAt: Date.now(),
    });
    return { ok: true, duplicate: false };
  },
});

/**
 * One attempt to hand the event to n8n. A 2xx answer means n8n accepted it and will
 * report the result itself, so nothing is recorded here. On failure this schedules
 * the next attempt, or records "failed" after the last one.
 */
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
        if (!response.ok) {
          error = `HTTP ${response.status}`;
          // A 4xx means n8n rejected the event (signature or payload). Sending it again cannot help.
          retryable = response.status >= 500 || response.status === 408 || response.status === 429;
        }
      } catch {
        error = "Network error"; // never log the payload or the exception text: they may hold personal data
      }
    }

    if (error === null) return;
    if (retryable && attempt < MAX_ATTEMPTS) {
      await ctx.scheduler.runAfter(RETRY_DELAYS_MS[attempt - 1], internal.notifications.deliver, {
        eventId,
        attempt: attempt + 1,
      });
      return;
    }
    await ctx.runMutation(internal.notifications.recordOutcome, {
      eventId,
      status: "failed",
      attempts: attempt,
      lastError: error,
    });
  },
});
