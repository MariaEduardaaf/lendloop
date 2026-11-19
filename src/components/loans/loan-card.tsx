import type { ReactNode } from "react";
import { ChevronDown, CircleAlert } from "lucide-react";
import { activityText } from "@/lib/activity";
import { formatLoanSpan } from "@/lib/format";
import type { Perspective, Stage } from "@/lib/loan-stage";
import type { LoanRow } from "@/lib/types";
import { Avatar } from "../avatar";
import { CategoryGlyph } from "../category-glyph";
import { StatusPill } from "../status-pill";
import { needsAnswer, StageLabel, stageTextClass } from "./stage-label";

type Props = {
  loan: LoanRow;
  /** Whose side the card speaks from, for the automation line ("You were e-mailed"). */
  side: Perspective;
  /** The other party, from the viewer's side ({ label: "Lender", name: "Cara" }). */
  person: { label: string; name: string };
  stage?: Stage;
  /** Extra context next to the other party, such as the borrower's history for the lender. */
  context?: ReactNode;
  actions?: ReactNode;
};

/**
 * One loan or request. A card that needs the viewer's decision is the solid mustard card; every
 * other stage is a light card with a stage chip. The tool name is the title with its category
 * glyph, the dates are a quiet line under it, and the automation log is one quiet line (a failed
 * delivery always stays visible).
 */
export function LoanCard({ loan, side, person, stage, context, actions }: Props) {
  const ask = !!stage && needsAnswer(stage.key, side);
  // Where the sentence only restates the chip, say it once: in the chip, with the name if it has one.
  const named = !!stage && !ask && (stage.key === "pending" || stage.key === "declined");
  const sentence = stage && !ask && !named && stage.key !== "cancelled" && stage.key !== "expired" ? stage.text : null;
  return (
    <li className={`rounded-[1.875rem] p-5 shadow-soft sm:p-6 ${ask ? "bg-mustard text-ink" : "bg-surface"}`}>
      {stage ? <StageLabel stageKey={stage.key} side={side} label={named ? stage.text : undefined} /> : <StatusPill status={loan.status} />}
      <div className="mt-4 flex items-center gap-3.5">
        <CategoryGlyph category={loan.toolCategory} className={ask ? "bg-white/45" : "bg-soft"} />
        <div className="min-w-0">
          <h3 className="text-h3 font-bold tracking-[-0.01em] break-words">{loan.toolName}</h3>
          <p className={`mt-0.5 font-semibold text-pretty tabular-nums ${ask ? "text-mustard-ink" : "text-muted"}`}>
            {formatLoanSpan(loan.startDate, loan.endDate)}
          </p>
        </div>
      </div>
      {sentence && stage && <p className={`mt-3 font-semibold ${stageTextClass(stage.key)}`}>{sentence}</p>}
      <div className={`mt-4 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.9375rem] ${ask ? "text-mustard-ink" : "text-muted"}`}>
        <Avatar name={person.name} />
        <span>
          {person.label}: <span className={`font-semibold ${ask ? "" : "text-ink"}`}>{person.name}</span>
        </span>
        {/* The dot lives with the context, so a wrap carries it to the next line instead of leaving it dangling. */}
        {context && (
          <span className="inline-flex items-center gap-x-2.5 font-semibold">
            <span aria-hidden="true">·</span>
            {context}
          </span>
        )}
      </div>
      {actions && <div className="mt-5 flex flex-wrap items-start gap-2.5">{actions}</div>}
      <AutomationLog loan={loan} side={side} onMustard={ask} />
    </li>
  );
}

function AutomationLog({ loan, side, onMustard }: { loan: LoanRow; side: Perspective; onMustard: boolean }) {
  const { activity } = loan;
  if (activity.length === 0) return null;
  const line = (event: LoanRow["activity"][number]) => activityText(event, loan, side);
  const [latest, ...older] = activity;
  const failed = older.find((e) => e.status === "failed");
  // Late red is too faint on mustard, so a failure there is ink, bold and marked with the icon.
  const failure = (text: string) => (
    <p className={`flex items-start gap-1.5 font-semibold ${onMustard ? "text-ink" : "text-late"}`}>
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
      {text}
    </p>
  );
  return (
    <div
      className={`mt-5 space-y-1 border-t pt-4 text-sm ${onMustard ? "border-ink/15 text-mustard-ink" : "border-line text-muted"}`}
    >
      {latest.status === "failed" ? failure(line(latest)) : <p>{line(latest)}</p>}
      {failed && failure(line(failed))}
      {older.length > 0 && (
        <details className="group">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 font-semibold underline decoration-1 underline-offset-[3px] [&::-webkit-details-marker]:hidden">
            Automation history
            <ChevronDown aria-hidden="true" className="size-4 group-open:rotate-180" strokeWidth={2} />
          </summary>
          <ul className="mt-2 space-y-1">
            {older.map((event) => (
              <li key={`${event.kind}-${event.eventType ?? ""}-${event.occurredAt}`}>{line(event)}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
