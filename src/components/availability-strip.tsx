import { CircleAlert, CircleCheck, Clock } from "lucide-react";
import { availabilitySentence, stripCells, type ToolAvailability } from "@/lib/availability";

type DayState = "free" | "booked" | "mine" | "late";

/** Day pill fills, shared with the board legend. */
export const DAY: Record<DayState, string> = {
  free: "bg-soft text-ink",
  booked: "bg-booked text-white",
  mine: "bg-mustard-tint text-ink shadow-[inset_0_0_0_1.5px_var(--color-mustard-edge)]",
  late: "bg-tomato text-white",
};

const TONE = {
  free: { className: "text-moss", Icon: CircleCheck },
  out: { className: "text-ink", Icon: Clock },
  late: { className: "text-late", Icon: CircleAlert },
};

const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "narrow", timeZone: "UTC" });
const dayOf = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

/**
 * The next 14 days of a tool as rounded day pills: free, booked, the viewer's own request, and
 * late today. Two rows of seven when the card is narrow, so the dates never shrink. The pills are
 * hidden from assistive tech; the sentence under them is the accessible text.
 */
export function AvailabilityStrip({ today, availability }: { today: string; availability: ToolAvailability }) {
  const cells = stripCells(today, availability);
  const { text, tone } = availabilitySentence(today, availability);
  const { className, Icon } = TONE[tone];
  // "Free now. Booked 25 to 27 Nov": the state leads in colour, the rest is quieter. Same words.
  const [head, ...rest] = text.split(". ");
  return (
    <div className="@container">
      <ol aria-hidden="true" className="grid grid-cols-7 gap-x-1 gap-y-3 @min-[20rem]:grid-cols-14">
        {cells.map((cell, i) => {
          const isToday = i === 0;
          const state: DayState = isToday && availability.late ? "late" : cell.state;
          const date = dayOf(cell.date);
          return (
            <li key={cell.date} className="flex flex-col items-center gap-1.5">
              <span className={`text-xs leading-none font-semibold ${isToday ? "text-ink" : "text-muted"}`}>
                {WEEKDAY.format(date)}
              </span>
              <span
                className={`grid h-[34px] w-full place-items-center rounded-day text-[0.8125rem] font-bold tabular-nums ${DAY[state]} ${
                  isToday ? "outline-2 outline-offset-2 outline-ink" : ""
                }`}
              >
                {date.getUTCDate()}
              </span>
            </li>
          );
        })}
      </ol>
      <p className={`mt-5 flex items-start gap-2 text-[0.9375rem] font-semibold ${className}`}>
        <Icon aria-hidden="true" className="mt-0.5 size-[18px] shrink-0" strokeWidth={1.75} />
        <span>
          {head}
          {rest.length > 0 && (
            <>
              .{" "}
              <span className="font-medium text-muted">{rest.join(". ")}</span>
            </>
          )}
        </span>
      </p>
    </div>
  );
}
