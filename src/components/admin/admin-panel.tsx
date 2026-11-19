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
          {/* Plain text links: the pill look belongs to the loan filters below, which filter rather than navigate. */}
          <nav aria-label="Admin sections" className="flex flex-wrap gap-x-6 gap-y-1">
            {SECTIONS.map((s) => (
              <a
                key={s.href}
                href={s.href}
                className="flex min-h-10 items-center gap-1.5 text-[0.9375rem] font-semibold decoration-1 hover:underline focus-visible:underline"
              >
                {s.label}
                {/* The count turns red only when there is something to look at. */}
                {s.href === "#errors" && (
                  <span className={`tabular-nums ${errorCount > 0 ? "font-bold text-late" : "text-muted"}`}>({errorCount})</span>
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
