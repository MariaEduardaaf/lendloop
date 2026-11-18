import { describe, expect, it } from "vitest";
import { sign, verify } from "../convex/lib/hmac";

const secret = "test-secret";
const base = { secret, method: "POST", pathname: "/n8n/reminders", rawBody: '{"a":1}' };
const now = 1_800_000_000;

async function signedAt(timestamp: number) {
  return { timestamp: String(timestamp), signature: await sign({ ...base, timestamp: String(timestamp) }) };
}

describe("hmac signature", () => {
  it("accepts a valid signature", async () => {
    const s = await signedAt(now);
    expect(await verify({ ...base, ...s, nowSeconds: now })).toBe(true);
  });

  it("rejects a tampered body", async () => {
    const s = await signedAt(now);
    expect(await verify({ ...base, ...s, rawBody: '{"a":2}', nowSeconds: now })).toBe(false);
  });

  it("rejects a different path", async () => {
    const s = await signedAt(now);
    expect(await verify({ ...base, ...s, pathname: "/n8n/workflow-errors", nowSeconds: now })).toBe(false);
  });

  it("rejects a different method", async () => {
    const s = await signedAt(now);
    expect(await verify({ ...base, ...s, method: "GET", nowSeconds: now })).toBe(false);
  });

  it("rejects a different secret", async () => {
    const s = await signedAt(now);
    expect(await verify({ ...base, ...s, secret: "other-secret", nowSeconds: now })).toBe(false);
  });

  it("rejects a timestamp older than 300 seconds, accepts exactly 300", async () => {
    const old = await signedAt(now - 301);
    expect(await verify({ ...base, ...old, nowSeconds: now })).toBe(false);
    const edge = await signedAt(now - 300);
    expect(await verify({ ...base, ...edge, nowSeconds: now })).toBe(true);
  });

  it("rejects a timestamp too far in the future", async () => {
    const future = await signedAt(now + 301);
    expect(await verify({ ...base, ...future, nowSeconds: now })).toBe(false);
  });

  it("rejects missing or malformed headers", async () => {
    const s = await signedAt(now);
    expect(await verify({ ...base, timestamp: null, signature: s.signature, nowSeconds: now })).toBe(false);
    expect(await verify({ ...base, timestamp: s.timestamp, signature: null, nowSeconds: now })).toBe(false);
    expect(await verify({ ...base, timestamp: s.timestamp, signature: "v1=zz", nowSeconds: now })).toBe(false);
    expect(await verify({ ...base, timestamp: s.timestamp, signature: s.signature.slice(3), nowSeconds: now })).toBe(false);
  });

  it("matches a known HMAC-SHA256 value, so n8n can implement the same string", async () => {
    // Pins the canonical string format ("v1:ts:METHOD:path:body") that n8n must reproduce.
    const header = await sign({ secret: "key", method: "get", pathname: "/p", rawBody: "", timestamp: "1" });
    const expected = await crypto.subtle
      .importKey("raw", new TextEncoder().encode("key"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
      .then((k) => crypto.subtle.sign("HMAC", k, new TextEncoder().encode("v1:1:GET:/p:")));
    const hex = Array.from(new Uint8Array(expected), (b) => b.toString(16).padStart(2, "0")).join("");
    expect(header).toBe(`v1=${hex}`);
  });
});
