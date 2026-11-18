// HMAC-SHA256 request signing for the Convex <-> n8n integration, both directions.
//
// Headers:  X-LendLoop-Timestamp: <unix seconds>
//           X-LendLoop-Signature: v1=<hex>
// hex = HMAC_SHA256(secret, "v1:" + timestamp + ":" + METHOD + ":" + pathname + ":" + rawBody)
//
// Method and path are part of the signed string so a signed body cannot be replayed
// against another endpoint. The timestamp limits replays to a 5 minute window.

export const TIMESTAMP_HEADER = "X-LendLoop-Timestamp";
export const SIGNATURE_HEADER = "X-LendLoop-Signature";
export const MAX_SKEW_SECONDS = 300;

const encoder = new TextEncoder();

export type SignedParts = {
  secret: string;
  method: string;
  pathname: string;
  /** The exact body text that is sent or received (empty string for GET). */
  rawBody: string;
  /** Unix seconds, as the string that travels in the header. */
  timestamp: string;
};

function canonicalString({ timestamp, method, pathname, rawBody }: SignedParts): string {
  return `v1:${timestamp}:${method.toUpperCase()}:${pathname}:${rawBody}`;
}

function importKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

/** Returns the header value, "v1=<hex>". */
export async function sign(parts: SignedParts): Promise<string> {
  const key = await importKey(parts.secret, "sign");
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(canonicalString(parts)));
  return `v1=${toHex(mac)}`;
}

/**
 * True only when the signature matches and the timestamp is inside the replay window.
 * crypto.subtle.verify compares the MAC in constant time, so no hand-rolled compare.
 */
export async function verify(
  parts: Omit<SignedParts, "timestamp"> & {
    timestamp: string | null;
    signature: string | null;
    nowSeconds?: number;
  },
): Promise<boolean> {
  const { timestamp, signature, nowSeconds = Math.floor(Date.now() / 1000) } = parts;
  if (!parts.secret || timestamp === null || signature === null) return false;
  if (!/^\d{1,12}$/.test(timestamp)) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > MAX_SKEW_SECONDS) return false;
  const match = /^v1=([0-9a-f]{64})$/.exec(signature);
  if (!match) return false;
  const key = await importKey(parts.secret, "verify");
  return await crypto.subtle.verify("HMAC", key, fromHex(match[1]), encoder.encode(canonicalString({ ...parts, timestamp })));
}

/** Headers for an outgoing signed request. */
export async function signedHeaders(parts: Omit<SignedParts, "timestamp">): Promise<Record<string, string>> {
  const timestamp = String(Math.floor(Date.now() / 1000));
  return {
    [TIMESTAMP_HEADER]: timestamp,
    [SIGNATURE_HEADER]: await sign({ ...parts, timestamp }),
  };
}
