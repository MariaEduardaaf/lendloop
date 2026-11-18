"use client";

import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { Button, inverseLinkButtonClass, linkButtonClass } from "./button";

/**
 * The call to action of the landing page: sign in, or go to the board when already signed in.
 * `onNavy` turns the solid action white on a navy surface; `compact` is the short version for the top bar.
 */
export function LandingAction({ onNavy = false, compact = false }: { onNavy?: boolean; compact?: boolean }) {
  return (
    <Show
      when="signed-in"
      fallback={
        <SignInButton mode="modal">
          <Button variant={onNavy ? "inverse" : "primary"} className="px-5">{compact ? "Sign in" : "Sign in to lend or borrow"}</Button>
        </SignInButton>
      }
    >
      <Link href="/tools" className={`${onNavy ? inverseLinkButtonClass : linkButtonClass} px-5`}>
        {compact ? "Open the board" : "Open the tools board"}
      </Link>
    </Show>
  );
}
