"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useAction } from "@/lib/use-action";
import { Avatar } from "../avatar";
import { Badge } from "../badge";
import { ErrorText, Loading } from "../feedback";
import { TRUSTED_LENDER_MEANING } from "../trusted-seal";
import { listCard, Section } from "./section";

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
      <label className="flex min-h-10 w-fit cursor-pointer items-center gap-2.5 font-semibold">
        <input
          type="checkbox"
          className="size-5 cursor-pointer"
          aria-describedby={MEANING_ID}
          checked={checked}
          disabled={pending}
          onChange={(e) => change(e.target.checked)}
        />
        Trusted Lender<span className="sr-only">: {name}</span>
      </label>
      <p role="status" className="text-sm text-moss">
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
          {TRUSTED_LENDER_MEANING} The Trusted mark shows next to their name on the board and on their requests.
        </span>
      }
    >
      {users === undefined && <Loading label="Loading users" />}
      {users && (
        <ul className={listCard}>
          {users.map((user) => (
            <li
              key={user._id}
              className="grid gap-x-6 gap-y-2 px-2 py-4 sm:px-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_15rem] md:items-start"
            >
              <p className="flex flex-wrap items-center gap-2.5 font-bold md:min-h-10">
                <Avatar name={user.firstName} />
                {user.firstName}
                {user.role === "admin" && <Badge>Admin</Badge>}
              </p>
              <p className="text-[0.9375rem] break-all text-muted md:flex md:min-h-10 md:items-center">{user.email}</p>
              <TrustedToggle userId={user._id} name={user.firstName} checked={user.trustedLender} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
