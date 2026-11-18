// Shared signing helper for the LendLoop <-> n8n integration (Node built-ins only).
// Scheme (both directions): hex = HMAC_SHA256(secret, "v1:" + ts + ":" + METHOD + ":" + pathname + ":" + rawBody)
// Headers: X-LendLoop-Timestamp: <unix seconds>, X-LendLoop-Signature: v1=<hex>
import { createHmac, timingSafeEqual } from "node:crypto";

export function sign({ secret, method, pathname, rawBody = "", timestamp = Math.floor(Date.now() / 1000) }) {
  const canonical = `v1:${timestamp}:${method.toUpperCase()}:${pathname}:${rawBody}`;
  const hex = createHmac("sha256", secret).update(canonical).digest("hex");
  return {
    "X-LendLoop-Timestamp": String(timestamp),
    "X-LendLoop-Signature": `v1=${hex}`,
  };
}

// Returns true only for a fresh (<= 300 s) and correct signature. Constant-time compare.
export function verify({ secret, method, pathname, rawBody = "", headers, now = Math.floor(Date.now() / 1000) }) {
  const ts = Number(headers["x-lendloop-timestamp"]);
  const sig = String(headers["x-lendloop-signature"] ?? "");
  if (!Number.isInteger(ts) || Math.abs(now - ts) > 300 || !sig.startsWith("v1=")) return false;
  const expected = sign({ secret, method, pathname, rawBody, timestamp: ts })["X-LendLoop-Signature"];
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Self-check: node scripts/sign.mjs
if (import.meta.url === `file://${process.argv[1]}`) {
  const { strict: assert } = await import("node:assert");
  const secret = "test-secret";
  const base = { secret, method: "POST", pathname: "/webhook/x", rawBody: '{"a":1}' };
  const lower = (h) => Object.fromEntries(Object.entries(h).map(([k, v]) => [k.toLowerCase(), v]));
  const h = lower(sign(base));
  assert(verify({ ...base, headers: h }));
  assert(!verify({ ...base, rawBody: '{"a":2}', headers: h }));
  assert(!verify({ ...base, pathname: "/other", headers: h }));
  assert(!verify({ ...base, secret: "nope", headers: h }));
  assert(!verify({ ...base, headers: lower(sign({ ...base, timestamp: 1000 })) }));
  console.log("sign.mjs self-check ok");
}
