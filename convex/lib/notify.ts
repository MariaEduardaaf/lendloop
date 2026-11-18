import type { Id } from "../_generated/dataModel";
import { internal } from "../_generated/api";
import type { MutationCtx } from "../_generated/server";
import type { NotificationType } from "./validators";

/**
 * Schedules the n8n notification for a status transition. Called inside the same
 * mutation that changes the loan, so the transition and the notification commit
 * together (a rolled back mutation schedules nothing).
 *
 * eventId is stable per loan and type (each transition happens at most once per
 * loan), so retries and duplicates reuse the same idempotency key.
 */
export async function scheduleNotification(
  ctx: MutationCtx,
  loanId: Id<"loans">,
  type: NotificationType,
): Promise<void> {
  await ctx.scheduler.runAfter(0, internal.notifications.deliver, {
    eventId: `${loanId}:${type}`,
    attempt: 1,
  });
}
