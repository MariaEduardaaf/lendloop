import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { todayUtc } from "../convex/lib/dates";
import { api, internal } from "../convex/_generated/api";
import { addLoan, addTool, addUser, errorMessage, newBackend } from "./helpers";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("admin functions", () => {
  it("reject non-admin callers and signed-out callers", async () => {
    const t = newBackend();
    const ana = await addUser(t, "ana");
    const ben = await addUser(t, "ben");
    const tool = await addTool(t, ben.id);

    for (const run of [
      () => ana.as.query(api.admin.listAllLoans, { today: todayUtc() }),
      () => ana.as.query(api.admin.listUsers, {}),
      () => ana.as.query(api.admin.listWorkflowErrors, {}),
      () => ana.as.mutation(api.admin.removeTool, { toolId: tool }),
      () => ana.as.mutation(api.admin.setTrustedLender, { userId: ben.id, value: true }),
    ]) {
      expect(await errorMessage(run())).toBe("Admins only");
    }
    expect(await errorMessage(t.query(api.admin.listUsers, {}))).toBe("Sign in to continue");
    expect(await t.run((ctx) => ctx.db.get(tool))).toMatchObject({ status: "active" });
    expect(await t.run((ctx) => ctx.db.get(ben.id))).toMatchObject({ trustedLender: false });
  });

  it("admin removes any tool and an audit row is written", async () => {
    const t = newBackend();
    const admin = await addUser(t, "root", { role: "admin" });
    const ben = await addUser(t, "ben");
    const tool = await addTool(t, ben.id);

    await admin.as.mutation(api.admin.removeTool, { toolId: tool });

    expect(await t.run((ctx) => ctx.db.get(tool))).toMatchObject({ status: "removed", removedBy: admin.id });
    const audit = await t.run((ctx) => ctx.db.query("auditLog").collect());
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ action: "tool.removed_by_admin", actorId: admin.id, targetId: tool });
  });

  it("admin sets trusted lender with an audit row, and sees all loans and users", async () => {
    const t = newBackend();
    const admin = await addUser(t, "root", { role: "admin" });
    const ana = await addUser(t, "ana");
    const ben = await addUser(t, "ben");
    const tool = await addTool(t, ana.id);
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 1, endOffset: 2, status: "pending" });

    await admin.as.mutation(api.admin.setTrustedLender, { userId: ana.id, value: true });

    expect(await t.run((ctx) => ctx.db.get(ana.id))).toMatchObject({ trustedLender: true });
    const audit = await t.run((ctx) => ctx.db.query("auditLog").collect());
    expect(audit[0]).toMatchObject({ action: "user.trusted_lender_set", targetId: ana.id });
    expect(await admin.as.query(api.admin.listAllLoans, { today: todayUtc() })).toHaveLength(1);
    expect(await admin.as.query(api.admin.listUsers, {})).toHaveLength(3);
  });
});

describe("users", () => {
  const identity = { tokenIdentifier: "https://test.clerk.dev|new", subject: "new", givenName: "Nia", email: "nia@example.com" };

  it("store creates a plain user from the identity", async () => {
    const t = newBackend();
    await t.withIdentity(identity).mutation(api.users.store, {});
    const me = await t.withIdentity(identity).query(api.users.me, {});
    expect(me).toMatchObject({ firstName: "Nia", email: "nia@example.com", role: "user", trustedLender: false });
  });

  it("store never changes the role or trusted flag of an existing user", async () => {
    const t = newBackend();
    const as = t.withIdentity(identity);
    await as.mutation(api.users.store, {});
    await t.run(async (ctx) => {
      const user = await ctx.db.query("users").first();
      await ctx.db.patch(user!._id, { role: "admin", trustedLender: true });
    });

    await as.mutation(api.users.store, {});
    await t.withIdentity({ ...identity, givenName: "Nina" }).mutation(api.users.store, {});

    const users = await t.run((ctx) => ctx.db.query("users").collect());
    expect(users).toHaveLength(1); // upsert, not a second row
    expect(users[0]).toMatchObject({ role: "admin", trustedLender: true, firstName: "Nina" });
  });

  it("store requires a session, me is null when signed out", async () => {
    const t = newBackend();
    expect(await errorMessage(t.mutation(api.users.store, {}))).toBe("Sign in to continue");
    expect(await t.query(api.users.me, {})).toBeNull();
  });

  it("setRole is internal only and writes an audit row", async () => {
    const t = newBackend();
    const ana = await addUser(t, "ana");

    await t.mutation(internal.users.setRole, { email: "ana@example.com", role: "admin" });

    expect(await t.run((ctx) => ctx.db.get(ana.id))).toMatchObject({ role: "admin" });
    expect((await t.run((ctx) => ctx.db.query("auditLog").collect()))[0]).toMatchObject({ action: "user.role_set" });
    expect(await errorMessage(t.mutation(internal.users.setRole, { email: "nobody@example.com", role: "admin" }))).toMatch(/No user/);
  });
});
