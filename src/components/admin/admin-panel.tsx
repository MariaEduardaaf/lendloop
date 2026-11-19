"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useToday } from "@/lib/use-today";
import { Loading } from "../feedback";
import { PageHeader } from "../page-header";
import { AdminLoans, adminRows, type LoanFilter } from "./admin-loans";
import { AdminTools } from "./admin-tools";
import { AdminUsers } from "./admin-users";
import { WorkflowErrors } from "./workflow-errors";

/**
 * Admin area. The sections below only mount for an admin, so a regular user never calls
 * the admin queries (the backend would reject them anyway: this is just the friendly message).
 */
export function AdminPanel() {
  const me = useQuery(api.users.me);
  if (me === undefined) return <Loading />;
  if (me?.role !== "admin") {
    return (
      <>
        <PageHeader title="Admin" />
        <p role="alert" className="rounded-card bg-surface p-6 shadow-soft sm:p-8">
          Admins only. This area is for LendLoop administrators.
        </p>
      </>
    );
  }
  return <AdminArea />;
}

const SECTIONS = [
  { href: "#loans", label: "Loans" },
  { href: "#listings", label: "Listings" },
  { href: "#users", label: "Users" },
  { href: "#errors", label: "Workflow errors" },
];

function AdminArea() {
  const today = useToday();
  const loans = useQuery(api.admin.listAllLoans, { today });
  const errors = useQuery(api.admin.listWorkflowErrors);
  const [filter, setFilter] = useState<LoanFilter>("all");
  const rows = loans && adminRows(loans, today);

  const errorCount = errors?.length ?? 0;

  return (
    <>
      <PageHeader title="Admin" description="Every loan, listing and neighbor, and anything the automation could not deliver." />
      {rows === undefined || errors === undefined ? (
        <Loading label="Loading the admin overview" />
      ) : (
        <>
          <nav aria-label="Admin sections" className="-mx-4 flex gap-2 overflow-x-auto px-4 py-1 sm:mx-0 sm:flex-wrap sm:px-0">
            {SECTIONS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="flex h-10 shrink-0 items-center gap-2 rounded-full bg-surface px-[18px] text-[0.9375rem] font-semibold whitespace-nowrap shadow-[inset_0_0_0_1px_var(--color-line)] transition-colors duration-150 ease-out hover:bg-soft"
              >
                {s.label}
                {/* The count turns red only when there is something to look at. */}
                {s.href === "#errors" && (
                  <span
                    className={`grid h-[22px] min-w-[22px] place-items-center rounded-full px-1.5 text-[0.8125rem] font-bold tabular-nums ${
                      errorCount > 0 ? "bg-tomato text-white" : "bg-soft text-ink"
                    }`}
                  >
                    {errorCount}
                  </span>
                )}
              </a>
            ))}
          </nav>
          <div className="mt-10 space-y-14">
            <AdminLoans rows={rows} filter={filter} onFilter={setFilter} />
            <AdminTools today={today} />
            <AdminUsers />
            <WorkflowErrors errors={errors} />
          </div>
        </>
      )}
    </>
  );
}
