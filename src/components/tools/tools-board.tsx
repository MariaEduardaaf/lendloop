"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { CATEGORY_LABELS, type Category } from "@/lib/labels";
import { linkButtonClass } from "../button";
import { EmptyState } from "../empty-state";
import { Loading } from "../feedback";
import { CategoryFilter } from "./category-filter";
import { ToolCard } from "./tool-card";

/** All active tools, filtered by category on the server through the query argument. */
export function ToolsBoard() {
  const [category, setCategory] = useState<Category | null>(null);
  const tools = useQuery(api.tools.list, category ? { category } : {});

  return (
    <div className="space-y-6">
      <CategoryFilter value={category} onChange={setCategory} />
      {tools === undefined && <Loading label="Loading tools" />}
      {tools?.length === 0 && (
        <EmptyState
          title={category ? `No ${CATEGORY_LABELS[category].toLowerCase()} listed yet` : "No tools listed yet"}
          hint="Be the first to share something your neighbors could use."
          action={
            <Link href="/listings" className={linkButtonClass}>
              List a tool
            </Link>
          }
        />
      )}
      {tools && tools.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-2">
          {tools.map((tool) => (
            <ToolCard key={tool._id} tool={tool} />
          ))}
        </ul>
      )}
    </div>
  );
}
