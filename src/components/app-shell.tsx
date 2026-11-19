"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { UserButton } from "@clerk/nextjs";
import { Infinity as LoopMark } from "lucide-react";
import { api } from "@convex/_generated/api";
import { errorMessage } from "@/lib/errors";
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
            className="grid h-[22px] min-w-[22px] place-items-center rounded-full bg-mustard px-1.5 text-[0.8125rem] font-bold text-ink"
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
    <Link href={href} className="flex w-fit items-center gap-3 text-[1.375rem] font-bold tracking-[-0.01em]">
      <span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-ink text-white">
        <LoopMark className="size-[22px]" strokeWidth={1.75} />
      </span>
      LendLoop
    </Link>
  );
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
          <UserButton
            appearance={{ elements: { avatarBox: "size-11 shadow-[0_0_0_3px_var(--color-surface),var(--shadow-soft)]" } }}
          />
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[90rem] px-4 pt-8 pb-16 focus:outline-none sm:px-8 lg:pt-11 xl:px-14">
        {body}
      </main>
    </div>
  );
}
