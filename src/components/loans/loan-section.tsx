"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, CircleAlert } from "lucide-react";
import { activityText } from "@/lib/activity";
import { formatShortRange } from "@/lib/format";
import type { Perspective, Stage, StageGroup } from "@/lib/loan-stage";
import type { LoanRow } from "@/lib/types";
import { stageTextClass } from "./stage-label";

type Staged<T> = { loan: T & { startDate: string; endDate: string; createdAt: number }; stage: Stage };

/**
 * Sorts staged loans into their groups: next start first, late first among the ones out,
 * newest first in the past.
 */
export function groupLoans<T>(items: Staged<T>[]): Record<StageGroup, Staged<T>[]> {
  const by = (group: StageGroup) => items.filter((i) => i.stage.group === group);
  const late = (i: Staged<T>) => Number(i.stage.key === "late");
  return {
    waiting: by("waiting").sort((a, b) => a.loan.startDate.localeCompare(b.loan.startDate)),
    upcoming: by("upcoming").sort((a, b) => a.loan.startDate.localeCompare(b.loan.startDate)),
    out: by("out").sort((a, b) => late(b) - late(a) || a.loan.endDate.localeCompare(b.loan.endDate)),
    past: by("past").sort((a, b) => b.loan.createdAt - a.loan.createdAt),
  };
}

/** One group of loan cards under its h2. Renders nothing when the group is empty, so the page grid closes up. */
export function LoanSection({ id, title, count, children }: { id: string; title: string; count: number; children: ReactNode }) {
  if (count === 0) return null;
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="mx-1 flex items-center gap-3 text-h2 font-bold tracking-[-0.02em]">
        {title}{" "}
        <span className="grid h-7 min-w-7 place-items-center rounded-full bg-surface px-2.5 text-[0.9375rem] font-bold text-muted shadow-soft">
          {count}
        </span>
      </h2>
      <ul className="mt-4 space-y-4">{children}</ul>
    </section>
  );
}

const PAST_SHOWN = 3;

const outcome = (stage: Stage) =>
  stage.key === "declined" ? "Declined" : stage.key === "expired" ? "Not answered" : stage.text;

/**
 * Past loans are history, so they are compact rows in one card (newest first, 3 shown) instead of
 * full cards. A failed e-mail stays visible on its row; the rest of the automation log is one click away.
 */
export function PastLoans<T extends LoanRow>({
  items,
  side,
  person,
  actions,
}: {
  items: { loan: T; stage: Stage }[];
  side: Perspective;
  person: (loan: T) => { label: string; name: string };
  /** Clean-up still possible on a past row (an unanswered request can still be declined or cancelled). */
  actions?: (loan: T, stage: Stage) => ReactNode;
}) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, PAST_SHOWN);
  return (
    <li className="rounded-[1.875rem] bg-surface px-5 py-2 shadow-soft sm:px-6">
      <ul className="divide-y divide-line">
        {shown.map(({ loan, stage }) => {
          const who = person(loan);
          const line = (event: LoanRow["activity"][number]) => activityText(event, loan, side);
          const failures = loan.activity.filter((e) => e.status === "failed");
          const action = actions?.(loan, stage);
          return (
            <li key={loan._id} className="py-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <p className="font-bold break-words">{loan.toolName}</p>
                <p className={`text-[0.9375rem] font-semibold ${stageTextClass(stage.key)}`}>{outcome(stage)}</p>
              </div>
              <p className="mt-0.5 text-[0.9375rem] text-muted tabular-nums">
                {who.label}: {who.name} · {formatShortRange(loan.startDate, loan.endDate)}
              </p>
              {action && <div className="mt-2.5 flex flex-wrap gap-2.5">{action}</div>}
              {failures.map((event) => (
                <p key={event.occurredAt} className="mt-1.5 flex items-start gap-1.5 text-sm font-semibold text-late">
                  <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                  {line(event)}
                </p>
              ))}
              {loan.activity.length > 0 && (
                <details className="group mt-1.5 text-sm text-muted">
                  <summary className="flex w-fit cursor-pointer list-none items-center gap-1 font-semibold underline decoration-1 underline-offset-[3px] [&::-webkit-details-marker]:hidden">
                    Automation history
                    <ChevronDown aria-hidden="true" className="size-4 group-open:rotate-180" strokeWidth={2} />
                  </summary>
                  <ul className="mt-2 space-y-1">
                    {loan.activity.map((event) => (
                      <li key={`${event.kind}-${event.eventType ?? ""}-${event.occurredAt}`}>{line(event)}</li>
                    ))}
                  </ul>
                </details>
              )}
            </li>
          );
        })}
      </ul>
      {items.length > PAST_SHOWN && (
        <button
          type="button"
          aria-expanded={all}
          onClick={() => setAll(!all)}
          className="my-2 flex min-h-10 items-center gap-1 rounded-full font-semibold underline decoration-1 underline-offset-[3px]"
        >
          {all ? "Show fewer" : `Show all ${items.length}`}
          <ChevronDown aria-hidden="true" className={`size-4 ${all ? "rotate-180" : ""}`} strokeWidth={2} />
        </button>
      )}
    </li>
  );
}
