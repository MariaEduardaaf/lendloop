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
      <h2 id={`${id}-heading`} className="mx-1 flex items-center gap-3 text-h2 font-bold tracking-[-0.02em]">
        {title}{" "}
        {count !== undefined && (
          <span className="grid h-7 min-w-7 place-items-center rounded-full bg-surface px-2.5 text-[0.9375rem] font-bold text-muted tabular-nums shadow-soft">
            {count}
          </span>
        )}
      </h2>
      {description && <p className="mx-1 mt-1.5 max-w-prose text-[0.9375rem] text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** The rounded card that holds an admin list, rows split by quiet rules. Rows bring their own px-4 py-4. */
export const listCard = "divide-y divide-line rounded-card bg-surface px-2 py-1 shadow-soft sm:px-3";
