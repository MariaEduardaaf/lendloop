"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";
import { Search, ShieldCheck } from "lucide-react";
import { api } from "@convex/_generated/api";
import { STRIP_DAYS } from "@/lib/availability";
import { formatDay, plural } from "@/lib/format";
import { CATEGORY_LABELS, type Category } from "@/lib/labels";
import { useToday } from "@/lib/use-today";
import { DAY } from "../availability-strip";
import { Button, linkButtonClass } from "../button";
import { EmptyState } from "../empty-state";
import { Loading } from "../feedback";
import { PageHeader } from "../page-header";
import { TRUSTED_LENDER_MEANING } from "../trusted-seal";
import { BoardRail, railLoans } from "./board-rail";
import { CategoryFilter } from "./category-filter";
import { ToolCard } from "./tool-card";

const KEY = [
  { state: "free", label: "Free", extra: "shadow-[inset_0_0_0_1.5px_var(--color-free-edge)]" },
  { state: "booked", label: "Booked", extra: "" },
  { state: "mine", label: "Your request", extra: "" },
  { state: "late", label: "Late", extra: "" },
] as const;

/**
 * The board: every active tool with its next 14 days, filtered by category on the server and
 * by the search box in the browser. The column beside it holds the viewer's own loans.
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
    <div
      className={`grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-6 xl:gap-x-10 ${
        hasRail ? "lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_24.5rem]" : ""
      }`}
    >
      <div className="lg:col-start-1">
        <PageHeader
          title="Tools"
          description="Pick one and ask for the dates you need."
          action={
            <label className="relative block w-full sm:w-[300px]">
              <span className="sr-only">Search tools</span>
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-[18px] size-5 -translate-y-1/2 text-muted" strokeWidth={1.75} />
              <input
                type="search"
                placeholder="Search tools"
                className="block h-12 w-full rounded-full border border-field bg-surface pr-5 pl-12 text-[0.9375rem] text-ink shadow-soft transition-colors duration-150 ease-out placeholder:text-muted hover:border-ink"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
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
        {shown && shown.length > 0 && (
          <div className="mx-1 mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-[0.9375rem] text-muted">
            <p>
              <b className="font-bold text-ink">{plural(shown.length, "tool")}</b> · next {STRIP_DAYS} days, from today{" "}
              {formatDay(today)}
            </p>
            {/* Hidden from screen readers: each card's sentence says the same in words. */}
            <p aria-hidden="true" className="flex flex-wrap gap-x-[18px] gap-y-2 text-sm">
              {KEY.map(({ state, label, extra }) => (
                <span key={state} className="inline-flex items-center gap-[7px]">
                  <span className={`h-[18px] w-3.5 rounded-md ${DAY[state]} ${extra}`} />
                  {label}
                </span>
              ))}
            </p>
          </div>
        )}
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
          <>
            <ul className={`grid items-start gap-5 md:grid-cols-2 ${hasRail ? "lg:grid-cols-1 xl:grid-cols-2" : "xl:grid-cols-3"}`}>
              {shown.map((tool) => (
                <ToolCard key={tool._id} tool={tool} today={today} />
              ))}
            </ul>
            <p className="mx-1 mt-6 flex items-start gap-2 text-sm text-muted">
              <ShieldCheck aria-hidden="true" className="mt-px size-4 shrink-0 text-moss" strokeWidth={2} />
              {TRUSTED_LENDER_MEANING}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
