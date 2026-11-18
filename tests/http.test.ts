import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { todayUtc } from "../convex/lib/dates";
import { signedHeaders } from "../convex/lib/hmac";
import { addLoan, addTool, addUser, newBackend, type TestConvex } from "./helpers";

const SECRET = "n8n-to-convex-test-secret";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("N8N_TO_CONVEX_SECRET", SECRET);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

/** Calls an endpoint the way n8n does: signed over the exact body text. */
async function call(t: TestConvex, method: "GET" | "POST", path: string, body?: unknown, secret = SECRET) {
  const rawBody = body === undefined ? "" : JSON.stringify(body);
  const headers = await signedHeaders({ secret, method, pathname: path, rawBody });
  return t.fetch(path, { method, headers, ...(method === "POST" && { body: rawBody }) });
}

describe("signature check on every endpoint", () => {
  const endpoints = [
    ["GET", "/n8n/overdue-loans", undefined],
    ["POST", "/n8n/reminders", { loanId: "x", reminderKey: "reminder:x:2026-01-01", status: "sent" }],
    ["POST", "/n8n/notifications", { eventId: "x:request.created", status: "sent" }],
    ["POST", "/n8n/workflow-errors", { executionId: "1", workflowName: "w", message: "m" }],
  ] as const;

  for (const [method, path, body] of endpoints) {
    it(`${method} ${path}: 401 without headers`, async () => {
      const t = newBackend();
      const res = await t.fetch(path, { method, ...(body && { body: JSON.stringify(body) }) });
      expect(res.status).toBe(401);
      expect(await res.text()).toBe("Unauthorized"); // no detail about why
    });

    it(`${method} ${path}: 401 with a wrong secret`, async () => {
      const t = newBackend();
      expect((await call(t, method, path, body, "another-secret")).status).toBe(401);
    });

    it(`${method} ${path}: 401 with a malformed signature`, async () => {
      const t = newBackend();
      const headers = { "X-LendLoop-Timestamp": String(Math.floor(Date.now() / 1000)), "X-LendLoop-Signature": "v1=abc" };
      const res = await t.fetch(path, { method, headers, ...(body && { body: JSON.stringify(body) }) });
      expect(res.status).toBe(401);
    });
  }

  it("401 when the body was changed after signing", async () => {
    const t = newBackend();
    const body = { executionId: "1", workflowName: "w", message: "m" };
    const headers = await signedHeaders({ secret: SECRET, method: "POST", pathname: "/n8n/workflow-errors", rawBody: JSON.stringify(body) });
    const res = await t.fetch("/n8n/workflow-errors", { method: "POST", headers, body: JSON.stringify({ ...body, message: "other" }) });
    expect(res.status).toBe(401);
  });

  it("401 when a signature made for another path is replayed", async () => {
    const t = newBackend();
    const body = { executionId: "1", workflowName: "w", message: "m" };
    const headers = await signedHeaders({ secret: SECRET, method: "POST", pathname: "/n8n/reminders", rawBody: JSON.stringify(body) });
    const res = await t.fetch("/n8n/workflow-errors", { method: "POST", headers, body: JSON.stringify(body) });
    expect(res.status).toBe(401);
  });

  it("401 when the signature is older than 300 seconds", async () => {
    const t = newBackend();
    const headers = await signedHeaders({ secret: SECRET, method: "GET", pathname: "/n8n/overdue-loans", rawBody: "" });
    vi.setSystemTime(Date.now() + 301_000);
    expect((await t.fetch("/n8n/overdue-loans", { method: "GET", headers })).status).toBe(401);
  });

  it("fails closed when the secret is not configured", async () => {
    vi.stubEnv("N8N_TO_CONVEX_SECRET", "");
    const t = newBackend();
    expect((await call(t, "GET", "/n8n/overdue-loans")).status).toBe(401);
  });
});

describe("authenticated requests", () => {
  async function seeded() {
    const t = newBackend();
    const ana = await addUser(t, "ana");
    const ben = await addUser(t, "ben");
    const tool = await addTool(t, ana.id);
    const loanId = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: -8, endOffset: -2, status: "approved" });
    return { t, loanId };
  }

  it("GET /n8n/overdue-loans returns the overdue loan", async () => {
    const { t, loanId } = await seeded();
    const res = await call(t, "GET", "/n8n/overdue-loans");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.asOf).toBe(todayUtc());
    expect(json.loans).toHaveLength(1);
    expect(json.loans[0]).toMatchObject({ loanId, daysOverdue: 2, borrower: { firstName: "Ben" } });
  });

  it("GET /n8n/overdue-loans follows the clock: a loan becomes overdue the day after it ends", async () => {
    const t = newBackend();
    const ana = await addUser(t, "ana");
    const ben = await addUser(t, "ben");
    const tool = await addTool(t, ana.id);
    await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: -2, endOffset: 0, status: "approved" });

    expect((await (await call(t, "GET", "/n8n/overdue-loans")).json()).loans).toHaveLength(0);
    vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000);
    expect((await (await call(t, "GET", "/n8n/overdue-loans")).json()).loans).toHaveLength(1);
  });

  it("POST /n8n/reminders is idempotent over HTTP", async () => {
    const { t, loanId } = await seeded();
    const body = { loanId, reminderKey: `reminder:${loanId}:${todayUtc()}`, status: "sent" };

    expect(await (await call(t, "POST", "/n8n/reminders", body)).json()).toEqual({ ok: true, duplicate: false });
    expect(await (await call(t, "POST", "/n8n/reminders", body)).json()).toEqual({ ok: true, duplicate: true });
    expect(await t.run((ctx) => ctx.db.query("automationEvents").collect())).toHaveLength(1);
  });

  it("POST /n8n/reminders returns 400 for bad input", async () => {
    const { t, loanId } = await seeded();
    const bad = [
      { loanId, reminderKey: `reminder:${loanId}:${todayUtc()}`, status: "maybe" },
      { loanId, reminderKey: `reminder:other:${todayUtc()}`, status: "sent" }, // key for a different loan
      { loanId, reminderKey: `reminder:${loanId}:not-a-date`, status: "sent" },
      { loanId: 42, reminderKey: "k", status: "sent" },
      { loanId: "does-not-exist", reminderKey: `reminder:does-not-exist:${todayUtc()}`, status: "sent" },
      "just a string",
    ];
    for (const body of bad) {
      expect((await call(t, "POST", "/n8n/reminders", body)).status).toBe(400);
    }
    expect(await t.run((ctx) => ctx.db.query("automationEvents").collect())).toHaveLength(0);
  });

  it("POST /n8n/notifications stores the result n8n reports, idempotently", async () => {
    const { t, loanId } = await seeded();
    const eventId = `${loanId}:request.approved`;

    expect(await (await call(t, "POST", "/n8n/notifications", { eventId, status: "failed", error: "SMTP down" })).json()).toEqual({ ok: true, duplicate: false });
    expect(await (await call(t, "POST", "/n8n/notifications", { eventId, status: "sent" })).json()).toEqual({ ok: true, duplicate: true });
    expect(await (await call(t, "POST", "/n8n/notifications", { eventId, status: "sent" })).json()).toEqual({ ok: true, duplicate: true });

    const rows = await t.run((ctx) => ctx.db.query("automationEvents").collect());
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "notification", key: `notification:${eventId}`, eventType: "request.approved", status: "delivered" });
  });

  it("POST /n8n/notifications returns 400 for bad input", async () => {
    const { t, loanId } = await seeded();
    const bad = [
      { eventId: `${loanId}:request.approved`, status: "maybe" },
      { eventId: `${loanId}:request.exploded`, status: "sent" }, // unknown event type
      { eventId: "does-not-exist:request.approved", status: "sent" },
      { eventId: 42, status: "sent" },
      { status: "sent" },
    ];
    for (const body of bad) {
      expect((await call(t, "POST", "/n8n/notifications", body)).status).toBe(400);
    }
    expect(await t.run((ctx) => ctx.db.query("automationEvents").collect())).toHaveLength(0);
  });

  it("POST with a body that is not JSON returns 400, after the signature check", async () => {
    const { t } = await seeded();
    const rawBody = "{not json";
    const headers = await signedHeaders({ secret: SECRET, method: "POST", pathname: "/n8n/reminders", rawBody });
    expect((await t.fetch("/n8n/reminders", { method: "POST", headers, body: rawBody })).status).toBe(400);
  });

  it("POST /n8n/workflow-errors is idempotent on executionId", async () => {
    const t = newBackend();
    const body = { executionId: "77", workflowName: "LendLoop - Request notification", message: "boom" };

    expect(await (await call(t, "POST", "/n8n/workflow-errors", body)).json()).toEqual({ ok: true, duplicate: false });
    expect(await (await call(t, "POST", "/n8n/workflow-errors", body)).json()).toEqual({ ok: true, duplicate: true });
    expect(await t.run((ctx) => ctx.db.query("workflowErrors").collect())).toHaveLength(1);
    expect((await call(t, "POST", "/n8n/workflow-errors", { executionId: "78" })).status).toBe(400);
  });
});
