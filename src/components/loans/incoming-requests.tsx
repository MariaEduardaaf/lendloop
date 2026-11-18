"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { LoanStatus } from "@/lib/labels";
import { useToday } from "@/lib/use-today";
import { ActionButton } from "../action-button";
import { EmptyState } from "../empty-state";
import { Loading } from "../feedback";
import { linkButtonClass } from "../button";
import { LoanCard } from "./loan-card";

// Things that need the lender first: unanswered requests, then loans still out.
const ORDER: Record<LoanStatus, number> = { pending: 0, approved: 1, returned: 2, declined: 2, cancelled: 2 };

/** Requests on my tools: approve or decline pending ones, mark approved ones as returned. */
export function IncomingRequests() {
  const loans = useQuery(api.loans.incoming, { today: useToday() });
  const approve = useMutation(api.loans.approve);
  const decline = useMutation(api.loans.decline);
  const markReturned = useMutation(api.loans.markReturned);

  if (loans === undefined) return <Loading label="Loading incoming requests" />;
  if (loans.length === 0) {
    return (
      <EmptyState
        title="No requests on your tools yet"
        hint="When a neighbor asks to borrow one of your tools, it shows up here."
        action={
          <Link href="/listings" className={linkButtonClass}>
            Add a tool
          </Link>
        }
      />
    );
  }
  const sorted = [...loans].sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.createdAt - a.createdAt);
  return (
    <ul className="space-y-3">
      {sorted.map((loan) => (
        <LoanCard
          key={loan._id}
          loan={loan}
          people={`Borrower: ${loan.borrowerFirstName}`}
          actions={
            <>
              {loan.status === "pending" && (
                <div className="flex flex-wrap items-start gap-2">
                  <ActionButton variant="primary" label="Approve" onClick={() => approve({ loanId: loan._id })} />
                  <ActionButton label="Decline" onClick={() => decline({ loanId: loan._id })} />
                </div>
              )}
              {loan.status === "approved" && (
                <ActionButton label="Mark returned" onClick={() => markReturned({ loanId: loan._id })} />
              )}
            </>
          }
        />
      ))}
    </ul>
  );
}
