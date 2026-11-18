"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { loanStage } from "@/lib/loan-stage";
import { useToday } from "@/lib/use-today";
import { linkButtonClass } from "../button";
import { ConfirmAction } from "../confirm-action";
import { EmptyState } from "../empty-state";
import { Loading } from "../feedback";
import { LoanCard } from "./loan-card";
import { groupLoans, LoanSection } from "./loan-section";

/** Requests I made as a borrower, grouped by where each one stands. */
export function MyRequests() {
  const today = useToday();
  const loans = useQuery(api.loans.myRequests, { today });
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

  const groups = groupLoans(loans.map((loan) => ({ loan, stage: loanStage(loan, today, "borrower") })));
  const sections = [
    { id: "waiting", title: "Waiting", items: groups.waiting },
    { id: "upcoming", title: "Coming up", items: groups.upcoming },
    { id: "out", title: "Out now", items: groups.out },
    { id: "past", title: "Past", items: groups.past },
  ];
  return (
    <div className="grid items-start gap-x-8 gap-y-10 lg:grid-cols-2">
      {sections.map(({ id, title, items }) => (
        <LoanSection key={id} id={`requests-${id}`} title={title} count={items.length}>
          {items.map(({ loan, stage }) => {
            const pending = stage.key === "pending" || stage.key === "expired";
            return (
              <LoanCard
                key={loan._id}
                loan={loan}
                side="borrower"
                stage={stage}
                people={`Lender: ${loan.ownerFirstName}`}
                actions={
                  (pending || stage.key === "upcoming") && (
                    <ConfirmAction
                      label={pending ? "Cancel request" : "Cancel loan"}
                      prompt={pending ? "Cancel this request?" : `Cancel this loan? ${loan.ownerFirstName} will get an email.`}
                      confirmLabel={pending ? "Yes, cancel request" : "Yes, cancel loan"}
                      onConfirm={() => cancel({ loanId: loan._id })}
                    />
                  )
                }
              />
            );
          })}
        </LoanSection>
      ))}
    </div>
  );
}
