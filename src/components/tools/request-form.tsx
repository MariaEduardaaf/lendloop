"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { todayUtc } from "@convex/lib/dates";
import { loanDateBounds } from "@/lib/format";
import { useAction } from "@/lib/use-action";
import { useRevealFocus } from "@/lib/use-reveal-focus";
import { Button } from "../button";
import { ErrorText } from "../feedback";
import { Field, inputClass } from "../field";

/**
 * Borrow request for one tool. The date inputs use the same limits the backend
 * enforces (not in the past, 90 days ahead, 30 days long); the backend still checks them.
 */
export function RequestForm({ toolId }: { toolId: Id<"tools"> }) {
  const request = useMutation(api.loans.request);
  const { pending, error, run } = useAction();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const bounds = loanDateBounds(todayUtc(), startDate);
  const { revealedRef, triggerRef } = useRevealFocus<HTMLInputElement>(open);

  function changeStart(value: string) {
    setStartDate(value);
    // Drop an end date that no longer fits the new start.
    if (endDate && (endDate < value || endDate > loanDateBounds(todayUtc(), value).endMax)) setEndDate("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (await run(() => request({ toolId, startDate, endDate }))) {
      setSent(true);
      setOpen(false);
    }
  }

  if (sent) {
    return (
      <p role="status" className="text-sm text-stone-700">
        Request sent. Follow it in{" "}
        <Link href="/requests" className="font-medium text-accent underline">
          My requests
        </Link>
        .
      </p>
    );
  }
  if (!open) {
    return (
      <Button ref={triggerRef} onClick={() => setOpen(true)}>
        Request to borrow
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="From">
          <input
            ref={revealedRef}
            type="date"
            required
            className={inputClass}
            value={startDate}
            min={bounds.startMin}
            max={bounds.startMax}
            onChange={(e) => changeStart(e.target.value)}
          />
        </Field>
        <Field label="Until" hint="Up to 30 days">
          <input
            type="date"
            required
            className={inputClass}
            value={endDate}
            min={bounds.endMin}
            max={bounds.endMax}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Field>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Sending..." : "Send request"}
        </Button>
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
      <ErrorText message={error} />
    </form>
  );
}
