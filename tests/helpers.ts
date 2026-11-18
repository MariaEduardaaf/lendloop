import { convexTest } from "convex-test";
import type { Id } from "../convex/_generated/dataModel";
import schema from "../convex/schema";
import { todayUtc } from "../convex/lib/dates";

const modules = import.meta.glob(["../convex/**/*.ts", "../convex/**/*.js", "!../convex/**/*.d.ts"]);

export type TestConvex = ReturnType<typeof newBackend>;

export function newBackend() {
  return convexTest(schema, modules);
}

/** Creates a user row and returns a handle that calls Convex as that user (identity mocked). */
export async function addUser(
  t: TestConvex,
  key: string,
  options: { role?: "admin" | "user"; trustedLender?: boolean } = {},
) {
  const tokenIdentifier = `https://test.clerk.dev|${key}`;
  const id = await t.run((ctx) =>
    ctx.db.insert("users", {
      tokenIdentifier,
      firstName: key[0].toUpperCase() + key.slice(1),
      email: `${key}@example.com`,
      role: options.role ?? "user",
      trustedLender: options.trustedLender ?? false,
      createdAt: Date.now(),
    }),
  );
  return {
    id,
    as: t.withIdentity({ tokenIdentifier, subject: key, givenName: key, email: `${key}@example.com` }),
  };
}

export function addTool(t: TestConvex, ownerId: Id<"users">, name = "Cordless drill") {
  return t.run((ctx) =>
    ctx.db.insert("tools", {
      ownerId,
      name,
      category: "power_tools",
      condition: "good",
      description: "Works well",
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }),
  );
}

/** A date relative to today (UTC), as YYYY-MM-DD. */
export function inDays(days: number): string {
  return new Date(Date.parse(`${todayUtc()}T00:00:00.000Z`) + days * 86_400_000).toISOString().slice(0, 10);
}

export function addLoan(
  t: TestConvex,
  loan: {
    toolId: Id<"tools">;
    ownerId: Id<"users">;
    borrowerId: Id<"users">;
    startOffset: number;
    endOffset: number;
    status: "pending" | "approved" | "declined" | "cancelled" | "returned";
  },
) {
  return t.run((ctx) =>
    ctx.db.insert("loans", {
      toolId: loan.toolId,
      ownerId: loan.ownerId,
      borrowerId: loan.borrowerId,
      startDate: inDays(loan.startOffset),
      endDate: inDays(loan.endOffset),
      status: loan.status,
      createdAt: Date.now(),
    }),
  );
}

/** Convex errors thrown with ConvexError carry the message in `data`. */
export async function errorMessage(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (e) {
    const data = (e as { data?: unknown }).data;
    return typeof data === "string" ? data : String(e);
  }
  throw new Error("Expected the call to be rejected");
}
