import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/labels";

type Props = { value: Category | null; onChange: (value: Category | null) => void };

/** Category chips. Each one is a toggle button, "All" clears the filter. One scrollable row on phones. */
export function CategoryFilter({ value, onChange }: Props) {
  const chips: { label: string; category: Category | null }[] = [
    { label: "All", category: null },
    ...CATEGORIES.map((category) => ({ label: CATEGORY_LABELS[category], category })),
  ];
  return (
    <div
      role="group"
      aria-label="Filter by category"
      className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {chips.map(({ label, category }) => {
        const selected = value === category;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(category)}
            className={`min-h-9 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${
              selected ? "border-navy bg-navy text-white" : "border-edge bg-plate text-ink hover:bg-tile"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
