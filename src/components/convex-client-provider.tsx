"use client";

import type { ReactNode } from "react";
import { ConvexReactClient, useConvexAuth, useMutation } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { api } from "@convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string);

/**
 * Creates the user's row in Convex once per session, right after sign-in.
 * `users.store` never changes the role, so calling it again is harmless.
 */
function StoreUser() {
  const { isAuthenticated } = useConvexAuth();
  const store = useMutation(api.users.store);
  useEffect(() => {
    if (isAuthenticated) void store();
  }, [isAuthenticated, store]);
  return null;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <StoreUser />
      {children}
    </ConvexProviderWithClerk>
  );
}
