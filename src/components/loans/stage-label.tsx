import { Ban, CalendarClock, CalendarX, CircleAlert, CircleCheck, CircleX, Clock, Hourglass, type LucideIcon } from "lucide-react";
import type { Perspective, StageKey } from "@/lib/loan-stage";

type Look = { label: string; Icon: LucideIcon; className: string };

// Mustard: waiting on someone. Moss: coming up (tint) and out now (solid). Tomato: late. Soft: past.
const LOOKS: Record<StageKey, Look> = {
  pending: { label: "Waiting for an answer", Icon: Hourglass, className: "bg-mustard-tint text-ink" },
  expired: { label: "Not answered", Icon: CalendarX, className: "bg-soft text-ink" },
  upcoming: { label: "Coming up", Icon: CalendarClock, className: "bg-moss-tint text-moss" },
  out: { label: "Out now", Icon: Clock, className: "bg-moss text-white" },
  due_today: { label: "Due today", Icon: Clock, className: "bg-moss text-white" },
  late: { label: "Late", Icon: CircleAlert, className: "bg-tomato text-white" },
  returned: { label: "Returned", Icon: CircleCheck, className: "bg-soft text-ink" },
  declined: { label: "Declined", Icon: CircleX, className: "bg-soft text-ink" },
  cancelled: { label: "Cancelled", Icon: Ban, className: "bg-soft text-ink" },
};

/** Colour for the stage sentence under a loan: late in red, returned in moss, the rest muted. */
export const stageTextClass = (key: StageKey) => (key === "late" ? "text-late" : key === "returned" ? "text-moss" : "text-muted");

/** The lender's own pending request: the one stage that needs the viewer's decision. */
export const needsAnswer = (key: StageKey, side: Perspective) => key === "pending" && side === "owner";

/**
 * Short stage chip at the top of a loan card. The stage sentence on the card says the detail;
 * `label` replaces the chip text when that sentence says the same thing with a name ("Waiting for Cara").
 */
export function StageLabel({ stageKey, side, label: named }: { stageKey: StageKey; side: Perspective; label?: string }) {
  const ask = needsAnswer(stageKey, side);
  const { label, Icon, className } = LOOKS[stageKey];
  return (
    <span
      className={`inline-flex h-8 items-center gap-[7px] rounded-full pr-3.5 pl-[11px] text-sm font-bold whitespace-nowrap ${
        ask ? "bg-mustard-chip text-ink" : className
      }`}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
      {ask ? "Needs your answer" : (named ?? label)}
    </span>
  );
}
