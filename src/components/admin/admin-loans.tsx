"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useToday } from "@/lib/use-today";
import { EmptyState } from "../empty-state";
import { Loading } from "../feedback";
import { LoanCard } from "../loans/loan-card";
import { Section } from "./section";

export function AdminLoans() {
  const loans = useQuery(api.admin.listAllLoans, { today: useToday() });
  return (
    <Section title="All loans">
      {loans === undefined && <Loading label="Loading loans" />}
      {loans?.length === 0 && <EmptyState title="No loans yet" hint="Requests will appear here as neighbors borrow tools." />}
      {loans && loans.length > 0 && (
        <ul className="space-y-3">
          {loans.map((loan) => (
            <LoanCard key={loan._id} loan={loan} people={`${loan.ownerFirstName} lends to ${loan.borrowerFirstName}`} />
          ))}
        </ul>
      )}
    </Section>
  );
}
