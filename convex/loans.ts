import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { assertValidLoanRange, queryDate, rangesOverlap, todayUtc } from "./lib/dates";
import { toLoanRow, toolLookup, userLookup } from "./lib/loanViews";
import { scheduleNotification } from "./lib/notify";

const VIEW_LIMIT = 100;

/** Loads a loan; each mutation then checks the caller's role on it (authorization lives here, not in the UI). */
async function loadLoan(ctx: MutationCtx, loanId: Id<"loans">): Promise<Doc<"loans">> {
  const loan = await ctx.db.get(loanId);
  if (!loan) throw new ConvexError("Request not found");
  return loan;
}

export const request = mutation({
  args: { toolId: v.id("tools"), startDate: v.string(), endDate: v.string() },
  handler: async (ctx, { toolId, startDate, endDate }) => {
    const me = await requireUser(ctx);
    const tool = await ctx.db.get(toolId);
    if (!tool || tool.status !== "active") throw new ConvexError("Tool not found");
    if (tool.ownerId === me._id) throw new ConvexError("You cannot borrow your own tool");

    assertValidLoanRange(startDate, endDate, todayUtc());

    const pending = await ctx.db
      .query("loans")
      .withIndex("by_tool_status", (q) => q.eq("toolId", toolId).eq("status", "pending"))
      .collect();
    if (pending.some((l) => l.borrowerId === me._id)) {
      throw new ConvexError("You already have a pending request for this tool");
    }

    const loanId = await ctx.db.insert("loans", {
      toolId,
      ownerId: tool.ownerId,
      borrowerId: me._id,
      startDate,
      endDate,
      status: "pending",
      createdAt: Date.now(),
    });
    await scheduleNotification(ctx, loanId, "request.created");
    return loanId;
  },
});

export const approve = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const me = await requireUser(ctx);
    const loan = await loadLoan(ctx, loanId);
    if (loan.ownerId !== me._id) throw new ConvexError("Only the owner of the tool can approve this request");
    if (loan.status !== "pending") throw new ConvexError("This request is no longer pending");
    // Approving dates that are over would create a loan that is overdue from the first minute.
    if (loan.endDate < todayUtc()) throw new ConvexError("These dates have already passed. Decline the request instead");

    const approved = await ctx.db
      .query("loans")
      .withIndex("by_tool_status", (q) => q.eq("toolId", loan.toolId).eq("status", "approved"))
      .collect();
    if (approved.some((other) => rangesOverlap(loan, other))) {
      throw new ConvexError("These dates overlap another approved loan of this tool");
    }

    await ctx.db.patch(loanId, { status: "approved", decidedAt: Date.now() });
    await scheduleNotification(ctx, loanId, "request.approved");
  },
});

export const decline = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const me = await requireUser(ctx);
    const loan = await loadLoan(ctx, loanId);
    if (loan.ownerId !== me._id) throw new ConvexError("Only the owner of the tool can decline this request");
    if (loan.status !== "pending") throw new ConvexError("This request is no longer pending");

    await ctx.db.patch(loanId, { status: "declined", decidedAt: Date.now() });
    await scheduleNotification(ctx, loanId, "request.declined");
  },
});

/**
 * Borrower: cancels a pending request. Owner or borrower: cancels an approved loan that has
 * not started yet, and the other party is told.
 */
export const cancel = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const me = await requireUser(ctx);
    const loan = await loadLoan(ctx, loanId);
    const isBorrower = loan.borrowerId === me._id;
    const isOwner = loan.ownerId === me._id;

    if (loan.status === "approved") {
      if (!isBorrower && !isOwner) throw new ConvexError("Only the lender or the borrower can cancel this loan");
      if (loan.startDate <= todayUtc()) throw new ConvexError("This loan has already started. Mark it as returned instead");
      const cancelledBy = isOwner ? "owner" : "borrower";
      await ctx.db.patch(loanId, { status: "cancelled", decidedAt: Date.now(), cancelledBy });
      await scheduleNotification(ctx, loanId, "loan.cancelled");
      return;
    }

    if (!isBorrower) throw new ConvexError("You can only cancel your own requests");
    if (loan.status !== "pending") throw new ConvexError("Only pending requests and loans that have not started can be cancelled");

    await ctx.db.patch(loanId, { status: "cancelled", decidedAt: Date.now() });
    await scheduleNotification(ctx, loanId, "request.cancelled");
  },
});

export const markReturned = mutation({
  args: { loanId: v.id("loans") },
  handler: async (ctx, { loanId }) => {
    const me = await requireUser(ctx);
    const loan = await loadLoan(ctx, loanId);
    if (loan.ownerId !== me._id) throw new ConvexError("Only the lender can mark a loan as returned");
    if (loan.status !== "approved") throw new ConvexError("Only approved loans can be marked as returned");
    if (loan.startDate > todayUtc()) throw new ConvexError("This loan has not started yet. Cancel it instead");

    await ctx.db.patch(loanId, { status: "returned", returnedAt: Date.now() });
    await scheduleNotification(ctx, loanId, "loan.returned");
  },
});

/** Requests I made as a borrower, newest first. */
export const myRequests = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx);
    const today = queryDate(args.today);
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_borrower", (q) => q.eq("borrowerId", me._id))
      .order("desc")
      .take(VIEW_LIMIT);
    const lookups = { user: userLookup(ctx), tool: toolLookup(ctx) };
    return await Promise.all(loans.map((l) => toLoanRow(ctx, l, today, lookups)));
  },
});

/** Requests on my tools, newest first, with counts about each borrower to help the owner decide. */
export const incoming = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx);
    const today = queryDate(args.today);
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_owner", (q) => q.eq("ownerId", me._id))
      .order("desc")
      .take(VIEW_LIMIT);
    const lookups = { user: userLookup(ctx), tool: toolLookup(ctx) };
    // Counts only, never tool names or other people. Cached so each borrower is read once.
    const histories = new Map<Id<"users">, Promise<{ returned: number; returnedLate: number }>>();
    const history = (borrowerId: Id<"users">) => {
      if (!histories.has(borrowerId)) {
        histories.set(
          borrowerId,
          ctx.db
            .query("loans")
            .withIndex("by_borrower", (q) => q.eq("borrowerId", borrowerId))
            .take(1000) // Capped instead of paginated, enough for one neighbor's history.
            .then((all) => {
              const returned = all.filter((l) => l.status === "returned");
              return {
                returned: returned.length,
                returnedLate: returned.filter((l) => l.returnedAt !== undefined && todayUtc(l.returnedAt) > l.endDate).length,
              };
            }),
        );
      }
      return histories.get(borrowerId)!;
    };
    return await Promise.all(
      loans.map(async (l) => ({
        ...(await toLoanRow(ctx, l, today, lookups)),
        borrowerTrustedLender: (await lookups.user(l.borrowerId))?.trustedLender ?? false,
        borrowerHistory: await history(l.borrowerId),
      })),
    );
  },
});

/** Number of pending requests on my tools, for the nav badge. */
export const pendingIncomingCount = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireUser(ctx);
    const loans = await ctx.db
      .query("loans")
      .withIndex("by_owner", (q) => q.eq("ownerId", me._id))
      .take(1000); // Capped instead of paginated, enough for one neighbor's tools.
    return loans.filter((l) => l.status === "pending").length;
  },
});
