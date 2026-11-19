import type { ReactNode } from "react";

/** Class shared by inputs, selects and textareas. The edge is 3.9:1 on the card, 3.5:1 on the ground. */
export const inputClass =
  "block w-full min-h-12 rounded-2xl border border-field bg-surface px-4 py-2.5 text-body text-ink placeholder:text-muted transition-colors duration-150 ease-out hover:border-ink disabled:opacity-50";

/** A label wrapped around its control, so every input is labelled without ids. */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block field-label text-ink">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-sm text-muted">{hint}</span>}
    </label>
  );
}
