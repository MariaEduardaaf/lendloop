"use client";

import { Button } from "@/components/button";

/**
 * Error boundary for the signed-in pages. A Convex query that throws (an expired
 * session, for example) lands here instead of on the framework's default error screen.
 */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="py-8">
      <h1 className="text-h1 font-bold text-ink">This page could not be loaded</h1>
      <p className="mt-1 text-muted">Try again. If it keeps happening, sign out and back in.</p>
      <div className="mt-4">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
