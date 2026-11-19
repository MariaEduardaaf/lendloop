import type { ReactNode } from "react";
import type { Stage, StageGroup } from "@/lib/loan-stage";

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
