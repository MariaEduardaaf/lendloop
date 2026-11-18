import { daysFrom, formatDay, formatShort, plural } from "./format";
import type { LoanStatus } from "./labels";

// Turns a loan row into what a person needs to read: what is happening and when,
// from the side of the person looking at it.

export type Perspective = "borrower" | "owner";

export type StageKey =
  | "pending"
  | "expired"
  | "upcoming"
  | "out"
  | "due_today"
  | "late"
  | "returned"
  | "declined"
  | "cancelled";

/** Where a card sits on /requests and /incoming. */
export type StageGroup = "waiting" | "upcoming" | "out" | "past";

export type Stage = { key: StageKey; group: StageGroup; text: string };

export type StageInput = {
  status: LoanStatus;
  startDate: string;
  endDate: string;
  returnedAt?: number;
  ownerFirstName: string;
  borrowerFirstName: string;
};

const GROUPS: Record<StageKey, StageGroup> = {
  pending: "waiting",
  expired: "past",
  upcoming: "upcoming",
  out: "out",
  due_today: "out",
  late: "out",
  returned: "past",
  declined: "past",
  cancelled: "past",
};

function stageText(key: StageKey, loan: StageInput, today: string, side: Perspective): string {
  const owner = side === "owner";
  switch (key) {
    case "pending":
      return owner ? "Waiting for your answer" : `Waiting for ${loan.ownerFirstName}`;
    case "expired":
      return "Dates passed, never answered";
    case "upcoming":
      return `Starts ${formatDay(loan.startDate)}`;
    case "out":
      return owner
        ? `With ${loan.borrowerFirstName}, back ${formatDay(loan.endDate)}`
        : `Out now, back ${formatDay(loan.endDate)}`;
    case "due_today":
      return owner ? `With ${loan.borrowerFirstName}, due back today` : "Due back today";
    case "late":
      return `${plural(daysFrom(loan.endDate, today), "day")} late, was due ${formatShort(loan.endDate)}`;
    case "returned":
      return loan.returnedAt ? `Returned ${formatShort(new Date(loan.returnedAt).toISOString().slice(0, 10))}` : "Returned";
    case "declined":
      return owner ? "You declined" : `${loan.ownerFirstName} declined`;
    case "cancelled":
      return "Cancelled";
  }
}

function stageKey(loan: StageInput, today: string): StageKey {
  if (loan.status === "pending") return loan.endDate < today ? "expired" : "pending";
  if (loan.status !== "approved") return loan.status;
  if (loan.startDate > today) return "upcoming";
  if (loan.endDate > today) return "out";
  return loan.endDate === today ? "due_today" : "late";
}

export function loanStage(loan: StageInput, today: string, side: Perspective): Stage {
  const key = stageKey(loan, today);
  return { key, group: GROUPS[key], text: stageText(key, loan, today, side) };
}
