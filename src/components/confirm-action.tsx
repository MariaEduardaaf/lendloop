"use client";

import { useState } from "react";
import { useAction } from "@/lib/use-action";
import { Button } from "./button";
import { ErrorText } from "./feedback";

type Props = {
  label: string;
  prompt: string;
  confirmLabel: string;
  onConfirm: () => Promise<unknown>;
};

/**
 * A destructive action with an inline "Are you sure?" step (no browser confirm dialog).
 * First click shows the question, second click runs it. Backend errors appear below.
 */
export function ConfirmAction({ label, prompt, confirmLabel, onConfirm }: Props) {
  const [asking, setAsking] = useState(false);
  const { pending, error, run } = useAction();

  async function confirm() {
    if (await run(onConfirm)) setAsking(false);
  }

  if (!asking) {
    return (
      <div className="space-y-2">
        <Button variant="secondary" onClick={() => setAsking(true)}>
          {label}
        </Button>
        <ErrorText message={error} />
      </div>
    );
  }
  return (
    <div className="space-y-2" role="group" aria-label={prompt}>
      <p className="text-sm font-medium text-stone-900">{prompt}</p>
      <div className="flex gap-2">
        <Button variant="danger" onClick={confirm} disabled={pending}>
          {pending ? "Working..." : confirmLabel}
        </Button>
        <Button variant="secondary" onClick={() => setAsking(false)} disabled={pending}>
          Keep it
        </Button>
      </div>
      <ErrorText message={error} />
    </div>
  );
}
