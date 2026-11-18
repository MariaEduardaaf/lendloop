"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { CATEGORY_LABELS, type Category } from "@/lib/labels";
import { useToday } from "@/lib/use-today";
import { Button, linkButtonClass } from "../button";
import { EmptyState } from "../empty-state";
import { Loading } from "../feedback";
import { inputClass } from "../field";
import { PageHeader } from "../page-header";
import { BoardRail, railLoans } from "./board-rail";
import { CategoryFilter } from "./category-filter";
import { ToolCard } from "./tool-card";

/**
 * The board: every active tool with its next 14 days, filtered by category on the server and
 * by the search box in the browser. The rail beside it holds the viewer's own loans.
 */
export function ToolsBoard() {
  const [category, setCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState("");
  const today = useToday();
  const tools = useQuery(api.tools.list, category ? { today, category } : { today });
  const incoming = useQuery(api.loans.incoming, { today });

  const term = search.trim().toLowerCase();
  const shown = tools?.filter((t) => !term || `${t.name} ${t.description}`.toLowerCase().includes(term));
  const rail = incoming && railLoans(incoming, today);
  const hasRail = rail && (rail.waiting.length > 0 || rail.out.length > 0);

  return (
    <div className={`grid grid-cols-[minmax(0,1fr)] gap-x-12 gap-y-6 ${hasRail ? "lg:grid-cols-[minmax(0,1fr)_19rem]" : ""}`}>
      <div className="lg:col-start-1">
        <PageHeader
          title="Tools"
          description="Pick one and ask for the dates you need."
          action={
            <input
              type="search"
              aria-label="Search tools"
              placeholder="Search tools"
              className={`${inputClass} sm:w-60`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          }
        />
        <CategoryFilter value={category} onChange={setCategory} />
      </div>
      {hasRail && (
        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <BoardRail {...rail} />
        </div>
      )}
      <section aria-labelledby="board-heading" className="lg:col-start-1">
        <h2 id="board-heading" className="sr-only">
          Tools to borrow
        </h2>
        {shown === undefined && <Loading label="Loading tools" />}
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
        {tools && tools.length > 0 && shown?.length === 0 && (
          <EmptyState
            title={`Nothing matches "${search.trim()}"`}
            hint="Try another word, or clear the search to see every tool."
            action={
              <Button variant="secondary" onClick={() => setSearch("")}>
                Clear search
              </Button>
            }
          />
        )}
        {shown && shown.length > 0 && (
          <ul className={`grid items-start gap-4 md:grid-cols-2 ${hasRail ? "" : "xl:grid-cols-3"}`}>
            {shown.map((tool) => (
              <ToolCard key={tool._id} tool={tool} today={today} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
