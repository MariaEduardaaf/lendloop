import { CATEGORY_LABELS, CONDITION_LABELS } from "@/lib/labels";
import type { ToolRow } from "@/lib/types";
import { AvailabilityStrip } from "../availability-strip";
import { CategoryGlyph } from "../category-glyph";
import { Initial, TrustedSeal } from "../trusted-seal";
import { RequestForm } from "./request-form";

/**
 * One tool on the board: what it is, when it is free, who lends it, and the borrow request.
 * Never who borrowed it: every signed-in neighbor sees this board.
 */
export function ToolCard({ tool, today }: { tool: ToolRow; today: string }) {
  return (
    <li className="rounded-md border border-steel bg-plate p-4 shadow-[0_1px_2px_rgba(29,43,58,0.08)]">
      <div className="flex items-start gap-3">
        <CategoryGlyph category={tool.category} />
        <div className="min-w-0">
          <h3 className="text-h3 font-bold break-words">{tool.name}</h3>
          <p className="text-sm text-muted">
            {CATEGORY_LABELS[tool.category]}
            <span aria-hidden="true" className="mx-2 inline-block size-1 rounded-full bg-current align-middle" />
            {CONDITION_LABELS[tool.condition]} condition
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm break-words text-muted">{tool.description}</p>
      <div className="mt-4">
        <AvailabilityStrip today={today} availability={tool} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3 border-t border-steel pt-3">
        {tool.isMine ? (
          <span className="text-sm font-semibold">You</span>
        ) : (
          <>
            <Initial name={tool.ownerFirstName} />
            <span className="text-sm">{tool.ownerFirstName}</span>
          </>
        )}
        {tool.ownerTrustedLender && <TrustedSeal />}
        {tool.isMine ? (
          <span className="ml-auto text-sm font-semibold text-muted">Your tool</span>
        ) : (
          <RequestForm toolId={tool._id} toolName={tool.name} today={today} availability={tool} />
        )}
      </div>
    </li>
  );
}
