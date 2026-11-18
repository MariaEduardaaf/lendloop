import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { todayUtc } from "../convex/lib/dates";
import { api } from "../convex/_generated/api";
import { addLoan, addTool, addUser, errorMessage, inDays, newBackend } from "./helpers";

// Fake timers keep scheduled notifications pending: no test sends anything.
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("tools.listPublic", () => {
  it("exposes only name and category", async () => {
    const t = newBackend();
    const ana = await addUser(t, "ana");
    await addTool(t, ana.id, "Cordless drill");

    const tools = await t.query(api.tools.listPublic, { today: todayUtc() });
    expect(tools).toEqual([{ name: "Cordless drill", category: "power_tools" }]);
  });

  it("hides removed tools and tools that are on loan", async () => {
    const t = newBackend();
    const ana = await addUser(t, "ana");
    const ben = await addUser(t, "ben");
    await addTool(t, ana.id, "Free tool");
    const removed = await addTool(t, ana.id, "Removed tool");
    const onLoan = await addTool(t, ana.id, "Borrowed tool");
    await t.run((ctx) => ctx.db.patch(removed, { status: "removed" }));
    await addLoan(t, { toolId: onLoan, ownerId: ana.id, borrowerId: ben.id, startOffset: -1, endOffset: 2, status: "approved" });

    const names = (await t.query(api.tools.listPublic, { today: todayUtc() })).map((x) => x.name);
    expect(names).toEqual(["Free tool"]);
  });

  it("works without a session", async () => {
    const t = newBackend();
    await expect(t.query(api.tools.listPublic, { today: todayUtc() })).resolves.toEqual([]);
  });
});

describe("tools.list", () => {
  it("requires a signed-in user", async () => {
    const t = newBackend();
    expect(await errorMessage(t.query(api.tools.list, { today: todayUtc() }))).toBe("Sign in to continue");
  });

  it("returns availability, owner first name and filters by category", async () => {
    const t = newBackend();
    const ana = await addUser(t, "ana", { trustedLender: true });
    const ben = await addUser(t, "ben");
    const drill = await addTool(t, ana.id, "Drill");
    const garden = await addTool(t, ana.id, "Rake");
    await t.run((ctx) => ctx.db.patch(garden, { category: "garden" }));
    await addLoan(t, { toolId: drill, ownerId: ana.id, borrowerId: ben.id, startOffset: 0, endOffset: 1, status: "approved" });

    const all = await ben.as.query(api.tools.list, { today: todayUtc() });
    expect(all).toHaveLength(2);
    expect(all.find((x) => x.name === "Drill")).toMatchObject({
      availability: "on_loan",
      ownerFirstName: "Ana",
      ownerTrustedLender: true,
      isMine: false,
    });
    const onlyGarden = await ben.as.query(api.tools.list, { today: todayUtc(), category: "garden" });
    expect(onlyGarden.map((x) => x.name)).toEqual(["Rake"]);
  });
});

describe("tool availability details", () => {
  async function board() {
    const t = newBackend();
    const ana = await addUser(t, "ana");
    const ben = await addUser(t, "ben");
    const cara = await addUser(t, "cara");
    const tool = await addTool(t, ana.id, "Drill");
    return { t, ana, ben, cara, tool };
  }

  it("returns bookings in the 14-day window, sorted, with dates only", async () => {
    const { t, ana, ben, cara, tool } = await board();
    const a = (s: number, e: number) =>
      addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: s, endOffset: e, status: "approved" });
    await a(10, 12);
    await a(2, 3);
    await a(13, 20); // starts on the last day of the window: included
    await a(14, 15); // first day outside the window
    await a(-5, -2); // not returned yet: overdue, so it is the loan that is out now
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 4, endOffset: 5, status: "pending" });

    const [row] = await cara.as.query(api.tools.list, { today: todayUtc() });
    expect(row.bookings).toEqual([
      { startDate: inDays(2), endDate: inDays(3) },
      { startDate: inDays(10), endDate: inDays(12) },
      { startDate: inDays(13), endDate: inDays(20) },
    ]);
    expect(row).toMatchObject({ availability: "on_loan", outUntil: inDays(-2), late: true });
    // Nobody is identified: no ids or names of borrowers anywhere in the output.
    const json = JSON.stringify(await cara.as.query(api.tools.list, { today: todayUtc() }));
    expect(json).not.toContain(ben.id);
    expect(json).not.toContain("Ben");
    expect(json).not.toContain("ben@");
  });

  it("outUntil and late describe the loan that is out now", async () => {
    const { t, ana, ben, cara, tool } = await board();
    const loan = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: -2, endOffset: 3, status: "approved" });
    expect((await cara.as.query(api.tools.list, { today: todayUtc() }))[0]).toMatchObject({
      availability: "on_loan",
      outUntil: inDays(3),
      late: false,
    });
    const first = (await cara.as.query(api.tools.list, { today: todayUtc() }))[0];
    expect(first.bookings).toEqual([{ startDate: inDays(-2), endDate: inDays(3) }]);

    await t.run((ctx) => ctx.db.patch(loan, { endDate: inDays(-1) }));
    expect((await cara.as.query(api.tools.list, { today: todayUtc() }))[0]).toMatchObject({
      availability: "on_loan",
      outUntil: inDays(-1),
      late: true,
      bookings: [],
    });
  });

  it("myPendingRequest only shows the viewer's own, most recent first", async () => {
    const { t, ana, ben, cara, tool } = await board();
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 1, endOffset: 2, status: "pending" });

    expect((await ben.as.query(api.tools.list, { today: todayUtc() }))[0].myPendingRequest).toEqual({
      startDate: inDays(1),
      endDate: inDays(2),
    });
    expect((await cara.as.query(api.tools.list, { today: todayUtc() }))[0].myPendingRequest).toBeNull();
    expect((await ana.as.query(api.tools.list, { today: todayUtc() }))[0].myPendingRequest).toBeNull();
  });

  it("myListings has the same availability fields plus pendingCount", async () => {
    const { t, ana, ben, cara, tool } = await board();
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 1, endOffset: 2, status: "pending" });
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: cara.id, startOffset: 5, endOffset: 6, status: "pending" });
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: cara.id, startOffset: 8, endOffset: 9, status: "approved" });
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: cara.id, startOffset: 11, endOffset: 12, status: "declined" });

    const [row] = await ana.as.query(api.tools.myListings, { today: todayUtc() });
    expect(row).toMatchObject({
      pendingCount: 2,
      outUntil: null,
      late: false,
      bookings: [{ startDate: inDays(8), endDate: inDays(9) }],
    });
  });
});

describe("tool ownership", () => {
  it("creates a tool for the signed-in user and validates input", async () => {
    const t = newBackend();
    const ana = await addUser(t, "ana");
    const id = await ana.as.mutation(api.tools.create, {
      name: "  Hammer ",
      category: "hand_tools",
      condition: "good",
      description: "Claw hammer",
    });
    const stored = await t.run((ctx) => ctx.db.get(id));
    expect(stored).toMatchObject({ name: "Hammer", ownerId: ana.id, status: "active" });

    // Names are one line: they end up in e-mail subjects.
    const odd = await ana.as.mutation(api.tools.create, {
      name: "Drill\r\nBcc: someone@example.com\tX",
      category: "other",
      condition: "good",
      description: "Line one\nLine two",
    });
    expect(await t.run((ctx) => ctx.db.get(odd))).toMatchObject({
      name: "Drill Bcc: someone@example.com X",
      description: "Line one\nLine two",
    });

    expect(
      await errorMessage(
        ana.as.mutation(api.tools.create, { name: " ", category: "other", condition: "good", description: "x" }),
      ),
    ).toMatch(/name must be/);
    expect(
      await errorMessage(
        ana.as.mutation(api.tools.create, { name: "x", category: "other", condition: "good", description: "y".repeat(501) }),
      ),
    ).toMatch(/description must be/);
  });

  it("rejects signed-out callers", async () => {
    const t = newBackend();
    expect(
      await errorMessage(t.mutation(api.tools.create, { name: "x", category: "other", condition: "good", description: "y" })),
    ).toBe("Sign in to continue");
  });

  it("does not let a user update or remove another user's tool", async () => {
    const t = newBackend();
    const ana = await addUser(t, "ana");
    const ben = await addUser(t, "ben");
    const tool = await addTool(t, ana.id);

    expect(await errorMessage(ben.as.mutation(api.tools.update, { toolId: tool, name: "Mine now" }))).toMatch(/only edit your own/);
    expect(await errorMessage(ben.as.mutation(api.tools.remove, { toolId: tool }))).toMatch(/only remove your own/);
    expect(await t.run((ctx) => ctx.db.get(tool))).toMatchObject({ name: "Cordless drill", status: "active" });
  });

  it("lets the owner update and remove; removing declines pending requests", async () => {
    const t = newBackend();
    const ana = await addUser(t, "ana");
    const ben = await addUser(t, "ben");
    const tool = await addTool(t, ana.id);
    const loan = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 1, endOffset: 2, status: "pending" });

    await ana.as.mutation(api.tools.update, { toolId: tool, name: "Better drill" });
    await ana.as.mutation(api.tools.remove, { toolId: tool });

    expect(await t.run((ctx) => ctx.db.get(tool))).toMatchObject({ name: "Better drill", status: "removed", removedBy: ana.id });
    expect(await t.run((ctx) => ctx.db.get(loan))).toMatchObject({ status: "declined" });
    // The borrower is notified through the scheduler.
    const scheduled = await t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());
    expect(scheduled).toHaveLength(1);
  });

  it("refuses to remove a tool that is on an approved loan", async () => {
    const t = newBackend();
    const ana = await addUser(t, "ana");
    const ben = await addUser(t, "ben");
    const tool = await addTool(t, ana.id);
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 0, endOffset: 2, status: "approved" });

    expect(await errorMessage(ana.as.mutation(api.tools.remove, { toolId: tool }))).toMatch(/on loan/);
  });
});
