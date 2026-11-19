"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { CircleCheck } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { bookedText, type ToolAvailability } from "@/lib/availability";
import { loanDateBounds } from "@/lib/format";
import { useAction } from "@/lib/use-action";
import { useRevealFocus } from "@/lib/use-reveal-focus";
import { Button } from "../button";
import { ErrorText } from "../feedback";
import { Field, inputClass } from "../field";

type Props = { toolId: Id<"tools">; toolName: string; today: string; availability: ToolAvailability };

/**
 * Borrow request for one tool. The date inputs use the same limits the backend
 * enforces (not in the past, 90 days ahead, 30 days long); the backend still checks them.
 * Booked dates are listed above the fields so the borrower can pick dates that fit.
 */
export function RequestForm({ toolId, toolName, today, availability }: Props) {
  const request = useMutation(api.loans.request);
  const { pending, error, run } = useAction();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const bounds = loanDateBounds(today, startDate);
  const { revealedRef, triggerRef } = useRevealFocus<HTMLInputElement>(open);
  const booked = bookedText(today, availability);

  function changeStart(value: string) {
    setStartDate(value);
    // Drop an end date that no longer fits the new start.
    if (endDate && (endDate < value || endDate > loanDateBounds(today, value).endMax)) setEndDate("");
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
      <p role="status" className="flex basis-full items-start gap-2 rounded-2xl bg-moss-tint px-4 py-3 text-[0.9375rem] font-medium text-ink">
        <CircleCheck aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-moss" strokeWidth={2} />
        <span>
          Request sent. Follow it in{" "}
          <Link href="/requests" className="font-bold underline">
            My requests
          </Link>
          .
        </span>
      </p>
    );
  }
  if (!open) {
    return (
      <Button ref={triggerRef} variant="secondary" className="ml-auto" onClick={() => setOpen(true)}>
        Request<span className="sr-only"> {toolName}</span>
      </Button>
    );
  }

  // A line, not a soft fill, around the form: the soft-filled Cancel (as in every form) has to show on it.
  return (
    <form onSubmit={submit} aria-label={`Request ${toolName}`} className="mt-1 basis-full space-y-4 rounded-[1.375rem] p-4 shadow-[inset_0_0_0_1px_var(--color-line)]">
      {booked && <p className="text-[0.9375rem] font-semibold">{booked}</p>}
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
      <div className="flex flex-wrap gap-2">
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
