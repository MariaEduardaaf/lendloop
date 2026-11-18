"use client";

import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { Button, linkButtonClass } from "./button";

/** The one call to action of the landing page: sign in, or go to the board when already signed in. */
export function LandingAction() {
  return (
    <Show
      when="signed-in"
      fallback={
        <SignInButton mode="modal">
          <Button className="px-5">Sign in to lend or borrow</Button>
        </SignInButton>
      }
    >
      <Link href="/tools" className={`${linkButtonClass} px-5`}>
        Open the tools board
      </Link>
    </Show>
  );
}
