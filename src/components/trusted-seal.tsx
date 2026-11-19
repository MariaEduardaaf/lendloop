import { ShieldCheck } from "lucide-react";

export const TRUSTED_LENDER_MEANING = "The neighborhood admin marks neighbors who lend and return reliably as Trusted Lenders.";

/**
 * Trusted Lender mark: a small shield and the word. The admin gives it to reliable neighbors.
 * Screen readers hear what it means right after the name; sighted readers find the same
 * sentence under the board, on the landing page and in the admin users list.
 * Moss by default; pass `text-mustard-ink` on the mustard card, where moss is too faint.
 */
export function TrustedSeal({ className = "text-moss" }: { className?: string }) {
  return (
    <span
      title="Marked as reliable by the neighborhood admin"
      className={`inline-flex items-center gap-1 text-caption font-semibold whitespace-nowrap ${className}`}
    >
      <ShieldCheck aria-hidden="true" className="size-3.5" strokeWidth={2} />
      Trusted
      <span className="sr-only"> Lender, marked as reliable by the neighborhood admin</span>
    </span>
  );
}
