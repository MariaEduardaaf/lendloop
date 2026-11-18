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

  const count = (f: LoanFilter) => rows?.filter((r) => r.filter === f).length ?? 0;
  // Late and errors turn red only when there is something to look at.
  const summary: { label: string; value: number; href: string; filter?: LoanFilter; alarm?: boolean }[] = [
    { label: "Pending", value: count("pending"), href: "#loans", filter: "pending" },
    { label: "Out now", value: count("out"), href: "#loans", filter: "out" },
    { label: "Late", value: count("late"), href: "#loans", filter: "late", alarm: true },
    { label: "Workflow errors", value: errors?.length ?? 0, href: "#errors", alarm: true },
  ];

  return (
    <>
      <PageHeader title="Admin" description="Every loan, listing and neighbor, and anything the automation could not deliver." />
      {rows === undefined || errors === undefined ? (
        <Loading label="Loading the admin overview" />
      ) : (
        <div className="space-y-12">
          <div className="space-y-5">
            <ul aria-label="Overview" className="grid grid-cols-2 overflow-hidden rounded-md border border-steel bg-plate sm:grid-cols-4">
              {summary.map(({ label, value, href, filter: f, alarm }, i) => {
                const red = alarm && value > 0;
                return (
                  <li key={label} className={`border-steel ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}>
                    <a
                      href={href}
                      onClick={() => f && setFilter(f)}
                      className="block px-4 py-3 no-underline transition-colors hover:bg-tile"
                    >
                      <span className="block label-caps text-muted">{label}</span>
                      <span className={`mt-1 block text-h2 font-bold tabular-nums ${red ? "text-late" : ""}`}>{value}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <nav aria-label="Admin sections" className="flex flex-wrap gap-x-6 gap-y-2 border-b border-steel pb-3 text-sm font-semibold">
              {SECTIONS.map((s) => (
                <a key={s.href} href={s.href} className="underline decoration-edge hover:decoration-navy">
                  {s.label}
                </a>
              ))}
            </nav>
          </div>
          <AdminLoans rows={rows} filter={filter} onFilter={setFilter} />
          <AdminTools today={today} />
          <AdminUsers />
          <WorkflowErrors errors={errors} />
        </div>
      )}
    </>
  );
}
