"use client";

import type { ReactNode } from "react";
import { useAction } from "@/lib/use-action";
import { Button } from "./button";
import { ErrorText } from "./feedback";

type Props = {
  label: string;
  onClick: () => Promise<unknown>;
  variant?: "primary" | "secondary";
  size?: "md" | "lg";
  icon?: ReactNode;
};

/** A button that runs one mutation, disables itself meanwhile and shows the backend error under it. */
export function ActionButton({ label, onClick, variant = "secondary", size, icon }: Props) {
  const { pending, error, run } = useAction();
  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        size={size}
        className={variant === "primary" && size === "lg" ? "shadow-press" : ""}
        disabled={pending}
        onClick={() => run(onClick)}
      >
        {!pending && icon}
        {pending ? "Working..." : label}
      </Button>
      <ErrorText message={error} />
    </div>
  );
}
