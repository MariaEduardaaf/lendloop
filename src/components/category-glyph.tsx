import type { Category } from "@/lib/labels";

// One stroke drawing per category, same 24px grid and weight. Decorative: the category is
// always written next to it.
const PATHS: Record<Category, string> = {
  power_tools: "M3 7h12l2 2h4v3h-4l-2 2H9v6H6v-6H3zM6 10h5",
  hand_tools: "M4 4h11l3 2.5L15 9H4zM9.5 9v11.5h3V9",
  garden: "M12 21v-9M12 12c0-4.5 3-7 8-7 0 5-3 7-8 7zM12 15.5c0-3-2-5.5-6.5-5.5 0 3.5 2.5 5.5 6.5 5.5z",
  kitchen: "M4 10h16v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM2 10h2M20 10h2M9 7c0-1.2 1.2-1.6 1.2-3M14 7c0-1.2 1.2-1.6 1.2-3",
  camping: "M2 20h20M4 20L12 5l8 15M9.5 20L12 15l2.5 5",
  cleaning: "M5 9h14l-1.6 11H6.6zM5 9c0-3.3 3.1-5.5 7-5.5S19 5.7 19 9M8.5 13h7",
  other: "M3.5 8L12 4l8.5 4v8.5L12 20.5l-8.5-4zM3.5 8L12 12l8.5-4M12 12v8.5",
};

/** The category drawing on a small tile, like a pictogram on a sign. */
export function CategoryGlyph({ category, className = "" }: { category: Category; className?: string }) {
  return (
    <span aria-hidden="true" className={`grid size-11 shrink-0 place-items-center rounded-md bg-tile ${className}`}>
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={PATHS[category]} />
      </svg>
    </span>
  );
}
