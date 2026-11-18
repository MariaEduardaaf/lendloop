"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRevealFocus } from "@/lib/use-reveal-focus";
import { useToday } from "@/lib/use-today";
import { Button } from "../button";
import { EmptyState } from "../empty-state";
import { Loading } from "../feedback";
import { PageHeader } from "../page-header";
import { ListingCard } from "./listing-card";
import { ToolForm } from "./tool-form";

/** My listings with the create form. The form opens from the header button or the empty state. */
export function MyListings() {
  const today = useToday();
  const listings = useQuery(api.tools.myListings, { today });
  const create = useMutation(api.tools.create);
  const [creating, setCreating] = useState(false);
  // The form focuses its name field itself; this returns focus to "Add a tool" when it closes.
  const { triggerRef } = useRevealFocus(creating);

  const addButton = (
    <Button ref={triggerRef} onClick={() => setCreating(true)}>
      Add a tool
    </Button>
  );

  return (
    <>
      <PageHeader
        title="My listings"
        description="Tools you are willing to lend. You can edit or remove them at any time."
        action={!creating && listings && listings.length > 0 ? addButton : undefined}
      />
      <div className="space-y-4">
        {creating && (
          <section aria-labelledby="new-listing" className="max-w-2xl rounded-md border border-steel bg-plate p-4 sm:p-5">
            <h2 id="new-listing" className="mb-4 text-h2 font-bold">
              New listing
            </h2>
            <ToolForm submitLabel="Add tool" onSubmit={(values) => create(values)} onDone={() => setCreating(false)} />
          </section>
        )}
        {listings === undefined && <Loading label="Loading your listings" />}
        {listings?.length === 0 && !creating && (
          <EmptyState
            title="You have not listed any tools yet"
            hint="Add a drill, a ladder or a camping stove, anything you could lend for a few days."
            action={addButton}
          />
        )}
        {listings && listings.length > 0 && (
          <section aria-labelledby="listings-heading">
            <h2 id="listings-heading" className="sr-only">
              Your tools
            </h2>
            <ul className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} today={today} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
