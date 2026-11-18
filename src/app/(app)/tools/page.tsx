import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { ToolsBoard } from "@/components/tools/tools-board";

export const metadata: Metadata = { title: "Tools | LendLoop" };

export default function ToolsPage() {
  return (
    <>
      <PageHeader title="Tools" description="Everything your neighbors are willing to lend. Pick one and ask for the dates you need." />
      <ToolsBoard />
    </>
  );
}
