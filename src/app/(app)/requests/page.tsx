import type { Metadata } from "next";
import { MyRequests } from "@/components/loans/my-requests";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "My requests | LendLoop" };

export default function RequestsPage() {
  return (
    <>
      <PageHeader title="My requests" description="Tools you asked to borrow and where each request stands." />
      <MyRequests />
    </>
  );
}
