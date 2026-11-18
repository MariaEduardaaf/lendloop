import { ConvexError, v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { roleValidator, singleLine } from "./lib/validators";

/**
 * Creates or refreshes the signed-in user's row from the Clerk identity.
 * Never touches role or trustedLender: a new user is always a plain "user".
 */
export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Sign in to continue");

    // Notifications go to this address, so an account without one cannot use the app.
    const email = identity.email?.trim().slice(0, 200);
    if (!email) throw new ConvexError("Your account has no e-mail address. Add one to your profile to use LendLoop");
    const given = singleLine(identity.givenName ?? "") || singleLine(identity.name ?? "").split(" ")[0];
    const firstName = given.slice(0, 60) || "Neighbor";

    const existing = await getCurrentUser(ctx);
    if (existing) {
      if (existing.firstName !== firstName || existing.email !== email) {
        await ctx.db.patch(existing._id, { firstName, email });
      }
      return existing._id;
    }
    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      firstName,
      email,
      role: "user",
      trustedLender: false,
      createdAt: Date.now(),
    });
  },
});

/** The current user's own profile (what the UI needs to show or hide the admin area). */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;
    return {
      _id: user._id,
      firstName: user.firstName,
      email: user.email,
      role: user.role,
      trustedLender: user.trustedLender,
    };
  },
});

/**
 * The only way to change a role. Internal, so it is reachable from the CLI or the
 * dashboard only: `npx convex run users:setRole '{"email":"a@b.com","role":"admin"}'`.
 */
export const setRole = internalMutation({
  args: { email: v.string(), role: roleValidator },
  handler: async (ctx, { email, role }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!user) throw new ConvexError("No user with that email. Sign in once first so the row exists");
    await ctx.db.patch(user._id, { role });
    await ctx.db.insert("auditLog", { action: "user.role_set", targetId: user._id, at: Date.now() });
    return { userId: user._id, role };
  },
});
