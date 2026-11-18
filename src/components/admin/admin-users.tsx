"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAction } from "@/lib/use-action";
import { Badge } from "../badge";
import { ErrorText, Loading } from "../feedback";
import { Section } from "./section";

function TrustedToggle({ userId, checked }: { userId: Id<"users">; checked: boolean }) {
  const setTrusted = useMutation(api.admin.setTrustedLender);
  const { pending, error, run } = useAction();
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="size-4 accent-teal-700"
          checked={checked}
          disabled={pending}
          onChange={(e) => run(() => setTrusted({ userId, value: e.target.checked }))}
        />
        Trusted Lender
      </label>
      <ErrorText message={error} />
    </div>
  );
}

export function AdminUsers() {
  const users = useQuery(api.admin.listUsers);
  return (
    <Section title="Users">
      {users === undefined && <Loading label="Loading users" />}
      {users && (
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {users.map((user) => (
            <li key={user._id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-medium">
                  {user.firstName}
                  {user.role === "admin" && <Badge>Admin</Badge>}
                </p>
                <p className="break-all text-sm text-stone-600">{user.email}</p>
              </div>
              <TrustedToggle userId={user._id} checked={user.trustedLender} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
