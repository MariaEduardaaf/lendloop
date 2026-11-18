import { httpRouter } from "convex/server";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";
import { SIGNATURE_HEADER, TIMESTAMP_HEADER, verify } from "./lib/hmac";
import { parseNotificationResultBody, parseReminderBody, parseWorkflowErrorBody } from "./lib/payloads";

// n8n -> Convex endpoints, served at the deployment's site URL (CONVEX_SITE_URL).
// Every request must carry a valid HMAC signature made with N8N_TO_CONVEX_SECRET.

const http = httpRouter();

const MAX_BODY_CHARS = 20_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// Same response for every auth failure, so callers learn nothing about why.
const unauthorized = () => new Response("Unauthorized", { status: 401 });
const badRequest = (message: string) => json({ error: message }, 400);

/**
 * Verifies the signature over the RAW body text (never over re-serialized JSON).
 * Returns the raw body when valid, null otherwise. Fails closed without a secret.
 */
async function authenticate(req: Request): Promise<string | null> {
  const secret = process.env.N8N_TO_CONVEX_SECRET;
  if (!secret) return null;
  const rawBody = await req.text();
  const ok = await verify({
    secret,
    method: req.method,
    pathname: new URL(req.url).pathname,
    rawBody,
    timestamp: req.headers.get(TIMESTAMP_HEADER),
    signature: req.headers.get(SIGNATURE_HEADER),
  });
  return ok ? rawBody : null;
}

/** Runs a write-back and answers 400 when the mutation rejects it with a ConvexError. */
async function writeBack(run: () => Promise<unknown>): Promise<Response> {
  try {
    return json(await run());
  } catch (e) {
    if (e instanceof ConvexError) return badRequest(String(e.data));
    throw e;
  }
}

function parseJson(rawBody: string): unknown {
  if (rawBody.length > MAX_BODY_CHARS) return undefined;
  try {
    return JSON.parse(rawBody);
  } catch {
    return undefined;
  }
}

http.route({
  path: "/n8n/overdue-loans",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    if ((await authenticate(req)) === null) return unauthorized();
    return json(await ctx.runQuery(internal.automation.overdueLoans, {}));
  }),
});

http.route({
  path: "/n8n/reminders",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const rawBody = await authenticate(req);
    if (rawBody === null) return unauthorized();
    const body = parseReminderBody(parseJson(rawBody));
    if (!body) return badRequest("Invalid body");
    return writeBack(() => ctx.runMutation(internal.automation.recordReminder, body));
  }),
});

http.route({
  path: "/n8n/notifications",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const rawBody = await authenticate(req);
    if (rawBody === null) return unauthorized();
    const body = parseNotificationResultBody(parseJson(rawBody));
    if (!body) return badRequest("Invalid body");
    return writeBack(() =>
      ctx.runMutation(internal.notifications.recordOutcome, {
        eventId: body.eventId,
        status: body.status === "sent" ? "delivered" : "failed",
        attempts: 1,
        lastError: body.error,
      }),
    );
  }),
});

http.route({
  path: "/n8n/workflow-errors",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const rawBody = await authenticate(req);
    if (rawBody === null) return unauthorized();
    const body = parseWorkflowErrorBody(parseJson(rawBody));
    if (!body) return badRequest("Invalid body");
    return json(await ctx.runMutation(internal.automation.recordWorkflowError, body));
  }),
});

export default http;
