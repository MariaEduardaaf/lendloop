import Link from "next/link";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/lib/labels";
import type { ToolRow } from "@/lib/types";
import { AvailabilityStrip } from "../availability-strip";
import { Avatar } from "../avatar";
import { quietLinkButtonClass } from "../button";
import { CategoryGlyph } from "../category-glyph";
import { TrustedSeal } from "../trusted-seal";
import { RequestForm } from "./request-form";

/**
 * One tool on the board: what it is, when it is free, who lends it, and the borrow request.
 * Never who borrowed it: every signed-in neighbor sees this board.
 */
export function ToolCard({ tool, today }: { tool: ToolRow; today: string }) {
  return (
    <li className="flex flex-col rounded-card bg-surface p-5 shadow-soft sm:p-6">
      <div className="flex items-center gap-3.5">
        <CategoryGlyph category={tool.category} />
        <div className="min-w-0">
          <h3 className="text-h3 font-bold tracking-[-0.01em] break-words">{tool.name}</h3>
          <p className="mt-0.5 text-[0.9375rem] text-muted">
            {CATEGORY_LABELS[tool.category]} · {CONDITION_LABELS[tool.condition]}
            <span className="sr-only"> condition</span>
          </p>
        </div>
      </div>
      {tool.description && <p className="mt-4 line-clamp-2 text-[0.9375rem] break-words text-muted">{tool.description}</p>}
      <div className="mt-5">
        <AvailabilityStrip today={today} availability={tool} />
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-3 border-t border-line pt-4">
        <Avatar name={tool.ownerFirstName} />
        <span className="text-[0.9375rem] font-semibold">{tool.isMine ? "You" : tool.ownerFirstName}</span>
        {tool.ownerTrustedLender && <TrustedSeal />}
        {tool.isMine ? (
          <Link href="/listings" className={`${quietLinkButtonClass} ml-auto`}>
            Manage<span className="sr-only"> {tool.name} in My listings</span>
          </Link>
        ) : (
          <RequestForm toolId={tool._id} toolName={tool.name} today={today} availability={tool} />
        )}
      </div>
    </li>
  );
}
