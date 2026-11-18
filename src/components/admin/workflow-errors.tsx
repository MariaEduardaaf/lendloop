"use client";

import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { relativeTime } from "@/lib/format";
import { EmptyState } from "../empty-state";
import { Loading } from "../feedback";
import { Section } from "./section";

/** Failures the n8n error workflow reported back, newest first. */
export function WorkflowErrors() {
  const errors = useQuery(api.admin.listWorkflowErrors);
  return (
    <Section title="Recent workflow errors">
      {errors === undefined && <Loading label="Loading workflow errors" />}
      {errors?.length === 0 && <EmptyState title="No workflow errors" hint="Failed n8n runs will show up here." />}
      {errors && errors.length > 0 && (
        <ul className="divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white">
          {errors.map((error) => (
            <li key={error._id} className="px-4 py-3 text-sm">
              <p className="font-medium text-stone-900">
                {error.workflowName}
                {error.nodeName && <span className="font-normal text-stone-600"> (node: {error.nodeName})</span>}
                <span className="font-normal text-stone-600"> · {relativeTime(error.occurredAt)}</span>
              </p>
              <p className="mt-1 break-words text-stone-700">{error.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
