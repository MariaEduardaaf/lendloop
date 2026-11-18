"use client";

import type { ReactNode } from "react";
import { addDays, formatLoanDates } from "@/lib/format";
import { useToday } from "@/lib/use-today";
import { AvailabilityStrip } from "./availability-strip";
import { CategoryGlyph } from "./category-glyph";

// Illustrative pieces of the real interface for the public page. Nothing here is live data:
// the plate is captioned as an example and the step fragments are hidden from screen readers.

/** One tool plate as signed-in neighbors see it, with its 14-day strip, dated from today. */
export function ExamplePlate() {
  const today = useToday();
  const availability = {
    outUntil: addDays(today, 2),
    late: false,
    bookings: [
      { startDate: addDays(today, -3), endDate: addDays(today, 2) },
      { startDate: addDays(today, 7), endDate: addDays(today, 9) },
    ],
  };
  return (
    <figure>
      <div className="rounded-md border border-steel bg-plate p-5 shadow-[0_1px_2px_rgba(29,43,58,0.08),0_12px_32px_-12px_rgba(29,43,58,0.18)]">
        <div className="flex items-start gap-3">
          <CategoryGlyph category="hand_tools" />
          <div className="min-w-0">
            <p className="text-h3 font-bold">Extension ladder</p>
            <p className="text-sm text-muted">
              Hand tools
              <span aria-hidden="true" className="mx-2 inline-block size-1 rounded-full bg-current align-middle" />
              Good condition
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">Aluminium, reaches about 5 m. Fits in a car with the seats down.</p>
        <div className="mt-4">
          <AvailabilityStrip today={today} availability={availability} />
        </div>
      </div>
      <figcaption className="mt-3 text-sm text-muted">
        Example. Every tool shows its next 14 days: filled is booked, hollow is free.
      </figcaption>
    </figure>
  );
}

const MARK = "absolute -top-[7px] left-0 size-3 rounded-[2px] border-[1.5px]";

const STEPS: { title: string; text: string; mark: string; fragment: (today: string) => ReactNode }[] = [
  {
    title: "List a tool",
    text: "Add something you can spare, with its category and condition. It goes on the board for your neighbors.",
    mark: "border-navy bg-ground",
    fragment: () => (
      <div className="flex flex-wrap gap-2">
        {["Power tools", "Garden", "Camping"].map((label, i) => (
          <span
            key={label}
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${i === 0 ? "border-navy bg-navy text-white" : "border-edge bg-plate"}`}
          >
            {label}
          </span>
        ))}
      </div>
    ),
  },
  {
    title: "Ask for dates",
    text: "Pick the days you need. The lender sees who is asking and approves or declines.",
    mark: "border-dashed border-dock bg-ground",
    fragment: (today) => (
      <div className="text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <span className="size-3 rounded-[2px] border-[1.5px] border-dashed border-dock" />
          Waiting for the lender
        </p>
        <p className="mt-0.5 font-bold tabular-nums">{formatLoanDates(addDays(today, 3), addDays(today, 5))}</p>
      </div>
    ),
  },
  {
    title: "Get it back",
    text: "The right neighbor is e-mailed whenever a request changes, and a borrower who runs late gets a reminder, so nobody has to chase anyone.",
    mark: "border-free bg-free",
    fragment: () => (
      <div className="space-y-0.5 border-t border-steel pt-2 text-sm text-muted">
        <p>You were e-mailed just now</p>
        <p>Reminder e-mailed to you 1 day ago</p>
      </div>
    ),
  },
];

/** The three steps on one route line, each with a fragment of the screen that does it. */
export function HowItWorks() {
  const today = useToday();
  return (
    <ol className="grid gap-12 md:grid-cols-3 md:gap-8">
      {STEPS.map(({ title, text, mark, fragment }) => (
        <li key={title} className="relative border-t-2 border-navy pt-6">
          <span aria-hidden="true" className={`${MARK} ${mark}`} />
          <h3 className="text-h3 font-bold">{title}</h3>
          <p className="mt-1 max-w-[42ch] text-muted">{text}</p>
          <div aria-hidden="true" className="mt-5">
            {fragment(today)}
          </div>
        </li>
      ))}
    </ol>
  );
}
