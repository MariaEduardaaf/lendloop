import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib/auth";
import { queryDate } from "./lib/dates";
import { toolIdsOnLoan, userLookup } from "./lib/loanViews";
import { removeTool } from "./lib/toolRemoval";
import { categoryValidator, conditionValidator, LIMITS, singleLine } from "./lib/validators";

function cleanName(value: string): string {
  const name = singleLine(value);
  if (name.length < 1 || name.length > LIMITS.toolNameMax) {
    throw new ConvexError(`The name must be 1 to ${LIMITS.toolNameMax} characters`);
  }
  return name;
}

function cleanDescription(value: string): string {
  const description = value.trim();
  if (description.length < 1 || description.length > LIMITS.descriptionMax) {
    throw new ConvexError(`The description must be 1 to ${LIMITS.descriptionMax} characters`);
  }
  return description;
}

/**
 * Public landing page list. Returns name and category only: no ids, no owner data.
 * Only active tools that are not out on loan today.
 */
export const listPublic = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const today = queryDate(args.today);
    const [tools, onLoan] = await Promise.all([
      ctx.db
        .query("tools")
        .withIndex("by_status_category", (q) => q.eq("status", "active"))
        .take(200), // ponytail: no pagination, fine for a neighborhood board
      toolIdsOnLoan(ctx, today),
    ]);
    return tools.filter((t) => !onLoan.has(t._id)).map((t) => ({ name: t.name, category: t.category }));
  },
});

/** All active tools for signed-in users, with availability and the owner's first name. */
export const list = query({
  args: { today: v.string(), category: v.optional(categoryValidator) },
  handler: async (ctx, { category, ...args }) => {
    const me = await requireUser(ctx);
    const today = queryDate(args.today);
    const tools = await ctx.db
      .query("tools")
      .withIndex("by_status_category", (q) =>
        category ? q.eq("status", "active").eq("category", category) : q.eq("status", "active"),
      )
      .take(200);
    const onLoan = await toolIdsOnLoan(ctx, today);
    const users = userLookup(ctx);
    return await Promise.all(
      tools.map(async (t) => {
        const owner = await users(t.ownerId);
        return {
          _id: t._id,
          name: t.name,
          category: t.category,
          condition: t.condition,
          description: t.description,
          availability: onLoan.has(t._id) ? ("on_loan" as const) : ("available" as const),
          ownerFirstName: owner?.firstName ?? "Unknown",
          ownerTrustedLender: owner?.trustedLender ?? false,
          isMine: t.ownerId === me._id,
        };
      }),
    );
  },
});

export const myListings = query({
  args: { today: v.string() },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx);
    const today = queryDate(args.today);
    const tools = await ctx.db
      .query("tools")
      .withIndex("by_owner", (q) => q.eq("ownerId", me._id))
      .collect();
    const onLoan = await toolIdsOnLoan(ctx, today);
    return tools
      .filter((t) => t.status === "active")
      .map((t) => ({
        _id: t._id,
        name: t.name,
        category: t.category,
        condition: t.condition,
        description: t.description,
        availability: onLoan.has(t._id) ? ("on_loan" as const) : ("available" as const),
        createdAt: t.createdAt,
      }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    category: categoryValidator,
    condition: conditionValidator,
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await requireUser(ctx);
    const now = Date.now();
    return await ctx.db.insert("tools", {
      ownerId: me._id,
      name: cleanName(args.name),
      category: args.category,
      condition: args.condition,
      description: cleanDescription(args.description),
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    toolId: v.id("tools"),
    name: v.optional(v.string()),
    category: v.optional(categoryValidator),
    condition: v.optional(conditionValidator),
    description: v.optional(v.string()),
  },
  handler: async (ctx, { toolId, ...changes }) => {
    const me = await requireUser(ctx);
    const tool = await ctx.db.get(toolId);
    if (!tool || tool.status !== "active") throw new ConvexError("Tool not found");
    if (tool.ownerId !== me._id) throw new ConvexError("You can only edit your own tools");

    await ctx.db.patch(toolId, {
      ...(changes.name !== undefined && { name: cleanName(changes.name) }),
      ...(changes.category !== undefined && { category: changes.category }),
      ...(changes.condition !== undefined && { condition: changes.condition }),
      ...(changes.description !== undefined && { description: cleanDescription(changes.description) }),
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { toolId: v.id("tools") },
  handler: async (ctx, { toolId }) => {
    const me = await requireUser(ctx);
    const tool = await ctx.db.get(toolId);
    if (!tool || tool.status !== "active") throw new ConvexError("Tool not found");
    if (tool.ownerId !== me._id) throw new ConvexError("You can only remove your own tools");

    const approved = await ctx.db
      .query("loans")
      .withIndex("by_tool_status", (q) => q.eq("toolId", toolId).eq("status", "approved"))
      .first();
    if (approved) throw new ConvexError("This tool is on loan. Mark it as returned before removing it");

    await removeTool(ctx, tool, me._id);
  },
});
