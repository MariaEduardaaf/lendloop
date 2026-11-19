"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { CATEGORY_LABELS } from "@/lib/labels";
import { useToday } from "@/lib/use-today";
import { CategoryGlyph } from "./category-glyph";
import { EmptyState } from "./empty-state";
import { Loading } from "./feedback";

/**
 * Read-only list for visitors: name and category only, straight from tools.listPublic.
 * Calm rows in one card, no hover or pointer: nothing here is clickable before signing in.
 */
export function PublicTools() {
  const tools = useQuery(api.tools.listPublic, { today: useToday() });

  if (tools === undefined) return <Loading label="Loading tools" />;
  if (tools.length === 0) {
    return <EmptyState title="Nothing is available right now" hint="Sign in and be the first to list a tool." />;
  }
  return (
    <ul className="grid gap-x-2 rounded-card bg-surface p-2 shadow-soft sm:grid-cols-2 sm:p-3 lg:grid-cols-3">
      {tools.map((tool, index) => (
        // The public list has no ids on purpose, so the key combines name and position.
        <li key={`${tool.name}-${index}`} className="flex items-center gap-3.5 rounded-[1.25rem] p-3">
          <CategoryGlyph category={tool.category} />
          <div className="min-w-0">
            <p className="font-bold break-words">{tool.name}</p>
            <p className="text-[0.9375rem] text-muted">{CATEGORY_LABELS[tool.category]}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
