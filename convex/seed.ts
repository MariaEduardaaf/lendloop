import { internalMutation } from "./_generated/server";
import { todayUtc } from "./lib/dates";

const DAY_MS = 86_400_000;

const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00.000Z`) + days * DAY_MS).toISOString().slice(0, 10);

/**
 * Demo data for a first run: `npx convex run seed:demo`.
 * Three fake neighbors (example.com addresses), eight tools, and loans in every
 * status, including one overdue loan so the reminder workflow has something to do.
 * Idempotent: does nothing if the demo users already exist. Loans are inserted
 * directly, so seeding does not trigger notifications.
 */
export const demo = internalMutation({
  args: {},
  handler: async (ctx) => {
    const marker = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", "demo|ana"))
      .unique();
    if (marker) return { seeded: false };

    const now = Date.now();
    const today = todayUtc(now);
    const newUser = (key: string, firstName: string) =>
      ctx.db.insert("users", {
        tokenIdentifier: `demo|${key}`,
        firstName,
        email: `${key}@example.com`,
        role: "user",
        trustedLender: key === "ana",
        createdAt: now,
      });
    const ana = await newUser("ana", "Ana");
    const ben = await newUser("ben", "Ben");
    const cara = await newUser("cara", "Cara");

    const newTool = (
      ownerId: typeof ana,
      name: string,
      category: "power_tools" | "hand_tools" | "garden" | "kitchen" | "camping" | "cleaning" | "other",
      condition: "like_new" | "good" | "fair" | "worn",
      description: string,
    ) =>
      ctx.db.insert("tools", {
        ownerId,
        name,
        category,
        condition,
        description,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });

    const drill = await newTool(ana, "Cordless drill", "power_tools", "good", "18V drill with two batteries and a bit set.");
    const sander = await newTool(ana, "Orbital sander", "power_tools", "like_new", "Dust bag included, sandpaper not.");
    const ladder = await newTool(ana, "Step ladder", "hand_tools", "fair", "Four steps, folds flat.");
    const mower = await newTool(ben, "Lawn mower", "garden", "good", "Electric, 40 cm cut. Bring your own extension cord.");
    const shears = await newTool(ben, "Hedge shears", "garden", "worn", "Sharp enough, handles are a bit loose.");
    const mixer = await newTool(cara, "Stand mixer", "kitchen", "like_new", "5 litre bowl, dough hook and whisk.");
    const tent = await newTool(cara, "4-person tent", "camping", "good", "Easy to pitch, small repair on the floor.");
    await newTool(cara, "Carpet cleaner", "cleaning", "fair", "Rents for 40 a day at the shop, free here.");

    const newLoan = (
      toolId: typeof drill,
      ownerId: typeof ana,
      borrowerId: typeof ana,
      startOffset: number,
      endOffset: number,
      status: "pending" | "approved" | "declined" | "cancelled" | "returned",
    ) =>
      ctx.db.insert("loans", {
        toolId,
        ownerId,
        borrowerId,
        startDate: addDays(today, startOffset),
        endDate: addDays(today, endOffset),
        status,
        createdAt: now,
        ...(status !== "pending" && { decidedAt: now }),
        ...(status === "returned" && { returnedAt: now }),
      });

    // Overdue: approved, ended 3 days ago, not returned. Shows up in the daily reminder run.
    const overdue = await newLoan(drill, ana, ben, -10, -3, "approved");
    // Out on loan right now.
    const active = await newLoan(mower, ben, cara, -1, 2, "approved");
    // One of each other state.
    const pending = await newLoan(ladder, ana, cara, 3, 5, "pending");
    const declined = await newLoan(sander, ana, ben, 5, 6, "declined");
    const cancelled = await newLoan(tent, cara, ben, 10, 12, "cancelled");
    const returned = await newLoan(mixer, cara, ana, -20, -15, "returned");
    await newLoan(shears, ben, ana, 7, 9, "approved");

    const note = (loanId: typeof overdue, type: string, minutesAgo: number) =>
      ctx.db.insert("automationEvents", {
        loanId,
        kind: "notification",
        key: `notification:${loanId}:${type}`,
        eventType: type,
        status: "delivered",
        attempts: 1,
        occurredAt: now - minutesAgo * 60_000,
      });
    await note(overdue, "request.approved", 60 * 24 * 10);
    await note(active, "request.approved", 60 * 24);
    await note(pending, "request.created", 3);
    await note(declined, "request.declined", 60);
    await note(cancelled, "request.cancelled", 60 * 5);
    await note(returned, "loan.returned", 60 * 24 * 15);

    return { seeded: true };
  },
});
