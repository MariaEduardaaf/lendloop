import type { Infer } from "convex/values";
import { categoryValidator, conditionValidator, loanStatusValidator } from "@convex/lib/validators";

// Display labels for the values defined in convex/lib/validators.ts. The Record
// types make TypeScript fail here if a value is added there and not labelled.

export type Category = Infer<typeof categoryValidator>;
export type Condition = Infer<typeof conditionValidator>;
export type LoanStatus = Infer<typeof loanStatusValidator>;

export const CATEGORY_LABELS: Record<Category, string> = {
  power_tools: "Power tools",
  hand_tools: "Hand tools",
  garden: "Garden",
  kitchen: "Kitchen",
  camping: "Camping",
  cleaning: "Cleaning",
  other: "Other",
};

export const CONDITION_LABELS: Record<Condition, string> = {
  like_new: "Like new",
  good: "Good",
  fair: "Fair",
  worn: "Worn",
};

export const STATUS_LABELS: Record<LoanStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
  cancelled: "Cancelled",
  returned: "Returned",
};

// The option lists come straight from the validators, so they cannot drift.
export const CATEGORIES = categoryValidator.members.map((m) => m.value);
export const CONDITIONS = conditionValidator.members.map((m) => m.value);
