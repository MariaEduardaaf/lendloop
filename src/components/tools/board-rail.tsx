"use client";

import Link from "next/link";
import { useMutation } from "convex/react";
import { ArrowUpRight, Check, Clock, Hourglass, Mail } from "lucide-react";
import { api } from "@convex/_generated/api";
import { activityText } from "@/lib/activity";
import { formatLoanSpan, plural } from "@/lib/format";
import { loanStage } from "@/lib/loan-stage";
import type { IncomingRow } from "@/lib/types";
import { ActionButton } from "../action-button";
import { Avatar } from "../avatar";
import { ConfirmAction } from "../confirm-action";
import { BorrowerContext } from "../loans/borrower-context";
import { StageLabel } from "../loans/stage-label";

type Staged = { loan: IncomingRow; stage: ReturnType<typeof loanStage> };

/** The viewer's requests waiting for an answer (oldest first), and their tools out now with late ones first. */
export function railLoans(loans: IncomingRow[], today: string) {
  const staged = loans.map((loan) => ({ loan, stage: loanStage(loan, today, "owner") }));
  return {
    waiting: staged.filter((s) => s.stage.key === "pending").sort((a, b) => a.loan.createdAt - b.loan.createdAt),
    out: staged
      .filter((s) => s.stage.group === "out")
      .sort((a, b) => Number(b.stage.key === "late") - Number(a.stage.key === "late") || a.loan.endDate.localeCompare(b.loan.endDate)),
  };
}

/** Round link to the full card on Incoming requests. */
function OpenLink({ name, onMustard }: { name: string; onMustard?: boolean }) {
  return (
    <Link
      href="/incoming"
      className={`grid size-10 shrink-0 place-items-center rounded-full text-ink transition-colors duration-150 ease-out ${
        onMustard ? "bg-white/45 hover:bg-white/70" : "bg-soft hover:bg-soft-strong"
      }`}
    >
      <ArrowUpRight aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
      <span className="sr-only">Open {name} in Incoming requests</span>
    </Link>
  );
}

/**
 * The viewer's own side of the board: requests on their tools waiting for an answer, and their
 * tools that are out now (late first). Only the viewer sees these, the tool cards never name borrowers.
 */
export function BoardRail({ waiting, out }: { waiting: Staged[]; out: Staged[] }) {
  const approve = useMutation(api.loans.approve);
  const decline = useMutation(api.loans.decline);

  const late = out.filter((s) => s.stage.key === "late").length;
  // Below lg the column would push every tool below the fold, so phones get one line per group.
  const summary: { text: string; urgent: boolean }[] = [];
  if (waiting.length)
    summary.push({ text: `${plural(waiting.length, "request")} ${waiting.length === 1 ? "needs" : "need"} your answer`, urgent: true });
  if (out.length) summary.push({ text: `${plural(out.length, "tool")} out now${late ? `, ${late} late` : ""}`, urgent: false });

  return (
    <>
      <nav aria-label="Your loans" className="grid gap-2 sm:grid-cols-2 lg:hidden">
        {summary.map(({ text, urgent }) => (
          <Link
            key={text}
            href="/incoming"
            className={`flex min-h-14 items-center gap-3 rounded-[1.375rem] px-5 py-3 font-semibold shadow-soft transition-colors duration-150 ease-out ${
              urgent ? "bg-mustard text-ink hover:bg-[#e2b93d]" : "bg-surface text-ink hover:bg-soft"
            }`}
          >
            {urgent ? (
              <Hourglass aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={1.75} />
            ) : (
              <Clock aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={1.75} />
            )}
            <span className="flex-1">{text}</span>
            <ArrowUpRight aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={1.75} />
          </Link>
        ))}
      </nav>
      <aside aria-labelledby="rail-heading" className="hidden lg:block">
        <h2 id="rail-heading" className="text-h2 font-bold tracking-[-0.02em] lg:mt-[2.375rem]">
          Your loans
        </h2>
        <p className="mt-3 text-lg text-muted">Your tools that are out or asked for.</p>
        <ul className="mt-7 space-y-4">
          {/* One mustard card at a time: the oldest request. The rest wait behind one quiet link. */}
          {waiting.slice(0, 1).map(({ loan }) => (
            <li key={loan._id} className="rounded-[1.875rem] bg-mustard p-6 text-ink shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <StageLabel stageKey="pending" side="owner" />
                <OpenLink name={`${loan.borrowerFirstName}'s request`} onMustard />
              </div>
              <h3 className="mt-[18px] text-title leading-tight font-bold tracking-[-0.015em] text-balance">
                {loan.borrowerFirstName} wants your {loan.toolName}
              </h3>
              <p className="mt-1.5 font-semibold text-mustard-ink">{formatLoanSpan(loan.startDate, loan.endDate)}</p>
              <div className="mt-4 flex items-center gap-2.5 text-[0.9375rem] font-semibold text-mustard-ink">
                <Avatar name={loan.borrowerFirstName} />
                <BorrowerContext loan={loan} onMustard />
              </div>
              <div className="mt-[22px] flex flex-wrap items-start gap-2.5">
                <ActionButton
                  variant="primary"
                  size="lg"
                  icon={<Check aria-hidden="true" className="size-5" strokeWidth={2} />}
                  label="Approve"
                  onClick={() => approve({ loanId: loan._id })}
                />
                <ConfirmAction
                  variant="outline"
                  size="lg"
                  label="Decline"
                  prompt={`Decline ${loan.borrowerFirstName}'s request?`}
                  confirmLabel="Yes, decline"
                  onConfirm={() => decline({ loanId: loan._id })}
                />
              </div>
            </li>
          ))}
          {waiting.length > 1 && (
            <li className="mt-3!">
              <Link href="/incoming" className="mx-1.5 inline-flex min-h-10 items-center gap-1 font-semibold text-muted underline decoration-1 transition-colors duration-150 ease-out hover:text-ink">
                {waiting.length - 1} more waiting<span className="sr-only"> in Incoming requests</span>
                <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={2} />
              </Link>
            </li>
          )}
          {out.map(({ loan, stage }) => (
            <li key={loan._id} className="rounded-[1.875rem] bg-surface px-6 py-5 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <StageLabel stageKey={stage.key} side="owner" />
                <OpenLink name={loan.toolName} />
              </div>
              <h3 className="mt-3.5 text-h3 leading-tight font-bold tracking-[-0.015em]">{loan.toolName}</h3>
              <p className="mt-1.5 font-semibold text-muted">
                {stage.key === "late" ? (
                  <>
                    With {loan.borrowerFirstName} · <span className="font-semibold text-late">{stage.text}</span>
                  </>
                ) : (
                  stage.text
                )}
              </p>
              {stage.key === "late" && loan.activity[0] && (
                <p className="mt-4 flex items-center gap-2.5 text-[0.9375rem] font-semibold text-muted">
                  <Mail aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
                  {activityText(loan.activity[0], loan, "owner")}
                </p>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-5 px-1.5 text-sm text-muted">
          Only you and the borrower see who has your tool. Everyone else sees free and busy days.
        </p>
      </aside>
    </>
  );
}
