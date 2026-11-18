import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/labels";

type Props = { value: Category | null; onChange: (value: Category | null) => void };

/** Category chips. Each one is a toggle button, "All" clears the filter. */
export function CategoryFilter({ value, onChange }: Props) {
  const chips: { label: string; category: Category | null }[] = [
    { label: "All", category: null },
    ...CATEGORIES.map((category) => ({ label: CATEGORY_LABELS[category], category })),
  ];
  return (
    <div role="group" aria-label="Filter by category" className="flex flex-wrap gap-2">
      {chips.map(({ label, category }) => {
        const selected = value === category;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(category)}
            className={`min-h-9 rounded-full px-3.5 text-sm font-medium ring-1 ring-inset ${
              selected ? "bg-accent text-white ring-accent" : "bg-white text-stone-800 ring-stone-300 hover:bg-stone-100"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
