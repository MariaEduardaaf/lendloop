import type { ReactNode } from "react";

/** One admin section under its h2, reachable from the section links at the top. */
export function Section({
  id,
  title,
  count,
  description,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-6">
      <h2 id={`${id}-heading`} className="flex items-baseline gap-2 text-h2 font-bold">
        {title}
        {count !== undefined && <span className="text-base font-semibold text-muted">{count}</span>}
      </h2>
      {description && <p className="mt-1 max-w-prose text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** The plate that holds an admin list: white, steel edge, rows split by steel rules. */
export const listPlate = "divide-y divide-steel rounded-md border border-steel bg-plate";
