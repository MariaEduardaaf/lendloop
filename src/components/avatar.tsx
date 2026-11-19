const TINTS = ["bg-tint-1", "bg-tint-2", "bg-tint-3", "bg-tint-4", "bg-tint-5", "bg-tint-6"];

/** Same name, same tint, on every page and every visit. */
export function tintFor(name: string): string {
  let hash = 0;
  for (const ch of name.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return TINTS[hash % TINTS.length];
}

/** First letter in a tinted circle, next to a first name. Decorative: the name is always written beside it. */
export function Avatar({ name, className = "size-8 text-sm" }: { name: string; className?: string }) {
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full font-bold text-ink ${tintFor(name)} ${className}`}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
