import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

// Everything under this folder is the signed-in area (the proxy already requires a session).
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
