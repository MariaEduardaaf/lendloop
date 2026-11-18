import { CATEGORY_LABELS, CONDITION_LABELS } from "@/lib/labels";
import type { ToolRow } from "@/lib/types";
import { Badge } from "../badge";
import { AvailabilityBadge } from "../status-pill";
import { RequestForm } from "./request-form";

/** One tool on the board: details, owner, availability and the borrow request. */
export function ToolCard({ tool }: { tool: ToolRow }) {
  return (
    <li className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-stone-900">{tool.name}</h3>
          <p className="text-sm text-stone-600">
            {CATEGORY_LABELS[tool.category]} · {CONDITION_LABELS[tool.condition]} condition
          </p>
        </div>
        <AvailabilityBadge availability={tool.availability} />
      </div>
      <p className="whitespace-pre-line break-words text-sm text-stone-700">{tool.description}</p>
      <p className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
        Lent by {tool.ownerFirstName}
        {tool.ownerTrustedLender && <Badge tone="accent">Trusted Lender</Badge>}
      </p>
      <div className="mt-auto border-t border-stone-100 pt-4">
        {tool.isMine ? (
          <p className="text-sm text-stone-600">This is your tool, so you cannot request it.</p>
        ) : (
          <div className="space-y-2">
            {tool.availability === "on_loan" && (
              <p className="text-sm text-stone-600">Out on loan right now. You can still request later dates.</p>
            )}
            <RequestForm toolId={tool._id} />
          </div>
        )}
      </div>
    </li>
  );
}
