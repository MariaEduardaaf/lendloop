"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { UserButton } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import { errorMessage } from "@/lib/errors";
import { ErrorText, Loading } from "./feedback";

const NAV = [
  { href: "/tools", label: "Tools" },
  { href: "/listings", label: "My listings" },
  { href: "/requests", label: "My requests" },
  { href: "/incoming", label: "Incoming requests" },
];

function NavLink({ href, label, count = 0 }: { href: string; label: string; count?: number }) {
  const active = usePathname().startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex shrink-0 items-center gap-2 border-b-[3px] px-3 pt-[3px] text-sm font-semibold whitespace-nowrap transition-colors ${
        active ? "border-signal text-white" : "border-transparent text-on-navy hover:text-white"
      }`}
    >
      {label}
      {count > 0 && (
        <>
          <span aria-hidden="true" className="grid h-5 min-w-5 place-items-center rounded-full bg-dock px-1.5 text-xs font-bold text-navy">
            {count}
          </span>
          <span className="sr-only">, {count} waiting for your answer</span>
        </>
      )}
    </Link>
  );
}

/**
 * Navy station bar and navigation for the signed-in area. It creates or refreshes the user's
 * Convex row once per visit (`users.store` never changes the role, so repeating it is
 * harmless) and renders the page only once that row exists, so page queries never hit
 * "account still being set up".
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me);
  const store = useMutation(api.users.store);
  const waiting = useQuery(api.loans.pendingIncomingCount, me ? {} : "skip");
  const [setupError, setSetupError] = useState<string | null>(null);

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
        className="sr-only z-10 rounded-md bg-plate px-4 py-2 font-semibold text-navy focus:not-sr-only focus:absolute focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <header className="on-navy bg-navy text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-stretch justify-between gap-x-8 px-4 sm:flex-nowrap sm:px-6">
          <Link href="/tools" className="flex h-14 items-center text-xl font-bold tracking-tight sm:h-15">
            LendLoop
          </Link>
          <nav
            aria-label="Main"
            className="order-last -mx-4 flex h-12 border-t border-white/10 sm:border-t-0 w-[calc(100%+2rem)] overflow-x-auto px-1 sm:order-none sm:mx-0 sm:mr-auto sm:h-auto sm:w-auto sm:px-0"
          >
            {NAV.map((item) => (
              <NavLink key={item.href} {...item} count={item.href === "/incoming" ? waiting : 0} />
            ))}
            {me?.role === "admin" && <NavLink href="/admin" label="Admin" />}
          </nav>
          <div className="flex items-center">
            <UserButton />
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 focus:outline-none sm:px-6">
        {body}
      </main>
    </div>
  );
}
