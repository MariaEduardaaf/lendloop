"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { availabilitySentence } from "@/lib/availability";
import { CATEGORY_LABELS } from "@/lib/labels";
import { ConfirmAction } from "../confirm-action";
import { EmptyState } from "../empty-state";
import { Loading } from "../feedback";
import { TrustedSeal } from "../trusted-seal";
import { listPlate, Section } from "./section";

const TONE = { free: "text-free", out: "text-ink", late: "font-semibold text-late" };

/** Every active listing with where it is now and a Remove that asks first. Same query as the board. */
export function AdminTools({ today }: { today: string }) {
  const tools = useQuery(api.tools.list, { today });
  const removeTool = useMutation(api.admin.removeTool);
  return (
    <Section id="listings" title="Listings" count={tools?.length}>
      {tools === undefined && <Loading label="Loading listings" />}
      {tools?.length === 0 && <EmptyState title="No active listings" />}
      {tools && tools.length > 0 && (
        <ul className={listPlate}>
          {tools.map((tool) => {
            // The admin's own pending request is not part of the tool's state here.
            const status = availabilitySentence(today, { ...tool, myPendingRequest: null });
            return (
              <li
                key={tool._id}
                className="grid gap-x-6 gap-y-1 px-4 py-3 text-sm md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.6fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <p className="font-bold break-words">{tool.name}</p>
                  <p className="text-muted">{CATEGORY_LABELS[tool.category]}</p>
                </div>
                <p className="flex flex-wrap items-center gap-2">
                  Lent by {tool.ownerFirstName}
                  {tool.ownerTrustedLender && <TrustedSeal />}
                </p>
                <p className={TONE[status.tone]}>{status.text}</p>
                <div className="mt-2 md:mt-0">
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
