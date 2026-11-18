import type { ReactNode } from "react";

/** Says what is missing and offers the next step (a link or button passed as `action`). */
export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
      <p className="font-medium text-stone-900">{title}</p>
      {hint && <p className="mt-1 text-sm text-stone-600">{hint}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
