"use client";

import type { FunctionReturnType } from "convex/server";
import { CircleAlert } from "lucide-react";
import type { api } from "@convex/_generated/api";
import { activityText } from "@/lib/activity";
import { formatShortRange } from "@/lib/format";
import { ADMIN_FILTERS, adminFilter, loanStage, type AdminFilter, type Stage } from "@/lib/loan-stage";
import { Avatar } from "../avatar";
import { EmptyState } from "../empty-state";
import { StageLabel, stageTextClass } from "../loans/stage-label";
import { chipClass } from "../tools/category-filter";
import { Section } from "./section";

type AdminLoan = FunctionReturnType<typeof api.admin.listAllLoans>[number];
export type AdminRow = { loan: AdminLoan; stage: Stage; filter: AdminFilter };
export type LoanFilter = AdminFilter | "all";

export const FILTER_LABELS: Record<LoanFilter, string> = {
  all: "All",
  late: "Late",
  pending: "Pending",
  out: "Out now",
  upcoming: "Coming up",
  past: "Past",
};

/**
 * Stages every loan from outside and sorts what needs attention first: late (most overdue
 * first), pending (soonest start), out now (soonest back), coming up, then past (newest).
 */
export function adminRows(loans: AdminLoan[], today: string): AdminRow[] {
  const rows = loans.map((loan) => {
    const stage = loanStage(loan, today, "admin");
    return { loan, stage, filter: adminFilter(stage.key) };
  });
  const within = (a: AdminRow, b: AdminRow) => {
    if (a.filter === "past") return b.loan.createdAt - a.loan.createdAt;
    const date = a.filter === "pending" || a.filter === "upcoming" ? "startDate" : "endDate";
    return a.loan[date].localeCompare(b.loan[date]);
  };
  return rows.sort((a, b) => ADMIN_FILTERS.indexOf(a.filter) - ADMIN_FILTERS.indexOf(b.filter) || within(a, b));
}

/** The stage chip with its sentence ("3 days late, was due 15 Nov") under it. */
function StageCell({ stage }: { stage: Stage }) {
  return (
    <div className="flex flex-col items-start gap-1.5">
      <StageLabel stageKey={stage.key} side="admin" />
      {/* The chip already says "Cancelled". */}
      {stage.key !== "cancelled" && <span className={`font-semibold ${stageTextClass(stage.key)}`}>{stage.text}</span>}
    </div>
  );
}

/**
 * The latest automation event of a loan ("Reminder e-mailed to Ben 2 hours ago"). A failed
 * delivery is red with an icon and the word "failed", so it never passes silently.
 */
function LastEmail({ loan }: { loan: AdminLoan }) {
  const latest = loan.activity[0];
  if (!latest) return <span className="text-muted">None yet</span>;
  const text = activityText(latest, loan, "admin");
  if (latest.status !== "failed") return <span className="text-muted">{text}</span>;
  return (
    <span className="flex items-start gap-1.5 font-semibold text-late">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
      {text}
    </span>
  );
}

/** A first name with its avatar, as on the board. */
function Person({ name }: { name: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <Avatar name={name} />
      {name}
    </span>
  );
}

const TH = "px-4 pt-2 pb-3 text-left text-sm font-semibold text-muted";

/** Every loan as a compact table (stacked rows on phones), with status filters. */
export function AdminLoans({
  rows,
  filter,
  onFilter,
}: {
  rows: AdminRow[];
  filter: LoanFilter;
  onFilter: (filter: LoanFilter) => void;
}) {
  const shown = filter === "all" ? rows : rows.filter((r) => r.filter === filter);
  const count = (f: LoanFilter) => (f === "all" ? rows.length : rows.filter((r) => r.filter === f).length);

  return (
    <Section id="loans" title="Loans" count={rows.length}>
      {rows.length === 0 ? (
        <EmptyState title="No loans yet" hint="Requests will appear here as neighbors borrow tools." />
      ) : (
        <div className="rounded-card bg-surface p-3 shadow-soft sm:p-4">
          <div role="group" aria-label="Filter loans by status" className="flex flex-wrap gap-2 p-1">
            {(["all", ...ADMIN_FILTERS] as const).map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => onFilter(f)} className={chipClass(filter === f)}>
                {FILTER_LABELS[f]} <span className="ml-1 tabular-nums opacity-80">{count(f)}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="mt-3 rounded-[1.25rem] bg-ground px-4 py-8 text-center text-muted">
              No loans are {FILTER_LABELS[filter].toLowerCase()} right now.
            </p>
          ) : (
            <>
              <table className="mt-4 hidden w-full text-[0.9375rem] md:table">
                <caption className="sr-only">Loans, {FILTER_LABELS[filter].toLowerCase()}, late first</caption>
                <thead className="border-b border-line">
                  <tr>
                    <th scope="col" className={TH}>Tool</th>
                    <th scope="col" className={TH}>Lender</th>
                    <th scope="col" className={TH}>Borrower</th>
                    <th scope="col" className={TH}>Dates</th>
                    <th scope="col" className={TH}>Stage</th>
                    <th scope="col" className={TH}>Last e-mail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map(({ loan, stage }) => (
                    <tr key={loan._id}>
                      <th scope="row" className="px-4 py-4 text-left font-bold">{loan.toolName}</th>
                      <td className="px-4 py-4"><Person name={loan.ownerFirstName} /></td>
                      <td className="px-4 py-4"><Person name={loan.borrowerFirstName} /></td>
                      <td className="px-4 py-4 font-semibold whitespace-nowrap tabular-nums">{formatShortRange(loan.startDate, loan.endDate)}</td>
                      <td className="px-4 py-4"><StageCell stage={stage} /></td>
                      <td className="px-4 py-4"><LastEmail loan={loan} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <ul className="mt-3 divide-y divide-line md:hidden">
                {shown.map(({ loan, stage }) => (
                  <li key={loan._id} className="space-y-2 px-2 py-4">
                    <p className="text-h3 font-bold break-words">{loan.toolName}</p>
                    <StageCell stage={stage} />
                    <p className="text-[0.9375rem] text-muted">
                      {loan.ownerFirstName} lends to {loan.borrowerFirstName},{" "}
                      <span className="font-semibold text-ink tabular-nums">{formatShortRange(loan.startDate, loan.endDate)}</span>
                    </p>
                    <p className="text-[0.9375rem]">
                      <span className="sr-only">Last e-mail: </span>
                      <LastEmail loan={loan} />
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Section>
  );
}
