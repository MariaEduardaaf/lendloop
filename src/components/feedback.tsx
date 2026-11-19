import { CircleAlert } from "lucide-react";

/** Inline error shown next to the action that failed. Announced to screen readers. */
export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="flex items-start gap-1.5 text-[0.9375rem] font-semibold text-late">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
      {message}
    </p>
  );
}

/** Placeholder while a Convex query is still undefined. */
export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <p role="status" className="py-8 text-muted">
      {label}...
    </p>
  );
}
