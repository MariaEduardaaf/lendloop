"use client";

import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { formatLoanDates, plural } from "@/lib/format";
import { loanStage } from "@/lib/loan-stage";
import type { IncomingRow } from "@/lib/types";
import { ActionButton } from "../action-button";
import { ConfirmAction } from "../confirm-action";
import { BorrowerContext } from "../loans/borrower-context";

const SHOWN = 2;

type Staged = { loan: IncomingRow; stage: ReturnType<typeof loanStage> };

/** The viewer's requests waiting for an answer, and their tools out now with late ones first. */
export function railLoans(loans: IncomingRow[], today: string) {
  const staged = loans.map((loan) => ({ loan, stage: loanStage(loan, today, "owner") }));
  return {
    waiting: staged.filter((s) => s.stage.key === "pending").sort((a, b) => a.loan.startDate.localeCompare(b.loan.startDate)),
    out: staged
      .filter((s) => s.stage.group === "out")
      .sort((a, b) => Number(b.stage.key === "late") - Number(a.stage.key === "late") || a.loan.endDate.localeCompare(b.loan.endDate)),
  };
}

/**
 * The viewer's own side of the board: requests on their tools waiting for an answer, and their
 * tools that are out now (late first). Only the viewer sees these, the plates never name borrowers.
 */
export function BoardRail({ waiting, out }: { waiting: Staged[]; out: Staged[] }) {
  const approve = useMutation(api.loans.approve);
  const decline = useMutation(api.loans.decline);

  const late = out.filter((s) => s.stage.key === "late").length;
  // Below lg the rail would push every plate below the fold, so phones get one line per group.
  const summary: string[] = [];
  if (waiting.length) summary.push(`${plural(waiting.length, "request")} ${waiting.length === 1 ? "needs" : "need"} your answer`);
  if (out.length) summary.push(`${plural(out.length, "tool")} out now${late ? `, ${late} late` : ""}`);

  return (
    <>
      <nav aria-label="Your loans" className="divide-y divide-steel rounded-md border border-steel bg-plate lg:hidden">
        {summary.map((line) => (
          <Link key={line} href="/incoming" className="block px-4 py-3 text-sm font-semibold underline decoration-edge hover:decoration-navy">
            {line}
          </Link>
        ))}
      </nav>
      <aside aria-label="Your loans" className="hidden space-y-4 lg:sticky lg:top-6 lg:block">
        {waiting.length > 0 && (
          <section aria-labelledby="rail-answer" className="rounded-md border border-steel bg-plate p-5">
            <h2 id="rail-answer" className="flex items-baseline gap-2 text-h2 font-bold">
              Needs your answer <span className="text-base font-semibold text-muted">{waiting.length}</span>
            </h2>
            <ul className="mt-4 divide-y divide-steel">
              {waiting.slice(0, SHOWN).map(({ loan }) => (
                <li key={loan._id} className="space-y-3 py-4 first:pt-0 last:pb-0">
                  <div>
                    <h3 className="text-h3 font-bold">
                      {loan.borrowerFirstName} wants your {loan.toolName}
                    </h3>
                    <p className="mt-1 text-sm text-muted">{formatLoanDates(loan.startDate, loan.endDate)}</p>
                  </div>
                  <BorrowerContext loan={loan} />
                  <div className="flex flex-wrap items-start gap-2">
                    <ActionButton variant="primary" label="Approve" onClick={() => approve({ loanId: loan._id })} />
                    <ConfirmAction
                      label="Decline"
                      prompt={`Decline ${loan.borrowerFirstName}'s request?`}
                      confirmLabel="Yes, decline"
                      onConfirm={() => decline({ loanId: loan._id })}
                    />
                  </div>
                </li>
              ))}
            </ul>
            {waiting.length > SHOWN && (
              <Link href="/incoming" className="mt-4 block text-sm font-semibold underline">
                See all {waiting.length} in Incoming requests
              </Link>
            )}
          </section>
        )}
        {out.length > 0 && (
          <section aria-labelledby="rail-out" className="rounded-md border border-steel bg-plate p-5">
            <h2 id="rail-out" className="flex items-baseline gap-2 text-h2 font-bold">
              Out now <span className="text-base font-semibold text-muted">{out.length}</span>
            </h2>
            <ul className="mt-4 space-y-3">
              {out.map(({ loan, stage }) => (
                <li key={loan._id} className="text-sm">
                  <span className="font-semibold">{loan.toolName}</span>
                  <span className={`block ${stage.key === "late" ? "font-semibold text-late" : "text-muted"}`}>
                    {stage.key === "late" ? `With ${loan.borrowerFirstName}, ${stage.text}` : stage.text}
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/incoming" className="mt-4 block text-sm font-semibold underline">
              Manage in Incoming requests
            </Link>
          </section>
        )}
      </aside>
    </>
  );
}
