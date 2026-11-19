"use client";

import { useState } from "react";
import { useAction } from "@/lib/use-action";
import { useRevealFocus } from "@/lib/use-reveal-focus";
import { Button } from "./button";
import { ErrorText } from "./feedback";

type Props = {
  label: string;
  prompt: string;
  confirmLabel: string;
  onConfirm: () => Promise<unknown>;
  /** "outline" on the mustard card, where the soft fill would not show. */
  variant?: "secondary" | "outline";
  size?: "md" | "lg";
};

/**
 * A destructive action with an inline "Are you sure?" step (no browser confirm dialog).
 * First click shows the question, second click runs it. Backend errors appear below.
 */
export function ConfirmAction({ label, prompt, confirmLabel, onConfirm, variant = "secondary", size }: Props) {
  const [asking, setAsking] = useState(false);
  const { pending, error, run } = useAction();
  const { revealedRef, triggerRef } = useRevealFocus<HTMLParagraphElement>(asking);

  async function confirm() {
    if (await run(onConfirm)) setAsking(false);
  }

  if (!asking) {
    return (
      <div className="space-y-2">
        <Button ref={triggerRef} variant={variant} size={size} onClick={() => setAsking(true)}>
          {label}
        </Button>
        <ErrorText message={error} />
      </div>
    );
  }
  return (
    <div className="basis-full space-y-3" role="group" aria-label={prompt}>
      <p ref={revealedRef} tabIndex={-1} className="font-semibold">
        {prompt}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={confirm} disabled={pending}>
          {pending ? "Working..." : confirmLabel}
        </Button>
        <Button variant={variant} onClick={() => setAsking(false)} disabled={pending}>
          Keep it
        </Button>
      </div>
      <ErrorText message={error} />
    </div>
  );
}
