"use client";

import { useAction } from "@/lib/use-action";
import { Button } from "./button";
import { ErrorText } from "./feedback";

type Props = {
  label: string;
  onClick: () => Promise<unknown>;
  variant?: "primary" | "secondary" | "danger";
};

/** A button that runs one mutation, disables itself meanwhile and shows the backend error under it. */
export function ActionButton({ label, onClick, variant = "secondary" }: Props) {
  const { pending, error, run } = useAction();
  return (
    <div className="space-y-1">
      <Button variant={variant} disabled={pending} onClick={() => run(onClick)}>
        {pending ? "Working..." : label}
      </Button>
      <ErrorText message={error} />
    </div>
  );
}
