import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { addDays, rangesOverlap } from "./dates";

// Helpers shared by the queries that return loans and tool availability.

const ACTIVITY_LIMIT = 5;

/** Tool ids that are out on loan today: approved, not returned, started already. */
export async function toolIdsOnLoan(ctx: QueryCtx, today: string): Promise<Set<Id<"tools">>> {
  const approved = await ctx.db
    .query("loans")
    .withIndex("by_status_endDate", (q) => q.eq("status", "approved"))
    .take(1000); // Capped instead of paginated, enough for a neighborhood board.
  return new Set(approved.filter((l) => l.startDate <= today).map((l) => l.toolId));
}

const BOOKING_WINDOW_DAYS = 14;

export type ToolAvailability = {
  outUntil: string | null;
  late: boolean;
  bookings: { startDate: string; endDate: string }[];
};

/**
 * Per tool: the approved loan that is out now (outUntil, late) and the approved loans that
 * touch the next 14 days. Dates only, never who borrowed: every signed-in user sees the board.
 */
export async function availabilityByTool(ctx: QueryCtx, today: string) {
  const approved = await ctx.db
    .query("loans")
    .withIndex("by_status_endDate", (q) => q.eq("status", "approved"))
    .take(1000); // Capped instead of paginated, enough for a neighborhood board.
  const window = { startDate: today, endDate: addDays(today, BOOKING_WINDOW_DAYS - 1) };
  const byTool = new Map<Id<"tools">, ToolAvailability>();
  for (const l of approved.sort((a, b) => a.startDate.localeCompare(b.startDate))) {
    const entry = byTool.get(l.toolId) ?? { outUntil: null, late: false, bookings: [] };
    byTool.set(l.toolId, entry);
    if (l.startDate <= today) {
      entry.outUntil = l.endDate;
      entry.late = l.endDate < today;
    }
    if (rangesOverlap(l, window)) entry.bookings.push({ startDate: l.startDate, endDate: l.endDate });
  }
  return (toolId: Id<"tools">): ToolAvailability =>
    byTool.get(toolId) ?? { outUntil: null, late: false, bookings: [] };
}

/** Most recent automation events of a loan, newest first, for the activity line. */
export async function recentActivity(ctx: QueryCtx, loanId: Id<"loans">) {
  const events = await ctx.db
    .query("automationEvents")
    .withIndex("by_loan", (q) => q.eq("loanId", loanId))
    .order("desc")
    .take(ACTIVITY_LIMIT);
  return events
    .map((e) => ({
      kind: e.kind,
      eventType: e.eventType,
      status: e.status,
      occurredAt: e.occurredAt,
    }))
    .sort((a, b) => b.occurredAt - a.occurredAt);
}

/** Small per-request cache so a list of loans reads each user or tool once. */
export function userLookup(ctx: QueryCtx) {
  const cache = new Map<Id<"users">, Doc<"users"> | null>();
  return async (id: Id<"users">) => {
    if (!cache.has(id)) cache.set(id, await ctx.db.get(id));
    return cache.get(id) ?? null;
  };
}

export function toolLookup(ctx: QueryCtx) {
  const cache = new Map<Id<"tools">, Doc<"tools"> | null>();
  return async (id: Id<"tools">) => {
    if (!cache.has(id)) cache.set(id, await ctx.db.get(id));
    return cache.get(id) ?? null;
  };
}

/** Loan row for views: only the fields the screens need, names instead of ids of people. */
export async function toLoanRow(
  ctx: QueryCtx,
  loan: Doc<"loans">,
  today: string,
  lookups: {
    user: (id: Id<"users">) => Promise<Doc<"users"> | null>;
    tool: (id: Id<"tools">) => Promise<Doc<"tools"> | null>;
  },
) {
  const [tool, owner, borrower, activity] = await Promise.all([
    lookups.tool(loan.toolId),
    lookups.user(loan.ownerId),
    lookups.user(loan.borrowerId),
    recentActivity(ctx, loan._id),
  ]);
  return {
    _id: loan._id,
    toolId: loan.toolId,
    toolName: tool?.name ?? "Removed tool",
    toolCategory: tool?.category ?? "other",
    ownerFirstName: owner?.firstName ?? "Unknown",
    borrowerFirstName: borrower?.firstName ?? "Unknown",
    startDate: loan.startDate,
    endDate: loan.endDate,
    status: loan.status,
    overdue: loan.status === "approved" && loan.endDate < today,
    // A request nobody answered in time. It can no longer be approved, only declined or cancelled.
    expired: loan.status === "pending" && loan.endDate < today,
    createdAt: loan.createdAt,
    decidedAt: loan.decidedAt,
    returnedAt: loan.returnedAt,
    activity,
  };
}
