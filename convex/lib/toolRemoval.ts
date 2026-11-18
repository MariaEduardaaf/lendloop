import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { scheduleNotification } from "./notify";

/**
 * Soft-removes a tool. Pending requests on it are closed as "declined" (the lender
 * effectively said no) and each borrower is notified. Approved loans are left alone
 * so their history and the return flow keep working.
 */
export async function removeTool(ctx: MutationCtx, tool: Doc<"tools">, actorId: Id<"users">): Promise<void> {
  const now = Date.now();
  await ctx.db.patch(tool._id, { status: "removed", removedBy: actorId, removedAt: now, updatedAt: now });

  const pending = await ctx.db
    .query("loans")
    .withIndex("by_tool_status", (q) => q.eq("toolId", tool._id).eq("status", "pending"))
    .collect();
  for (const loan of pending) {
    await ctx.db.patch(loan._id, { status: "declined", decidedAt: now });
    await scheduleNotification(ctx, loan._id, "request.declined");
  }
}
