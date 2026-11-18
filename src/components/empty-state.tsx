import type { ReactNode } from "react";

/** Says what is missing and offers the next step (a link or button passed as `action`). */
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-edge bg-plate px-6 py-10 text-center">
      <p className="text-h3 font-bold">{title}</p>
      {hint && <p className="mx-auto mt-1 max-w-prose text-muted">{hint}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
