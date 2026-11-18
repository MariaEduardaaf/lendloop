import type { ReactNode } from "react";

type Tone = "neutral" | "good" | "warn" | "bad" | "accent";

const TONES: Record<Tone, string> = {
  neutral: "bg-stone-100 text-stone-800 ring-stone-300",
  good: "bg-green-50 text-green-900 ring-green-300",
  warn: "bg-amber-50 text-amber-900 ring-amber-300",
  bad: "bg-red-50 text-red-900 ring-red-300",
  accent: "bg-teal-50 text-teal-900 ring-teal-300",
};

/** Small text label. Meaning is always in the words, the color only supports it. */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${TONES[tone]}`}>
      {children}
    </span>
  );
}
