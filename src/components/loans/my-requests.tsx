"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { ActionButton } from "../action-button";
import { EmptyState } from "../empty-state";
import { Loading } from "../feedback";
import { linkButtonClass } from "../button";
import { LoanCard } from "./loan-card";

/** Requests I made as a borrower. Pending ones can be cancelled. */
export function MyRequests() {
  const loans = useQuery(api.loans.myRequests);
  const cancel = useMutation(api.loans.cancel);

  if (loans === undefined) return <Loading label="Loading your requests" />;
  if (loans.length === 0) {
    return (
      <EmptyState
        title="You have not requested any tools yet"
        hint="Find something on the tools board and pick the dates you need it."
        action={
          <Link href="/tools" className={linkButtonClass}>
            Browse tools
          </Link>
        }
      />
    );
  }
  return (
    <ul className="space-y-3">
      {loans.map((loan) => (
        <LoanCard
          key={loan._id}
          loan={loan}
          people={`Lender: ${loan.ownerFirstName}`}
          actions={
            loan.status === "pending" && (
              <ActionButton label="Cancel request" onClick={() => cancel({ loanId: loan._id })} />
            )
          }
        />
      ))}
    </ul>
  );
}
