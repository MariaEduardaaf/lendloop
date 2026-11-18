import type { ReactNode } from "react";

/** Class shared by inputs, selects and textareas. The edge is 3.8:1 on white (WCAG non-text contrast). */
export const inputClass =
  "block w-full min-h-10 rounded-md border border-edge bg-plate px-3 py-2 text-body text-ink placeholder:text-muted disabled:opacity-50";

/** A label wrapped around its control, so every input is labelled without ids. */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block label-caps text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}
