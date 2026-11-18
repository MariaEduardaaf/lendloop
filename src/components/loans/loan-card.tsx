import type { ReactNode } from "react";
import { activityText } from "@/lib/activity";
import { formatLoanDates } from "@/lib/format";
import type { Perspective, Stage, StageKey } from "@/lib/loan-stage";
import type { LoanRow } from "@/lib/types";
import { CategoryGlyph } from "../category-glyph";
import { StatusPill } from "../status-pill";

// The stage drawn in the strip's own vocabulary: dashed waiting, hollow coming up,
// filled out, struck when it ended without a loan.
export const STAGE_MARK: Record<StageKey, string> = {
  pending: "border-dashed border-dock",
  expired: "border-dashed border-edge",
  upcoming: "border-dock",
  out: "border-dock bg-dock",
  due_today: "border-dock bg-dock",
  late: "border-late bg-late",
  returned: "border-free bg-free",
  declined: "border-edge bg-[linear-gradient(135deg,transparent_45%,var(--color-edge)_45%,var(--color-edge)_55%,transparent_55%)]",
  cancelled: "border-edge bg-[linear-gradient(135deg,transparent_45%,var(--color-edge)_45%,var(--color-edge)_55%,transparent_55%)]",
};

export const STAGE_TONE: Partial<Record<StageKey, string>> = { late: "text-late", returned: "text-free" };

type Props = {
  loan: LoanRow;
  /** Whose side the card speaks from, for the automation line ("You were e-mailed"). */
  side: Perspective;
  /** Who else is involved, from the viewer's side ("Lender: Cara"). */
  people: ReactNode;
  stage?: Stage;
  /** Extra context under the dates, such as the borrower's history for the lender. */
  context?: ReactNode;
  actions?: ReactNode;
};

/**
 * One loan or request. The stage sentence leads, the dates are the largest line, and the
 * automation log is one quiet line (a failed delivery always stays visible).
 */
export function LoanCard({ loan, side, people, stage, context, actions }: Props) {
  return (
    <li className="rounded-md border border-steel bg-plate p-4 shadow-[0_1px_2px_rgba(29,43,58,0.08)] sm:p-5">
      <div className="flex items-start gap-3">
        <CategoryGlyph category={loan.toolCategory} />
        <div className="min-w-0 flex-1">
          <h3 className="text-h3 font-bold break-words">{loan.toolName}</h3>
          <p className="text-sm text-muted">{people}</p>
        </div>
        {!stage && <StatusPill status={loan.status} />}
      </div>
      {stage && (
        <p className={`mt-4 flex items-center gap-2 font-semibold ${STAGE_TONE[stage.key] ?? ""}`}>
          <span aria-hidden="true" className={`size-3 shrink-0 rounded-[2px] border-[1.5px] ${STAGE_MARK[stage.key]}`} />
          {stage.text}
        </p>
      )}
      <p className="mt-1 text-h2 font-bold tabular-nums">{formatLoanDates(loan.startDate, loan.endDate)}</p>
      {context && <div className="mt-3">{context}</div>}
      {actions && <div className="mt-4 flex flex-wrap items-start gap-2">{actions}</div>}
      <AutomationLog loan={loan} side={side} />
    </li>
  );
}

function AutomationLog({ loan, side }: { loan: LoanRow; side: Perspective }) {
  const { activity } = loan;
  if (activity.length === 0) return null;
  const line = (event: LoanRow["activity"][number]) => activityText(event, loan, side);
  const [latest, ...older] = activity;
  const failed = older.find((e) => e.status === "failed");
  const failure = "font-semibold text-late";
  return (
    <div className="mt-4 space-y-1 border-t border-steel pt-3 text-sm text-muted">
      <p className={latest.status === "failed" ? failure : ""}>{line(latest)}</p>
      {failed && <p className={failure}>{line(failed)}</p>}
      {older.length > 0 && (
        <details>
          <summary className="w-fit cursor-pointer underline">Automation history</summary>
          <ul className="mt-1 space-y-0.5">
            {older.map((event) => (
              <li key={`${event.kind}-${event.eventType ?? ""}-${event.occurredAt}`}>{line(event)}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
