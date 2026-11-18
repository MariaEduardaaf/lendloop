import { availabilitySentence, stripCells, type ToolAvailability } from "@/lib/availability";
import { addDays, formatShort } from "@/lib/format";

const CELL = {
  free: "border-[1.5px] border-edge",
  booked: "border-[1.5px] border-dock bg-dock",
  mine: "border-[1.5px] border-dashed border-dock",
};

const TONE = { free: "text-free", out: "text-ink", late: "text-late" };

/**
 * The next 14 days of a tool: filled amber is booked or out, hollow is free, dashed is the
 * viewer's own pending request. The sentence under it is the accessible text; the cells are hidden.
 */
export function AvailabilityStrip({ today, availability }: { today: string; availability: ToolAvailability }) {
  const cells = stripCells(today, availability);
  const { text, tone } = availabilitySentence(today, availability);
  return (
    <div>
      <div aria-hidden="true" className="max-w-[20.75rem]">
        <span
          className={`ml-[5px] block size-0 border-x-[5px] border-t-[6px] border-x-transparent ${
            tone === "late" ? "border-t-late" : "border-t-navy"
          }`}
        />
        <div className="mt-0.5 grid grid-cols-14 gap-1">
          {cells.map((cell) => (
            <span key={cell.date} className={`aspect-square rounded-[2px] ${CELL[cell.state]}`} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted">
          <span>Today</span>
          <span>{formatShort(addDays(today, cells.length - 1))}</span>
        </div>
      </div>
      <p className={`mt-1.5 text-sm font-semibold ${TONE[tone]}`}>{text}</p>
    </div>
  );
}
