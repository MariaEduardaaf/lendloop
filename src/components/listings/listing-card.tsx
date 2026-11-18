"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation } from "convex/react";
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

const plate = "rounded-md border border-steel bg-plate p-4 shadow-[0_1px_2px_rgba(29,43,58,0.08)]";

/** One of my listings: details and the next 14 days, or the edit form in place. Delete asks inline first. */
export function ListingCard({ listing, today }: { listing: ListingRow; today: string }) {
  const [editing, setEditing] = useState(false);
  const update = useMutation(api.tools.update);
  const remove = useMutation(api.tools.remove);
  // The form focuses its first field itself; this returns focus to Edit when it closes.
  const { triggerRef } = useRevealFocus(editing);

  if (editing) {
    return (
      <li className={plate}>
        <h3 className="mb-4 text-h3 font-bold">Edit {listing.name}</h3>
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
    <li className={plate}>
      <div className="flex items-start gap-3">
        <CategoryGlyph category={listing.category} />
        <div className="min-w-0">
          <h3 className="text-h3 font-bold break-words">{listing.name}</h3>
          <p className="text-sm text-muted">
            {CATEGORY_LABELS[listing.category]}
            <span aria-hidden="true" className="mx-2 inline-block size-1 rounded-full bg-current align-middle" />
            {CONDITION_LABELS[listing.condition]} condition
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm break-words whitespace-pre-line text-muted">{listing.description}</p>
      <div className="mt-4">
        <AvailabilityStrip today={today} availability={listing} />
      </div>
      {listing.pendingCount > 0 && (
        <Link href="/incoming" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold underline">
          <span aria-hidden="true" className="size-3 rounded-[2px] border-[1.5px] border-dashed border-dock" />
          {plural(listing.pendingCount, "request")} waiting
        </Link>
      )}
      <div className="mt-4 flex flex-wrap items-start gap-2 border-t border-steel pt-3">
        <Button ref={triggerRef} variant="secondary" onClick={() => setEditing(true)}>
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
