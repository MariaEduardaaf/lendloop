import type { ReactNode } from "react";

type Tone = "neutral" | "good" | "warn" | "accent";

// Words carry the meaning; the fill only supports it.
const TONES: Record<Tone, string> = {
  neutral: "bg-soft text-ink",
  good: "bg-moss-tint text-moss",
  warn: "bg-mustard-tint text-ink",
  accent: "bg-ink text-white",
};

/** Small pill label. Meaning is always in the words, the colour only supports it. */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[0.8125rem] font-bold whitespace-nowrap ${TONES[tone]}`}>
      {children}
    </span>
  );
}
