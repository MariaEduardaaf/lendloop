import type { ReactNode } from "react";

type Tone = "neutral" | "good" | "warn" | "bad" | "accent";

// Words carry the meaning; the edge colour only supports it.
const TONES: Record<Tone, string> = {
  neutral: "border-edge text-ink",
  good: "border-free text-free",
  warn: "border-dock text-ink",
  bad: "border-late text-late",
  accent: "border-navy text-navy",
};

/** Small text label. Meaning is always in the words, the color only supports it. */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-sm border bg-plate px-1.5 text-xs leading-5 font-semibold ${TONES[tone]}`}>
      {children}
    </span>
  );
}
