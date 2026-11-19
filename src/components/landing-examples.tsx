"use client";

import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import { addDays, formatLoanSpan } from "@/lib/format";
import { useToday } from "@/lib/use-today";
import { AvailabilityStrip } from "./availability-strip";
import { Avatar } from "./avatar";
import { CategoryGlyph } from "./category-glyph";
import { StageLabel } from "./loans/stage-label";
import { TrustedSeal } from "./trusted-seal";

// Illustrative pieces of the real interface for the public page. Nothing here is live data:
// the card is hidden from screen readers and its caption says what it shows, and the step
// fragments are hidden too (the step text says the same in words).

/** One tool card as signed-in neighbors see it on the board, with its 14 days dated from today. */
export function ExampleToolCard() {
  const today = useToday();
  const availability = {
    outUntil: null,
    late: false,
    bookings: [{ startDate: addDays(today, 4), endDate: addDays(today, 6) }],
  };
  return (
    <figure>
      <div aria-hidden="true" className="rounded-card bg-surface p-5 shadow-soft sm:p-6">
        <div className="flex items-center gap-3.5">
          <CategoryGlyph category="hand_tools" />
          <div className="min-w-0">
            <p className="text-h3 font-bold tracking-[-0.01em]">Extension ladder</p>
            <p className="mt-0.5 text-[0.9375rem] text-muted">Hand tools · Good</p>
          </div>
        </div>
        <div className="mt-5">
          <AvailabilityStrip today={today} availability={availability} />
        </div>
        <div className="mt-5 flex items-center gap-2.5 border-t border-line pt-4">
          <Avatar name="Ben" />
          <span className="text-[0.9375rem] font-semibold">Ben</span>
          <TrustedSeal />
        </div>
      </div>
      <figcaption className="mx-1 mt-3 text-sm text-muted">
        Example of a tool on the board: its next 14 days, filled when booked.
      </figcaption>
    </figure>
  );
}

const STEPS: { title: string; text: string; fragment: (today: string) => ReactNode }[] = [
  {
    title: "List a tool",
    text: "Add something you can spare, with its category and condition. It goes on the board for your neighbors.",
    fragment: () => (
      <div className="flex flex-wrap gap-2">
        {["Power tools", "Garden", "Camping"].map((label, i) => (
          <span
            key={label}
            className={`flex h-9 items-center rounded-full px-4 text-[0.9375rem] font-semibold ${
              i === 0 ? "bg-ink text-white" : "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-line)]"
            }`}
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
    fragment: (today) => (
      <div>
        <StageLabel stageKey="pending" side="borrower" />
        <p className="mt-2.5 text-lg font-bold tracking-[-0.01em] tabular-nums">
          {formatLoanSpan(addDays(today, 3), addDays(today, 5))}
        </p>
      </div>
    ),
  },
  {
    title: "Get it back",
    text: "The right neighbor is e-mailed whenever a request changes, and a borrower who runs late gets a reminder, so nobody has to chase anyone.",
    fragment: () => (
      <div className="space-y-2 text-[0.9375rem] text-muted">
        <p className="flex items-center gap-2">
          <Mail aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={1.75} />
          Ben was e-mailed 2 hours ago
        </p>
        <p className="flex items-center gap-2">
          <Mail aria-hidden="true" className="size-[18px] shrink-0" strokeWidth={1.75} />
          Reminder e-mailed to Ben 1 day ago
        </p>
      </div>
    ),
  },
];

/** The three steps in order (an ordered list; the titles carry the sequence), each with a small fragment of the screen that does it. */
export function HowItWorks() {
  const today = useToday();
  return (
    <ol className="grid gap-5 md:grid-cols-3">
      {STEPS.map(({ title, text, fragment }) => (
        <li key={title} className="flex flex-col rounded-card bg-surface p-5 shadow-soft sm:p-6">
          <h3 className="text-h3 font-bold tracking-[-0.01em]">{title}</h3>
          <p className="mt-1.5 text-muted">{text}</p>
          <div aria-hidden="true" className="mt-auto pt-6">
            <div className="rounded-[1.25rem] bg-ground p-4">{fragment(today)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
