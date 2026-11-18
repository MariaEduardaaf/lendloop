// End-to-end proof for the n8n workflows against a mock of the Convex endpoints (Node built-ins only).
// The mock can fail on demand, which the real backend cannot, so retries and the error workflow get exercised.
// Needs: `node scripts/mock-convex.mjs` running, and n8n pointed at it:
//          CONVEX_SITE_URL=http://host.docker.internal:3299 docker compose up -d
//        (run `docker compose up -d` again afterwards to point n8n back at Convex)
// Usage: node scripts/test-n8n.mjs                 webhook, reminders, error handler
//        node scripts/test-n8n.mjs --webhook       only the webhook cases
//        node scripts/test-n8n.mjs --smtp-down     also the (slow) webhook case with SMTP stopped
import { spawnSync } from "node:child_process";
import { strict as assert } from "node:assert";
import { loadEnv, sampleEvent, postEvent } from "./send-test-event.mjs";

const env = loadEnv();
const WEBHOOK = "http://localhost:5678/webhook/lendloop-request";
const MAILPIT = "http://localhost:8025/api/v1";
const MOCK = "http://localhost:3299";
const secret = env.CONVEX_TO_N8N_SECRET;
const RUN = `t${Date.now()}`; // event ids must be new on every run, otherwise dedupe drops them
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const post = (event, opts = {}) => postEvent({ url: WEBHOOK, secret, event, ...opts });
const mails = async () => (await (await fetch(`${MAILPIT}/messages`)).json()).messages;
const mockState = async () => (await fetch(`${MOCK}/_state`)).json();
const mock = (path) => fetch(MOCK + path, { method: "POST" });
const docker = (...args) => spawnSync("docker", args, { encoding: "utf8" });
let n = 0;
const ok = (name) => console.log(`ok ${++n} ${name}`);

async function waitFor(fn, what, ms = 20000) {
  for (const end = Date.now() + ms; Date.now() < end; await sleep(500)) { let v; try { v = await fn(); } catch { /* service still starting */ } if (v) return v; }
  throw new Error(`timed out waiting for ${what}`);
}

// ---------- webhook ----------
// The webhook answers 202 as soon as the event is verified and stored, sends the e-mail afterwards
// and reports the result to POST /n8n/notifications. So e-mails and results are awaited, not immediate.
const mailCount = (count) => waitFor(async () => (await mails()).length === count, `${count} email(s) in Mailpit`);
const result = (eventId) => waitFor(async () => (await mockState()).notifications[eventId], `result of ${eventId}`);
await mock("/_reset");
await fetch(`${MAILPIT}/messages`, { method: "DELETE" });

let r = await post(sampleEvent({ eventId: `${RUN}:valid` }));
assert.equal(r.status, 202); await mailCount(1);
assert.equal((await mails())[0].To[0].Address, "ana@example.com");
assert.equal((await result(`${RUN}:valid`)).status, "sent");
ok("valid signature -> 202, one email in Mailpit, result reported as sent");

r = await post(sampleEvent({ eventId: `${RUN}:tampered` }), { tamper: true });
assert.equal(r.status, 401);
ok("body changed after signing -> 401");

r = await post(sampleEvent({ eventId: `${RUN}:old` }), { age: 330 });
assert.equal(r.status, 401);
ok("timestamp 330 s old -> 401");

r = await post(sampleEvent({ eventId: `${RUN}:future` }), { age: -330 });
assert.equal(r.status, 401);
ok("timestamp 330 s in the future (margin covers clock skew) -> 401");

let raw = await fetch(WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
assert.equal(raw.status, 401);
ok("no signature headers -> 401");

raw = await fetch(WEBHOOK, { method: "POST", headers: { "Content-Type": "application/json", "X-LendLoop-Timestamp": String(Math.floor(Date.now() / 1000)), "X-LendLoop-Signature": "v1=" + "0".repeat(64) }, body: "{}" });
assert.equal(raw.status, 401);
ok("well-formed but wrong signature -> 401");

r = await post({ ...sampleEvent({ eventId: `${RUN}:bad` }), recipient: { firstName: "Ana", email: "not-an-email" } });
assert.equal(r.status, 400);
ok("valid signature but invalid payload -> 400");

r = await post(sampleEvent({ eventId: `${RUN}:dup` }));
const r2 = await post(sampleEvent({ eventId: `${RUN}:dup` }));
assert.equal(r.status, 202); assert.equal(r2.status, 200); assert.match(r2.body, /duplicate/);
await result(`${RUN}:dup`); await sleep(1500);
assert.equal((await mails()).length, 2, "rejected requests and the duplicate must not add emails");
ok("same eventId twice -> 202 then 200 duplicate, one email, and none for the rejected requests");

const types = ["request.created", "request.approved", "request.declined", "request.cancelled", "loan.returned", "loan.cancelled"];
for (const type of types) assert.equal((await post(sampleEvent({ type, eventId: `${RUN}:${type}` }))).status, 202);
await mailCount(2 + types.length);
const subjects = (await mails()).slice(0, types.length).map((m) => m.Subject).sort();
ok(`all 6 event types -> 6 emails (${subjects.join(" | ")})`);

let s = await mockState();
assert(s.calls.every((c) => c.sigOk), "every call from n8n must carry a valid signature");
assert.deepEqual(Object.values(s.notifications).map((x) => x.status), Array(2 + types.length).fill("sent"));
ok("every accepted event was reported back once, signed, as sent");

// Slow (about 90 s: SMTP connection timeouts x 3 tries), so opt-in.
if (process.argv.includes("--smtp-down")) {
  await mock("/_reset");
  const id = `${RUN}:smtpdown`;
  docker("stop", "lendloop-mailpit-1");
  let failed, report;
  try {
    assert.equal((await post(sampleEvent({ eventId: id }))).status, 202);
    failed = await waitFor(async () => (await mockState()).notifications[id], "failed result", 180000);
    report = Object.values(await waitFor(async () => { const x = await mockState(); return Object.keys(x.errors).length && x.errors; }, "error report"))[0];
  } finally { docker("start", "lendloop-mailpit-1"); }
  assert.equal(failed.status, "failed");
  assert(!JSON.stringify(failed).includes("@"), "no email address in the error text");
  assert.equal(report.workflowName, "LendLoop - Request notification");
  assert.equal(report.nodeName, "Fail execution");
  await waitFor(async () => (await fetch(`${MAILPIT}/info`)).ok, "mailpit");
  ok("SMTP down -> still 202, result reported as failed (no address in the error), execution fails and the error handler reports it");
}

if (process.argv.includes("--webhook")) process.exit(0);

// ---------- overdue reminders ----------
const runReminders = () => docker("exec", "-e", "N8N_RUNNERS_BROKER_PORT=5680", "lendloop-n8n-1", "n8n", "execute", "--id=lendloopOverdue001");
await mock("/_reset");
await fetch(`${MAILPIT}/messages`, { method: "DELETE" });
await mock("/_fail?path=/n8n/reminders&times=1");
runReminders();
s = await mockState();
assert(s.calls.every((c) => c.sigOk), "every call from n8n must carry a valid signature");
assert.equal(s.calls.filter((c) => c.path === "/n8n/overdue-loans").length, 1);
assert.equal(s.calls.filter((c) => c.status === 500).length, 1);
assert.deepEqual(Object.values(s.reminders).map((x) => x.status), ["sent", "sent"]);
assert.equal((await mails()).length, 2, "retry of the write-back must not resend emails");
ok("signed GET, 2 emails, write-back got 500 once, node retry succeeded, both stored as sent, no duplicate emails");

await mock("/_reset");
docker("stop", "lendloop-mailpit-1");
try { runReminders(); } finally { docker("start", "lendloop-mailpit-1"); }
s = await mockState();
assert.deepEqual(Object.values(s.reminders).map((x) => x.status), ["failed", "failed"]);
assert(!JSON.stringify(s.reminders).includes("@"), "no email address in the error text");
ok("SMTP down -> emails fail after retries, both still written back as failed (error text has no address)");

// ---------- error handler ----------
await mock("/_reset");
await mock("/_fail?path=/n8n/reminders&times=99");
await waitFor(async () => (await fetch(`${MAILPIT}/info`)).ok, "mailpit");
runReminders();
s = await waitFor(async () => { const x = await mockState(); return Object.keys(x.errors).length && x; }, "error report");
const e = Object.values(s.errors)[0];
assert.equal(e.workflowName, "LendLoop - Overdue reminders");
assert.equal(e.nodeName, "Write reminder status to Convex");
assert(s.calls.every((c) => c.sigOk));
ok(`write-back keeps failing -> execution fails -> error handler posted signed report (${e.workflowName} / ${e.nodeName})`);

await mock("/_reset");
console.log("all checks passed");
