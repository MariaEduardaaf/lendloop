"use client";

import type { FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";
import { formatShortRange } from "@/lib/format";
import { ADMIN_FILTERS, adminFilter, loanStage, type AdminFilter, type Stage } from "@/lib/loan-stage";
import { EmptyState } from "../empty-state";
import { STAGE_MARK, STAGE_TONE } from "../loans/loan-card";
import { chipClass } from "../tools/category-filter";
import { listPlate, Section } from "./section";

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

function StageText({ stage }: { stage: Stage }) {
  return (
    <span className={`flex items-center gap-2 font-semibold ${STAGE_TONE[stage.key] ?? ""}`}>
      <span aria-hidden="true" className={`size-3 shrink-0 rounded-[2px] border-[1.5px] ${STAGE_MARK[stage.key]}`} />
      {stage.text}
    </span>
  );
}

const TH = "px-4 py-2.5 text-left label-caps text-muted";

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
        <>
          <div role="group" aria-label="Filter loans by status" className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {(["all", ...ADMIN_FILTERS] as const).map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => onFilter(f)} className={chipClass(filter === f)}>
                {FILTER_LABELS[f]} <span className="ml-1 tabular-nums opacity-80">{count(f)}</span>
              </button>
            ))}
          </div>

          {shown.length === 0 ? (
            <p className="mt-4 rounded-md border border-dashed border-edge bg-plate px-4 py-6 text-center text-muted">
              No loans are {FILTER_LABELS[filter].toLowerCase()} right now.
            </p>
          ) : (
            <>
              <div className="mt-4 hidden overflow-hidden rounded-md border border-steel bg-plate md:block">
              <table className="w-full text-sm">
                <caption className="sr-only">Loans, {FILTER_LABELS[filter].toLowerCase()}, late first</caption>
                <thead className="border-b border-steel bg-ground">
                  <tr>
                    <th scope="col" className={TH}>Tool</th>
                    <th scope="col" className={TH}>Lender</th>
                    <th scope="col" className={TH}>Borrower</th>
                    <th scope="col" className={TH}>Dates</th>
                    <th scope="col" className={TH}>Stage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-steel">
                  {shown.map(({ loan, stage }) => (
                    <tr key={loan._id}>
                      <th scope="row" className="px-4 py-3 text-left font-bold">{loan.toolName}</th>
                      <td className="px-4 py-3">{loan.ownerFirstName}</td>
                      <td className="px-4 py-3">{loan.borrowerFirstName}</td>
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums">{formatShortRange(loan.startDate, loan.endDate)}</td>
                      <td className="px-4 py-3"><StageText stage={stage} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <ul className={`mt-4 md:hidden ${listPlate}`}>
                {shown.map(({ loan, stage }) => (
                  <li key={loan._id} className="space-y-1 px-4 py-3 text-sm">
                    <p className="font-bold break-words">{loan.toolName}</p>
                    <StageText stage={stage} />
                    <p className="text-muted">
                      {loan.ownerFirstName} lends to {loan.borrowerFirstName},{" "}
                      <span className="tabular-nums">{formatShortRange(loan.startDate, loan.endDate)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </Section>
  );
}
