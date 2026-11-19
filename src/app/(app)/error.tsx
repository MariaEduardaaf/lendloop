"use client";

import { CircleAlert } from "lucide-react";
import { Button } from "@/components/button";

/**
 * Error boundary for the signed-in pages. A Convex query that throws (an expired
 * session, for example) lands here instead of on the framework's default error screen.
 */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="max-w-xl rounded-card bg-surface p-6 shadow-soft sm:p-8">
      <span aria-hidden="true" className="grid size-12 place-items-center rounded-tile bg-tomato-tint text-late">
        <CircleAlert className="size-[22px]" strokeWidth={1.75} />
      </span>
      <h1 className="mt-5 text-h1 font-bold tracking-[-0.03em] text-ink">This page could not be loaded</h1>
      <p className="mt-3 text-lg text-muted">Try again. If it keeps happening, sign out and back in.</p>
      <div className="mt-6">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
