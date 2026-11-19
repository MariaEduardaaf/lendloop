import { ChefHat, Drill, Package, SprayCan, Sprout, Tent, Wrench, type LucideIcon } from "lucide-react";
import type { Category } from "@/lib/labels";

// One icon per category. Decorative: the category is always written next to it.
const ICONS: Record<Category, LucideIcon> = {
  power_tools: Drill,
  hand_tools: Wrench,
  garden: Sprout,
  kitchen: ChefHat,
  camping: Tent,
  cleaning: SprayCan,
  other: Package,
};

/** The category icon on a soft rounded tile. */
export function CategoryGlyph({ category, className = "bg-soft" }: { category: Category; className?: string }) {
  const Icon = ICONS[category];
  return (
    <span aria-hidden="true" className={`grid size-12 shrink-0 place-items-center rounded-tile text-ink ${className}`}>
      <Icon className="size-[22px]" strokeWidth={1.75} />
    </span>
  );
}
