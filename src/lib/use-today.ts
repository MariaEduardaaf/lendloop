"use client";

import { useState } from "react";
import { todayUtc } from "@convex/lib/dates";

/**
 * Today's UTC date for query arguments (the backend explains why in convex/lib/dates.ts).
 * Read once per mount, so the argument stays the same between renders. A tab left open
 * past midnight UTC keeps the old date until the page is opened again.
 */
export function useToday(): string {
  const [today] = useState(() => todayUtc());
  return today;
}
