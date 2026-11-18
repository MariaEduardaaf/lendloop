/** Inline error shown next to the action that failed. Announced to screen readers. */
export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm font-semibold text-late">
      {message}
    </p>
  );
}

/** Placeholder while a Convex query is still undefined. */
export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <p role="status" className="py-8 text-sm text-muted">
      {label}...
    </p>
  );
}
