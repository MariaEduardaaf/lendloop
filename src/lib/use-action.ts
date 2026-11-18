"use client";

import { useState } from "react";
import { errorMessage } from "./errors";

/**
 * Runs a mutation call and tracks it: `pending` disables the button while it runs,
 * `error` holds the backend message to show next to the action. `run` resolves to
 * true on success so callers can close a form or reset state.
 */
export function useAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>): Promise<boolean> {
    setPending(true);
    setError(null);
    try {
      await action();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    } finally {
      setPending(false);
    }
  }

  return { pending, error, run };
}
