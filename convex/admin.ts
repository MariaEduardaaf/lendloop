import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/auth";
import { todayUtc } from "./lib/dates";
import { toLoanRow, toolLookup, userLookup } from "./lib/loanViews";
import { removeTool as softRemoveTool } from "./lib/toolRemoval";

// Every function here starts with requireAdmin: the role is checked on the server.

const LIST_LIMIT = 200;

export const listAllLoans = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const loans = await ctx.db.query("loans").order("desc").take(LIST_LIMIT);
    const today = todayUtc();
    const lookups = { user: userLookup(ctx), tool: toolLookup(ctx) };
    return await Promise.all(loans.map((l) => toLoanRow(ctx, l, today, lookups)));
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").take(LIST_LIMIT);
    return users.map((u) => ({
      _id: u._id,
      firstName: u.firstName,
      email: u.email,
      role: u.role,
      trustedLender: u.trustedLender,
    }));
  },
});

export const removeTool = mutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, { toolId }) => {
    const admin = await requireAdmin(ctx);
    const tool = await ctx.db.get(toolId);
    if (!tool || tool.status !== "active") throw new ConvexError("Tool not found");

    await softRemoveTool(ctx, tool, admin._id);
    await ctx.db.insert("auditLog", {
      actorId: admin._id,
      action: "tool.removed_by_admin",
      targetId: toolId,
      at: Date.now(),
    });
  },
});

export const setTrustedLender = mutation({
  args: { userId: v.id("users"), value: v.boolean() },
  handler: async (ctx, { userId, value }) => {
    const admin = await requireAdmin(ctx);
    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError("User not found");

    await ctx.db.patch(userId, { trustedLender: value });
    await ctx.db.insert("auditLog", {
      actorId: admin._id,
      action: "user.trusted_lender_set",
      targetId: userId,
      at: Date.now(),
    });
  },
});

/** Recent failures reported by the n8n error workflow. */
export const listWorkflowErrors = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const errors = await ctx.db.query("workflowErrors").order("desc").take(50);
    return errors.map((e) => ({
      _id: e._id,
      workflowName: e.workflowName,
      nodeName: e.nodeName,
      message: e.message,
      occurredAt: e.occurredAt,
    }));
  },
});
