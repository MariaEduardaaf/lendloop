import type { Metadata } from "next";
import { IncomingRequests } from "@/components/loans/incoming-requests";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Incoming requests | LendLoop" };

export default function IncomingPage() {
  return (
    <>
      <PageHeader title="Incoming requests" description="Neighbors asking to borrow your tools." />
      <IncomingRequests />
    </>
  );
}
