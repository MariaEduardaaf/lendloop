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
        <p role="alert" className="rounded-md border border-steel bg-plate p-6">
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
        <div className="space-y-12">
          <nav aria-label="Admin sections" className="flex flex-wrap gap-x-6 gap-y-2 border-b border-steel pb-3 text-sm font-semibold">
            {SECTIONS.map((s) => (
              <a key={s.href} href={s.href} className="underline decoration-edge hover:decoration-navy">
                {s.label}
                {/* Errors turn red only when there is something to look at. */}
                {s.href === "#errors" && (
                  <span className={`ml-1.5 tabular-nums ${errorCount > 0 ? "text-late" : "text-muted"}`}>{errorCount}</span>
                )}
              </a>
            ))}
          </nav>
          <AdminLoans rows={rows} filter={filter} onFilter={setFilter} />
          <AdminTools today={today} />
          <AdminUsers />
          <WorkflowErrors errors={errors} />
        </div>
      )}
    </>
  );
}
