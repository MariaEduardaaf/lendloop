import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { AppShell } from "@/components/app-shell";

// Everything under this folder is the signed-in area. A visitor without a session is
// sent to sign-in here. This only keeps strangers off the pages: the data itself is
// protected in Convex, where every function checks the caller.
export default async function AppLayout({ children }: { children: ReactNode }) {
  await auth.protect();
  return <AppShell>{children}</AppShell>;
}
