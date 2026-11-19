"use client";

import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { Button, buttonClass } from "./button";

/**
 * The call to action of the landing page: sign in, or go to the board when already signed in.
 * The full one is the solid ink pill; `compact` is the light pill for the top bar.
 */
export function LandingAction({ compact = false }: { compact?: boolean }) {
  const variant = compact ? "raised" : "primary";
  const size = compact ? "md" : "lg";
  return (
    <Show
      when="signed-in"
      fallback={
        <SignInButton mode="modal">
          <Button variant={variant} size={size}>
            {compact ? "Sign in" : "Sign in to lend or borrow"}
          </Button>
        </SignInButton>
      }
    >
      <Link href="/tools" className={buttonClass(variant, size)}>
        {compact ? "Open the board" : "Open the tools board"}
      </Link>
    </Show>
  );
}
