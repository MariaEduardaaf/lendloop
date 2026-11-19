"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "convex/react";
import { ArrowUpRight, Hourglass, Pencil } from "lucide-react";
import { api } from "@convex/_generated/api";
import { plural } from "@/lib/format";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/lib/labels";
import type { ListingRow } from "@/lib/types";
import { useRevealFocus } from "@/lib/use-reveal-focus";
import { AvailabilityStrip } from "../availability-strip";
import { Button } from "../button";
import { CategoryGlyph } from "../category-glyph";
import { ConfirmAction } from "../confirm-action";
import { ToolForm } from "./tool-form";

const card = "flex flex-col rounded-card bg-surface p-5 shadow-soft sm:p-6";

/** One of my listings: details and the next 14 days, or the edit form in place. Delete asks inline first. */
export function ListingCard({ listing, today }: { listing: ListingRow; today: string }) {
  const [editing, setEditing] = useState(false);
  const update = useMutation(api.tools.update);
  const remove = useMutation(api.tools.remove);
  // The form focuses its first field itself; this returns focus to Edit when it closes.
  const { triggerRef } = useRevealFocus(editing);

  if (editing) {
    return (
      <li className={card}>
        <h3 className="mb-5 text-h3 font-bold tracking-[-0.01em]">Edit {listing.name}</h3>
        <ToolForm
          initial={{
            name: listing.name,
            category: listing.category,
            condition: listing.condition,
            description: listing.description,
          }}
          submitLabel="Save changes"
          onSubmit={(values) => update({ toolId: listing._id, ...values })}
          onDone={() => setEditing(false)}
        />
      </li>
    );
  }
  return (
    <li className={card}>
      <div className="flex items-center gap-3.5">
        <CategoryGlyph category={listing.category} />
        <div className="min-w-0">
          <h3 className="text-h3 font-bold tracking-[-0.01em] break-words">{listing.name}</h3>
          <p className="mt-0.5 text-[0.9375rem] text-muted">
            {CATEGORY_LABELS[listing.category]} · {CONDITION_LABELS[listing.condition]}
            <span className="sr-only"> condition</span>
          </p>
        </div>
      </div>
      <p className="mt-4 line-clamp-2 text-[0.9375rem] break-words whitespace-pre-line text-muted">{listing.description}</p>
      <div className="mt-5">
        <AvailabilityStrip today={today} availability={listing} />
      </div>
      {listing.pendingCount > 0 && (
        <Link
          href="/incoming"
          className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-mustard px-4 py-2 text-[0.9375rem] font-bold text-ink transition-colors duration-150 ease-out hover:bg-[#e2b93d]"
        >
          <Hourglass aria-hidden="true" className="size-4" strokeWidth={2} />
          {plural(listing.pendingCount, "request")} waiting
          <ArrowUpRight aria-hidden="true" className="size-4" strokeWidth={2} />
        </Link>
      )}
      <div className="mt-5 flex flex-wrap items-start gap-2.5 border-t border-line pt-4">
        <Button ref={triggerRef} variant="secondary" onClick={() => setEditing(true)}>
          <Pencil aria-hidden="true" className="size-4" strokeWidth={2} />
          Edit<span className="sr-only"> {listing.name}</span>
        </Button>
        <ConfirmAction
          label="Delete"
          prompt="Are you sure? Pending requests for this tool will be declined."
          confirmLabel="Yes, delete"
          onConfirm={() => remove({ toolId: listing._id })}
        />
      </div>
    </li>
  );
}
