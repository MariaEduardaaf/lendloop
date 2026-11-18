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

function NavLink({ href, label }: { href: string; label: string }) {
  const active = usePathname().startsWith(href);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
        active ? "bg-teal-50 text-teal-900 ring-1 ring-inset ring-teal-300" : "text-stone-700 hover:bg-stone-100"
      }`}
    >
      {label}
    </Link>
  );
}

/**
 * Header and navigation for the signed-in area. It creates or refreshes the user's
 * Convex row once per visit (`users.store` never changes the role, so repeating it is
 * harmless) and renders the page only once that row exists, so page queries never hit
 * "account still being set up".
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me);
  const store = useMutation(api.users.store);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) store().catch((e) => setSetupError(errorMessage(e)));
  }, [isAuthenticated, store]);

  let body: ReactNode = children;
  if (isLoading || (isAuthenticated && me === undefined)) body = <Loading label="Loading your account" />;
  else if (!isAuthenticated) body = <p className="py-8 text-stone-700">Please sign in to continue.</p>;
  else if (me === null) body = setupError ? <ErrorText message={setupError} /> : <Loading label="Setting up your account" />;

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/tools" className="text-lg font-semibold tracking-tight text-accent">
            LendLoop
          </Link>
          <nav aria-label="Main" className="order-last flex w-full flex-wrap gap-1 sm:order-none sm:w-auto">
            {NAV.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
            {me?.role === "admin" && <NavLink href="/admin" label="Admin" />}
          </nav>
          <UserButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{body}</main>
    </div>
  );
}
