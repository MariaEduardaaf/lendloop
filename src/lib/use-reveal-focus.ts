"use client";

import { useEffect, useRef } from "react";

/**
 * Keeps keyboard focus with the user when a button swaps into a form or a confirmation.
 * Focus moves to the revealed element when it opens, and back to the trigger when it
 * closes. Without it the clicked button unmounts and focus falls back to the page.
 */
export function useRevealFocus<Revealed extends HTMLElement>(open: boolean) {
  const revealedRef = useRef<Revealed>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open) revealedRef.current?.focus();
    else if (wasOpen.current) triggerRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  return { revealedRef, triggerRef };
}
