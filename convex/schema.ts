import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
  categoryValidator,
  conditionValidator,
  loanStatusValidator,
  roleValidator,
} from "./lib/validators";

// Data minimization: users hold only what the app and the notifications need.
export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    firstName: v.string(),
    email: v.string(),
    role: roleValidator,
    trustedLender: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  tools: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    category: categoryValidator,
    condition: conditionValidator,
    description: v.string(),
    // Soft delete (owner or admin) so loans keep their history.
    status: v.union(v.literal("active"), v.literal("removed")),
    removedBy: v.optional(v.id("users")),
    removedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status_category", ["status", "category"]),

  loans: defineTable({
    toolId: v.id("tools"),
    // Denormalized from the tool: indexes and authorization checks read it directly.
    ownerId: v.id("users"),
    borrowerId: v.id("users"),
    // ISO dates (YYYY-MM-DD), compared as strings.
    startDate: v.string(),
    endDate: v.string(),
    status: loanStatusValidator,
    createdAt: v.number(),
    decidedAt: v.optional(v.number()),
    returnedAt: v.optional(v.number()),
  })
    .index("by_owner", ["ownerId"])
    .index("by_borrower", ["borrowerId"])
    .index("by_tool_status", ["toolId", "status"])
    .index("by_status_endDate", ["status", "endDate"]),

  automationEvents: defineTable({
    loanId: v.id("loans"),
    kind: v.union(v.literal("notification"), v.literal("overdue_reminder")),
    // Unique idempotency key: "notification:<eventId>" or "reminder:<loanId>:<date>".
    key: v.string(),
    eventType: v.optional(v.string()),
    status: v.union(v.literal("delivered"), v.literal("failed")),
    attempts: v.number(),
    // Short and free of personal data (status code or a fixed phrase).
    lastError: v.optional(v.string()),
    occurredAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_loan", ["loanId"]),

  workflowErrors: defineTable({
    executionId: v.string(),
    workflowName: v.string(),
    nodeName: v.optional(v.string()),
    message: v.string(),
    occurredAt: v.number(),
  }).index("by_execution", ["executionId"]),

  // Admin actions only. actorId is empty for operator actions run from the CLI.
  auditLog: defineTable({
    actorId: v.optional(v.id("users")),
    action: v.union(
      v.literal("tool.removed_by_admin"),
      v.literal("user.trusted_lender_set"),
      v.literal("user.role_set"),
    ),
    targetId: v.string(),
    at: v.number(),
  }),
});
