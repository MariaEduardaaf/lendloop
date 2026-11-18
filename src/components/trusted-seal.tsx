export const TRUSTED_LENDER_MEANING = "The neighborhood admin marks neighbors who lend and return reliably as Trusted Lenders.";

/**
 * Trusted Lender mark, set like a small plaque. The admin gives it to reliable neighbors.
 * Screen readers hear what it means right after the name; sighted readers find the same
 * sentence on the board header, the landing page and the admin users list.
 */
export function TrustedSeal() {
  return (
    <span
      title="Marked as reliable by the neighborhood admin"
      className="inline-flex items-center gap-1 rounded-sm border-[1.5px] border-navy px-1.5 text-[11px] leading-[18px] font-bold tracking-[0.08em] text-navy uppercase"
    >
      <svg aria-hidden="true" viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M2.5 6.2l2.3 2.3 4.7-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Trusted Lender
      <span className="sr-only">, marked as reliable by the neighborhood admin</span>
    </span>
  );
}

/** Initial in a navy dot, next to a first name. */
export function Initial({ name }: { name: string }) {
  return (
    <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-navy text-xs font-bold text-white">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
