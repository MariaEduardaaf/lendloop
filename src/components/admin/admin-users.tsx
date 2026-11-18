"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAction } from "@/lib/use-action";
import { Badge } from "../badge";
import { ErrorText, Loading } from "../feedback";
import { TRUSTED_LENDER_MEANING } from "../trusted-seal";
import { listPlate, Section } from "./section";

const MEANING_ID = "trusted-lender-meaning";

/** The Trusted Lender checkbox. The change is confirmed in words, so it is never silent. */
function TrustedToggle({ userId, name, checked }: { userId: Id<"users">; name: string; checked: boolean }) {
  const setTrusted = useMutation(api.admin.setTrustedLender);
  const { pending, error, run } = useAction();
  const [done, setDone] = useState("");

  async function change(value: boolean) {
    setDone("");
    if (await run(() => setTrusted({ userId, value }))) {
      setDone(value ? `${name} is now a Trusted Lender.` : `${name} is no longer a Trusted Lender.`);
    }
  }

  return (
    <div className="space-y-1">
      <label className="flex min-h-10 items-center gap-2 font-semibold">
        <input
          type="checkbox"
          className="size-4"
          aria-describedby={MEANING_ID}
          checked={checked}
          disabled={pending}
          onChange={(e) => change(e.target.checked)}
        />
        Trusted Lender<span className="sr-only">: {name}</span>
      </label>
      <p role="status" className="text-sm text-muted">
        {done}
      </p>
      <ErrorText message={error} />
    </div>
  );
}

export function AdminUsers() {
  const users = useQuery(api.admin.listUsers);
  return (
    <Section
      id="users"
      title="Users"
      count={users?.length}
      description={
        <span id={MEANING_ID}>
          {TRUSTED_LENDER_MEANING} The seal shows next to their name on the board and on their requests.
        </span>
      }
    >
      {users === undefined && <Loading label="Loading users" />}
      {users && (
        <ul className={listPlate}>
          {users.map((user) => (
            <li
              key={user._id}
              className="grid gap-x-6 gap-y-1 px-4 py-3 text-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_14rem] md:items-start"
            >
              <p className="flex flex-wrap items-center gap-2 pt-0 font-bold md:pt-2.5">
                {user.firstName}
                {user.role === "admin" && <Badge>Admin</Badge>}
              </p>
              <p className="break-all text-muted md:pt-2.5">{user.email}</p>
              <TrustedToggle userId={user._id} name={user.firstName} checked={user.trustedLender} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
