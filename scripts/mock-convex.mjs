// Throwaway stand-in for the Convex HTTP endpoints, for testing the n8n workflows without Convex.
// Verifies signatures like the real endpoints (secret N8N_TO_CONVEX_SECRET, from env or ./.env). Built-ins only.
// Usage: node scripts/mock-convex.mjs [port=3299]
// Test controls (unsigned, local only): GET /_state, POST /_reset, POST /_fail?path=/n8n/reminders&times=1
import { createServer } from "node:http";
import { verify } from "./sign.mjs";
import { loadEnv } from "./send-test-event.mjs";

const secret = loadEnv().N8N_TO_CONVEX_SECRET;
if (!secret) throw new Error("N8N_TO_CONVEX_SECRET missing (set it in .env)");
const port = Number(process.argv[2] ?? 3299);

const asOf = new Date().toISOString().slice(0, 10);
const OVERDUE = [
  { loanId: "loan_overdue_1", reminderKey: `reminder:loan_overdue_1:${asOf}`, borrower: { firstName: "Cleo", email: "cleo@example.com" }, tool: { name: "Pressure washer" }, endDate: "2026-11-10", daysOverdue: 8 },
  { loanId: "loan_overdue_2", reminderKey: `reminder:loan_overdue_2:${asOf}`, borrower: { firstName: "Dan", email: "dan@example.com" }, tool: { name: "Tent (4 person)" }, endDate: "2026-11-15", daysOverdue: 3 },
];

let state;
const reset = () => (state = { calls: [], notifications: {}, reminders: {}, errors: {}, failNext: {} });
reset();

const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const chunks = []; for await (const c of req) chunks.push(c);
  const rawBody = Buffer.concat(chunks).toString("utf8");

  if (url.pathname === "/_state") return send(res, 200, state);
  if (url.pathname === "/_reset") { reset(); return send(res, 200, { ok: true }); }
  if (url.pathname === "/_fail") { state.failNext[url.searchParams.get("path")] = Number(url.searchParams.get("times") ?? 1); return send(res, 200, { ok: true }); }

  const log = (status, sigOk) => state.calls.push({ method: req.method, path: url.pathname, status, sigOk, ...(rawBody.startsWith("{") ? { body: JSON.parse(rawBody) } : {}) });
  const lower = Object.fromEntries(Object.entries(req.headers));
  if (!verify({ secret, method: req.method, pathname: url.pathname, rawBody, headers: lower })) { log(401, false); return send(res, 401, {}); }
  if (state.failNext[url.pathname] > 0) { state.failNext[url.pathname]--; log(500, true); return send(res, 500, { error: "simulated outage" }); }

  if (req.method === "GET" && url.pathname === "/n8n/overdue-loans") {
    log(200, true);
    return send(res, 200, { asOf, loans: OVERDUE.filter((l) => !state.reminders[l.reminderKey]) });
  }
  if (req.method === "POST" && url.pathname === "/n8n/notifications") {
    const b = JSON.parse(rawBody);
    const duplicate = b.eventId in state.notifications;
    state.notifications[b.eventId] = { status: b.status, error: b.error };
    log(200, true);
    return send(res, 200, { ok: true, duplicate });
  }
  if (req.method === "POST" && url.pathname === "/n8n/reminders") {
    const b = JSON.parse(rawBody);
    const duplicate = b.reminderKey in state.reminders;
    state.reminders[b.reminderKey] = { status: b.status, error: b.error };
    log(200, true);
    return send(res, 200, { ok: true, duplicate });
  }
  if (req.method === "POST" && url.pathname === "/n8n/workflow-errors") {
    const b = JSON.parse(rawBody);
    const duplicate = b.executionId in state.errors;
    state.errors[b.executionId] = b;
    log(200, true);
    return send(res, 200, { ok: true, duplicate });
  }
  log(404, true);
  send(res, 404, {});
}).listen(port, "0.0.0.0", () => console.log(`mock convex on :${port}`));
