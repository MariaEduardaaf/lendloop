"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { CATEGORY_LABELS, CONDITION_LABELS } from "@/lib/labels";
import type { ListingRow } from "@/lib/types";
import { Button } from "../button";
import { ConfirmAction } from "../confirm-action";
import { AvailabilityBadge } from "../status-pill";
import { ToolForm } from "./tool-form";

/** One of my listings: shows details, or the edit form in place. Delete asks inline first. */
export function ListingCard({ listing }: { listing: ListingRow }) {
  const [editing, setEditing] = useState(false);
  const update = useMutation(api.tools.update);
  const remove = useMutation(api.tools.remove);

  if (editing) {
    return (
      <li className="rounded-lg border border-stone-300 bg-white p-4 sm:p-5">
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
    <li className="rounded-lg border border-stone-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-medium text-stone-900">{listing.name}</h3>
          <p className="text-sm text-stone-600">
            {CATEGORY_LABELS[listing.category]} · {CONDITION_LABELS[listing.condition]} condition
          </p>
        </div>
        <AvailabilityBadge availability={listing.availability} />
      </div>
      <p className="mt-3 whitespace-pre-line break-words text-sm text-stone-700">{listing.description}</p>
      <div className="mt-4 flex flex-wrap items-start gap-2">
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit
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
