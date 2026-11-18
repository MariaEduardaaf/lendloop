"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { CATEGORY_LABELS } from "@/lib/labels";
import { ConfirmAction } from "../confirm-action";
import { EmptyState } from "../empty-state";
import { Loading } from "../feedback";
import { AvailabilityBadge } from "../status-pill";
import { Section } from "./section";

/** Every active listing with a remove button. Uses the same tools list as the board. */
export function AdminTools() {
  const tools = useQuery(api.tools.list, {});
  const removeTool = useMutation(api.admin.removeTool);
  return (
    <Section title="Listings">
      {tools === undefined && <Loading label="Loading listings" />}
      {tools?.length === 0 && <EmptyState title="No active listings" />}
      {tools && tools.length > 0 && (
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {tools.map((tool) => (
            <li key={tool._id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {tool.name}
                  <AvailabilityBadge availability={tool.availability} />
                </p>
                <p className="text-sm text-stone-600">
                  {CATEGORY_LABELS[tool.category]} · Lent by {tool.ownerFirstName}
                </p>
              </div>
              <ConfirmAction
                label="Remove"
                prompt="Remove this listing for everyone?"
                confirmLabel="Yes, remove"
                onConfirm={() => removeTool({ toolId: tool._id })}
              />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
