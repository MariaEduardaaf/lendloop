// Posts a signed sample event to the local n8n webhook (Node built-ins only).
// Usage: node scripts/send-test-event.mjs [--type request.created] [--event-id ID] [--to a@b.c]
//        [--tamper] [--age SECONDS] [--url URL]
// Reads CONVEX_TO_N8N_SECRET from the environment or from ./.env (never printed).
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { sign } from "./sign.mjs";

export function loadEnv(file = new URL("../.env", import.meta.url)) {
  const env = { ...process.env };
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !(m[1] in env)) env[m[1]] = m[2];
    }
  } catch { /* no .env file: rely on process env */ }
  return env;
}

export function sampleEvent({ type = "request.created", eventId = `demo-loan:${randomUUID()}:${type}`, to = "ana@example.com" } = {}) {
  return {
    eventId, type,
    recipient: { firstName: "Ana", email: to },
    counterpartyFirstName: "Ben",
    tool: { name: "Cordless drill" },
    loan: { startDate: "2026-11-20", endDate: "2026-11-22" },
  };
}

export async function postEvent({ url, secret, event, tamper = false, age = 0 }) {
  const rawBody = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000) - age;
  const headers = sign({ secret, method: "POST", pathname: new URL(url).pathname, rawBody, timestamp });
  const sent = tamper ? rawBody.replace("Cordless drill", "Chainsaw") : rawBody; // body changed after signing
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: sent });
  return { status: res.status, body: await res.text() };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { values: a } = (await import("node:util")).parseArgs({ options: {
    type: { type: "string" }, "event-id": { type: "string" }, to: { type: "string" }, tamper: { type: "boolean" },
    age: { type: "string", default: "0" }, url: { type: "string" },
  } });
  const env = loadEnv();
  if (!env.CONVEX_TO_N8N_SECRET) throw new Error("CONVEX_TO_N8N_SECRET missing (set it in .env)");
  const url = a.url ?? "http://localhost:5678/webhook/lendloop-request";
  const event = sampleEvent({ type: a.type, eventId: a["event-id"], to: a.to });
  const r = await postEvent({ url, secret: env.CONVEX_TO_N8N_SECRET, event, tamper: a.tamper, age: Number(a.age) });
  console.log(`${r.status} ${r.body}  (eventId ${event.eventId})`);
}
