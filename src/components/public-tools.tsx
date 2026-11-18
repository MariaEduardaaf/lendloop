"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { CATEGORY_LABELS } from "@/lib/labels";
import { EmptyState } from "./empty-state";
import { Loading } from "./feedback";

/** Read-only list for visitors: name and category only, straight from tools.listPublic. */
export function PublicTools() {
  const tools = useQuery(api.tools.listPublic);

  if (tools === undefined) return <Loading label="Loading tools" />;
  if (tools.length === 0) {
    return <EmptyState title="Nothing is available right now" hint="Sign in and be the first to list a tool." />;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool, index) => (
        // The public list has no ids on purpose, so the key combines name and position.
        <li key={`${tool.name}-${index}`} className="rounded-lg border border-stone-200 bg-white px-4 py-3">
          <p className="font-medium text-stone-900">{tool.name}</p>
          <p className="text-sm text-stone-600">{CATEGORY_LABELS[tool.category]}</p>
        </li>
      ))}
    </ul>
  );
}
