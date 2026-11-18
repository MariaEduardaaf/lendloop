import type { ReactNode } from "react";
import { CATEGORY_LABELS } from "@/lib/labels";
import { formatDateRange } from "@/lib/format";
import { activityText } from "@/lib/activity";
import type { LoanRow } from "@/lib/types";
import { Badge } from "../badge";
import { StatusPill } from "../status-pill";

/**
 * One loan or request. `people` says who is involved from the viewer's side
 * ("Lender: Ana"), `actions` holds the buttons for that view. The activity list shows
 * what the n8n workflows did for this loan.
 */
export function LoanCard({ loan, people, actions }: { loan: LoanRow; people: string; actions?: ReactNode }) {
  return (
    <li className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-stone-900">{loan.toolName}</h3>
          <p className="text-sm text-stone-600">{CATEGORY_LABELS[loan.toolCategory]}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <StatusPill status={loan.status} />
          {loan.overdue && <Badge tone="bad">Overdue</Badge>}
          {loan.expired && <Badge tone="neutral">Dates passed</Badge>}
        </div>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="text-stone-600">Dates</dt>
          <dd>{formatDateRange(loan.startDate, loan.endDate)}</dd>
        </div>
        <div>{people}</div>
      </dl>
      {loan.activity.length > 0 && (
        <ul aria-label="Automation activity" className="mt-3 space-y-0.5 border-t border-stone-100 pt-3 text-sm text-stone-600">
          {loan.activity.map((event) => (
            <li key={`${event.kind}-${event.eventType ?? ""}-${event.occurredAt}`}>{activityText(event)}</li>
          ))}
        </ul>
      )}
      {actions && <div className="mt-4 space-y-2">{actions}</div>}
    </li>
  );
}
