import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { internal } from "../convex/_generated/api";
import { verify } from "../convex/lib/hmac";
import { addLoan, addTool, addUser, newBackend } from "./helpers";

const SECRET = "convex-to-n8n-test-secret";
const URL_ = "http://n8n.test/webhook/lendloop-request";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("N8N_REQUEST_WEBHOOK_URL", URL_);
  vi.stubEnv("CONVEX_TO_N8N_SECRET", SECRET);
  fetchMock.mockReset();
  // No test may reach the network: fetch is always the mock.
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function pendingLoan() {
  const t = newBackend();
  const ana = await addUser(t, "ana");
  const ben = await addUser(t, "ben");
  const tool = await addTool(t, ana.id, "Cordless drill");
  const loanId = await addLoan(t, { toolId: tool, ownerId: ana.id, borrowerId: ben.id, startOffset: 1, endOffset: 3, status: "pending" });
  return { t, loanId, eventId: `${loanId}:request.created` };
}

const outcomes = (t: Awaited<ReturnType<typeof pendingLoan>>["t"]) => t.run((ctx) => ctx.db.query("automationEvents").collect());
const scheduled = (t: Awaited<ReturnType<typeof pendingLoan>>["t"]) =>
  t.run((ctx) => ctx.db.system.query("_scheduled_functions").collect());

describe("notification payload", () => {
  it("holds only the fields the workflow needs", async () => {
    const { t, loanId, eventId } = await pendingLoan();
    const payload = await t.query(internal.notifications.buildPayload, { eventId });

    expect(payload).toEqual({
      eventId,
      type: "request.created",
      occurredAt: expect.any(String),
      loanId,
      recipient: { firstName: "Ana", email: "ana@example.com" }, // the owner hears about new requests
      counterpartyFirstName: "Ben",
      tool: { name: "Cordless drill" },
      loan: { startDate: expect.any(String), endDate: expect.any(String), status: "pending" },
    });
  });

  it("sends decisions to the borrower", async () => {
    const { t, loanId } = await pendingLoan();
    const payload = await t.query(internal.notifications.buildPayload, { eventId: `${loanId}:request.approved` });
    expect(payload?.recipient).toEqual({ firstName: "Ben", email: "ben@example.com" });
    expect(payload?.counterpartyFirstName).toBe("Ana");
  });

  it("returns null for a malformed or unknown event id", async () => {
    const { t, loanId } = await pendingLoan();
    expect(await t.query(internal.notifications.buildPayload, { eventId: "garbage" })).toBeNull();
    expect(await t.query(internal.notifications.buildPayload, { eventId: `${loanId}:request.exploded` })).toBeNull();
  });
});

describe("notifications.deliver", () => {
  it("posts a signed payload and records the delivery", async () => {
    const { t, eventId } = await pendingLoan();
    fetchMock.mockResolvedValue(new Response("ok", { status: 200 }));

    await t.action(internal.notifications.deliver, { eventId, attempt: 1 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(URL_);
    expect(init.method).toBe("POST");
    const valid = await verify({
      secret: SECRET,
      method: "POST",
      pathname: "/webhook/lendloop-request",
      rawBody: init.body,
      timestamp: init.headers["X-LendLoop-Timestamp"],
      signature: init.headers["X-LendLoop-Signature"],
    });
    expect(valid).toBe(true);
    expect(JSON.parse(init.body).eventId).toBe(eventId);

    const rows = await outcomes(t);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "notification", status: "delivered", key: `notification:${eventId}`, attempts: 1 });
    expect(await scheduled(t)).toHaveLength(0);
  });

  it("schedules a retry on a non-2xx response and records nothing yet", async () => {
    const { t, eventId } = await pendingLoan();
    fetchMock.mockResolvedValue(new Response("nope", { status: 503 }));

    await t.action(internal.notifications.deliver, { eventId, attempt: 1 });

    expect(await outcomes(t)).toHaveLength(0);
    const next = await scheduled(t);
    expect(next).toHaveLength(1);
    expect(next[0].args[0]).toEqual({ eventId, attempt: 2 });
  });

  it("records a failure with a short error after the last attempt", async () => {
    const { t, eventId } = await pendingLoan();
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED ana@example.com"));

    await t.action(internal.notifications.deliver, { eventId, attempt: 5 });

    const rows = await outcomes(t);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: "failed", attempts: 5, lastError: "Network error" }); // no exception text, no PII
    expect(await scheduled(t)).toHaveLength(0);
  });

  it("is idempotent: a duplicate delivery updates the same row", async () => {
    const { t, eventId } = await pendingLoan();
    fetchMock.mockResolvedValue(new Response("ok", { status: 200 }));

    await t.action(internal.notifications.deliver, { eventId, attempt: 1 });
    await t.action(internal.notifications.deliver, { eventId, attempt: 2 });

    const rows = await outcomes(t);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("delivered");
  });

  it("does not retry when the webhook is not configured, and records the failure", async () => {
    const { t, eventId } = await pendingLoan();
    vi.stubEnv("N8N_REQUEST_WEBHOOK_URL", "");

    await t.action(internal.notifications.deliver, { eventId, attempt: 1 });

    expect(fetchMock).not.toHaveBeenCalled();
    expect((await outcomes(t))[0]).toMatchObject({ status: "failed", lastError: "Webhook is not configured" });
    expect(await scheduled(t)).toHaveLength(0);
  });
});
