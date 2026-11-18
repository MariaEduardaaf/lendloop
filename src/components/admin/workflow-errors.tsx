"use client";

import type { FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";
import { relativeTime } from "@/lib/format";
import { EmptyState } from "../empty-state";
import { listPlate, Section } from "./section";

type WorkflowError = FunctionReturnType<typeof api.admin.listWorkflowErrors>[number];

/** Failures the n8n error workflow reported back, newest first. Always shown, even when empty. */
export function WorkflowErrors({ errors }: { errors: WorkflowError[] }) {
  return (
    <Section id="errors" title="Workflow errors" count={errors.length}>
      {errors.length === 0 ? (
        <EmptyState title="No workflow errors" hint="If an n8n run fails, it shows up here with the step that broke." />
      ) : (
        <ul className={listPlate}>
          {errors.map((error) => (
            <li key={error._id} className="grid gap-x-6 gap-y-1 px-4 py-3 text-sm md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
              <div>
                <p className="font-bold text-late">{error.workflowName}</p>
                <p className="text-muted">
                  {error.nodeName ? `Step: ${error.nodeName}, ` : ""}
                  {relativeTime(error.occurredAt)}
                </p>
              </div>
              <p className="break-words">{error.message}</p>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
