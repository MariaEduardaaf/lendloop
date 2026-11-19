"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { UserButton, useUser } from "@clerk/nextjs";
import { Infinity as LoopMark } from "lucide-react";
import { api } from "@convex/_generated/api";
import { errorMessage } from "@/lib/errors";
import { tintFor } from "./avatar";
import { ErrorText, Loading } from "./feedback";

const NAV = [
  { href: "/tools", label: "Tools" },
  { href: "/listings", label: "My listings" },
  { href: "/requests", label: "My requests" },
  { href: "/incoming", label: "Incoming" },
];

function NavLink({ href, label, count = 0 }: { href: string; label: string; count?: number }) {
  const active = usePathname().startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex h-[42px] shrink-0 items-center gap-2 rounded-full px-4 text-[0.9375rem] font-semibold whitespace-nowrap transition-colors duration-150 ease-out sm:px-5 ${
        active ? "bg-ink text-white" : "text-muted hover:bg-soft hover:text-ink"
      }`}
    >
      {label}
      {href === "/incoming" && <span className="sr-only"> requests</span>}
      {count > 0 && (
        <>
          <span
            aria-hidden="true"
            className="grid h-[22px] min-w-[22px] place-items-center rounded-full bg-mustard px-1.5 text-caption font-bold text-ink"
          >
            {count}
          </span>
          <span className="sr-only">, {count} waiting for your answer</span>
        </>
      )}
    </Link>
  );
}

/** The LendLoop mark and name, linking home. Shared with the public page's top bar. */
export function Wordmark({ href }: { href: string }) {
  return (
    <Link href={href} className="flex w-fit items-center gap-3 text-title font-bold tracking-[-0.01em]">
      <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-ink text-white">
        <LoopMark className="size-[22px]" strokeWidth={1.75} />
      </span>
      LendLoop
    </Link>
  );
}

const RING = "0 0 0 3px var(--color-surface), var(--shadow-soft)";

/**
 * Clerk's account button in our look. Without an uploaded photo Clerk shows a cold gradient, so we
 * hide that image (on the button and in its menu) and draw the initial on the person's tint, like
 * `Avatar`. `name` null means a real photo, which is kept.
 */
function accountAvatar(name: string | null) {
  const trigger = { userButtonAvatarBox: { width: "2.75rem", height: "2.75rem", boxShadow: RING } };
  if (name === null) return trigger;
  return {
    ...trigger,
    userButtonAvatarImage: { display: "none" },
    userPreviewAvatarImage: { display: "none" },
    avatarBox: {
      display: "grid",
      placeContent: "center",
      // tintFor gives "bg-tint-N"; the colour token behind it is --color-tint-N.
      backgroundColor: `var(--color-${tintFor(name || "?").slice(3)})`,
      "&::after": {
        content: JSON.stringify((name.charAt(0) || "?").toUpperCase()),
        fontFamily: "var(--font-sans)",
        fontSize: "1.125rem",
        fontWeight: 700,
        color: "var(--color-ink)",
      },
    },
  };
}

/**
 * Cream top bar with the floating pill navigation for the signed-in area. It creates or refreshes
 * the user's Convex row once per visit (`users.store` never changes the role, so repeating it is
 * harmless) and renders the page only once that row exists, so page queries never hit
 * "account still being set up".
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me);
  const store = useMutation(api.users.store);
  const waiting = useQuery(api.loans.pendingIncomingCount, me ? {} : "skip");
  const [setupError, setSetupError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (isAuthenticated) store().catch((e) => setSetupError(errorMessage(e)));
  }, [isAuthenticated, store]);

  let body: ReactNode = children;
  if (isLoading || (isAuthenticated && me === undefined)) body = <Loading label="Loading your account" />;
  else if (!isAuthenticated) body = <p className="py-8">Please sign in to continue.</p>;
  else if (me === null) body = setupError ? <ErrorText message={setupError} /> : <Loading label="Setting up your account" />;

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only z-10 rounded-full bg-ink px-5 py-2.5 font-bold text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className="mx-auto grid max-w-[90rem] grid-cols-[1fr_auto] items-center gap-x-4 gap-y-4 px-4 pt-4 sm:px-8 sm:pt-7 lg:grid-cols-[1fr_auto_1fr] xl:px-14">
        <Wordmark href="/tools" />
        {/* Below lg the pills take their own row and wrap, so no tab or the waiting count is ever hidden. */}
        <nav
          aria-label="Main"
          className="col-span-2 row-start-2 flex flex-wrap justify-center gap-1 rounded-[1.625rem] bg-surface p-[5px] shadow-soft sm:w-fit sm:justify-self-center sm:rounded-full lg:col-span-1 lg:col-start-2 lg:row-start-1"
        >
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} count={item.href === "/incoming" ? waiting : 0} />
          ))}
          {me?.role === "admin" && <NavLink href="/admin" label="Admin" />}
        </nav>
        <div className="flex justify-self-end">
          <UserButton appearance={{ elements: accountAvatar(user?.hasImage ? null : (me?.firstName ?? user?.firstName ?? "")) }} />
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[90rem] px-4 pt-8 pb-16 focus:outline-none sm:px-8 lg:pt-11 xl:px-14">
        {body}
      </main>
    </div>
  );
}
