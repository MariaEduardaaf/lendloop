import { v } from "convex/values";

// Shared value validators and limits. Keep the literal lists and the TypeScript
// types in one place so schema, mutations and the UI cannot drift apart.

export const categoryValidator = v.union(
  v.literal("power_tools"),
  v.literal("hand_tools"),
  v.literal("garden"),
  v.literal("kitchen"),
  v.literal("camping"),
  v.literal("cleaning"),
  v.literal("other"),
);

export const conditionValidator = v.union(
  v.literal("like_new"),
  v.literal("good"),
  v.literal("fair"),
  v.literal("worn"),
);

export const loanStatusValidator = v.union(
  v.literal("pending"),
  v.literal("approved"),
  v.literal("declined"),
  v.literal("cancelled"),
  v.literal("returned"),
);

export const cancelledByValidator = v.union(v.literal("owner"), v.literal("borrower"));

export const roleValidator = v.union(v.literal("admin"), v.literal("user"));

export const NOTIFICATION_TYPES = [
  "request.created",
  "request.approved",
  "request.declined",
  "request.cancelled",
  "loan.returned",
  "loan.cancelled",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * One line of text: control characters and runs of whitespace become a single space.
 * Used for values that end up in e-mail subjects and greetings (tool names, first names).
 */
export function singleLine(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f\s]+/g, " ").trim();
}

export const LIMITS = {
  toolNameMax: 80,
  descriptionMax: 500,
  maxLoanDays: 30,
  maxDaysAhead: 90,
} as const;
