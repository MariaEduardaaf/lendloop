"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { availabilitySentence } from "@/lib/availability";
import { CATEGORY_LABELS } from "@/lib/labels";
import { ConfirmAction } from "../confirm-action";
import { EmptyState } from "../empty-state";
import { Loading } from "../feedback";
import { Avatar } from "../avatar";
import { CategoryGlyph } from "../category-glyph";
import { TrustedSeal } from "../trusted-seal";
import { listCard, Section } from "./section";

const TONE = { free: "text-moss", out: "text-ink", late: "text-late" };

/** Every active listing with where it is now and a Remove that asks first. Same query as the board. */
export function AdminTools({ today }: { today: string }) {
  const tools = useQuery(api.tools.list, { today });
  const removeTool = useMutation(api.admin.removeTool);
  return (
    <Section id="listings" title="Listings" count={tools?.length}>
      {tools === undefined && <Loading label="Loading listings" />}
      {tools?.length === 0 && <EmptyState title="No active listings" />}
      {tools && tools.length > 0 && (
        <ul className={listCard}>
          {tools.map((tool) => {
            // The admin's own pending request is not part of the tool's state here.
            const status = availabilitySentence(today, { ...tool, myPendingRequest: null });
            return (
              <li
                key={tool._id}
                className="grid gap-x-6 gap-y-3 px-2 py-4 sm:px-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.6fr)_auto] md:items-center"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <CategoryGlyph category={tool.category} className="size-10! bg-soft" />
                  <div className="min-w-0">
                    <p className="font-bold break-words">{tool.name}</p>
                    <p className="text-[0.9375rem] text-muted">{CATEGORY_LABELS[tool.category]}</p>
                  </div>
                </div>
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.9375rem]">
                  <Avatar name={tool.ownerFirstName} />
                  <span className="text-muted">
                    Lent by <span className="font-semibold text-ink">{tool.ownerFirstName}</span>
                  </span>
                  {tool.ownerTrustedLender && <TrustedSeal />}
                </p>
                <p className={`text-[0.9375rem] font-semibold ${TONE[status.tone]}`}>{status.text}</p>
                <div>
                  <ConfirmAction
                    label="Remove"
                    prompt={`Remove ${tool.name} for everyone?`}
                    confirmLabel="Yes, remove"
                    onConfirm={() => removeTool({ toolId: tool._id })}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}
