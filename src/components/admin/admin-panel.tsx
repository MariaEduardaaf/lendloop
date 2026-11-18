"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Loading } from "../feedback";
import { PageHeader } from "../page-header";
import { AdminLoans } from "./admin-loans";
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
        <p role="alert" className="rounded-lg border border-stone-200 bg-white p-6 text-stone-800">
          Admins only. This area is for LendLoop administrators.
        </p>
      </>
    );
  }
  return (
    <>
      <PageHeader title="Admin" description="All loans, lenders, listings and automation problems." />
      <div className="space-y-12">
        <AdminLoans />
        <AdminUsers />
        <AdminTools />
        <WorkflowErrors />
      </div>
    </>
  );
}
