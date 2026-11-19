"use client";

import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Check } from "lucide-react";
import { api } from "@convex/_generated/api";
import { loanStage, type Stage } from "@/lib/loan-stage";
import type { IncomingRow } from "@/lib/types";
import { useToday } from "@/lib/use-today";
import { ActionButton } from "../action-button";
import { linkButtonClass } from "../button";
import { ConfirmAction } from "../confirm-action";
import { EmptyState } from "../empty-state";
import { Loading } from "../feedback";
import { BorrowerContext } from "./borrower-context";
import { LoanCard } from "./loan-card";
import { groupLoans, LoanSection, PastLoans } from "./loan-section";

/** Requests on my tools, grouped by what they need from me. */
export function IncomingRequests() {
  const today = useToday();
  const loans = useQuery(api.loans.incoming, { today });
  const approve = useMutation(api.loans.approve);
  const decline = useMutation(api.loans.decline);
  const cancel = useMutation(api.loans.cancel);
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

  function actions(loan: IncomingRow, stage: Stage) {
    const name = loan.borrowerFirstName;
    switch (stage.key) {
      case "pending":
      case "expired":
        // A pending request is the mustard card: big ink Approve, outlined Decline.
        return (
          <>
            {stage.key === "pending" && (
              <ActionButton
                variant="primary"
                size="lg"
                icon={<Check aria-hidden="true" className="size-5" strokeWidth={2} />}
                label="Approve"
                onClick={() => approve({ loanId: loan._id })}
              />
            )}
            <ConfirmAction
              variant={stage.key === "pending" ? "outline" : "secondary"}
              size={stage.key === "pending" ? "lg" : "md"}
              label="Decline"
              prompt={`Decline ${name}'s request?`}
              confirmLabel="Yes, decline"
              onConfirm={() => decline({ loanId: loan._id })}
            />
          </>
        );
      case "upcoming":
        return (
          <ConfirmAction
            label="Cancel loan"
            prompt={`Cancel this loan? ${name} will get an email.`}
            confirmLabel="Yes, cancel loan"
            onConfirm={() => cancel({ loanId: loan._id })}
          />
        );
      case "out":
      case "due_today":
      case "late":
        return (
          <ConfirmAction
            label="Mark returned"
            prompt={`Is the ${loan.toolName} back with you?`}
            confirmLabel="Yes, it is back"
            onConfirm={() => markReturned({ loanId: loan._id })}
          />
        );
      default:
        return undefined;
    }
  }

  const groups = groupLoans(loans.map((loan) => ({ loan, stage: loanStage(loan, today, "owner") })));
  const sections = [
    { id: "waiting", title: "Needs your answer", items: groups.waiting },
    { id: "upcoming", title: "Coming up", items: groups.upcoming },
    { id: "out", title: "Out now", items: groups.out },
    { id: "past", title: "Past", items: groups.past },
  ];
  return (
    <div className="grid items-start gap-x-10 gap-y-12 lg:grid-cols-2">
      {sections.map(({ id, title, items }) => (
        <LoanSection key={id} id={`incoming-${id}`} title={title} count={items.length}>
          {id === "past" ? (
            <PastLoans
              items={items}
              side="owner"
              person={(loan) => ({ label: "Borrower", name: loan.borrowerFirstName })}
              actions={actions}
            />
          ) : (
            items.map(({ loan, stage }) => (
              <LoanCard
                key={loan._id}
                loan={loan}
                side="owner"
                stage={stage}
                person={{ label: "Borrower", name: loan.borrowerFirstName }}
                context={stage.key === "pending" && <BorrowerContext loan={loan} onMustard />}
                actions={actions(loan, stage)}
              />
            ))
          )}
        </LoanSection>
      ))}
    </div>
  );
}
