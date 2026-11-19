import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/labels";

/** Toggle pill look, shared with the admin loan filters. Selected is the ink pill. */
export const chipClass = (selected: boolean) =>
  `h-10 shrink-0 rounded-full px-[18px] text-[0.9375rem] font-semibold whitespace-nowrap transition-colors duration-150 ease-out ${
    selected ? "bg-ink text-white" : "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-soft"
  }`;

type Props = { value: Category | null; onChange: (value: Category | null) => void };

/** Category pills. Each one is a toggle button, "All" clears the filter. One scrollable row on phones. */
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
            className={chipClass(selected)}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
