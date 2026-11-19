import type { ReactNode } from "react";

/** Says what is missing and offers the next step (a link or button passed as `action`). */
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-card bg-surface px-6 py-14 text-center shadow-soft">
      <p className="text-h3 font-bold">{title}</p>
      {hint && <p className="mx-auto mt-2 max-w-prose text-muted">{hint}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
