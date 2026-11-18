import type { ReactNode } from "react";

/** Class shared by inputs, selects and textareas. */
export const inputClass =
  "block w-full min-h-10 rounded-md border border-stone-400 bg-white px-3 py-2 text-sm text-stone-900 disabled:opacity-50";

/** A label wrapped around its control, so every input is labelled without ids. */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-800">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-600">{hint}</span>}
    </label>
  );
}
