// Manual validation of the JSON bodies n8n sends to the HTTP endpoints. Runs after the
// signature check, and turns anything unexpected into a clean 400 instead of a 500.

import { isIsoDate } from "./dates";

export type ReminderBody = {
  loanId: string;
  reminderKey: string;
  status: "sent" | "failed";
  error?: string;
};

export type WorkflowErrorBody = {
  executionId: string;
  workflowName: string;
  nodeName?: string;
  message: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function shortString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= max;
}

function optionalString(value: unknown, max: number): boolean {
  return value === undefined || (typeof value === "string" && value.length <= max);
}

/** reminderKey must be exactly "reminder:<loanId>:<YYYY-MM-DD>" for the same loan. */
function validReminderKey(key: string, loanId: string): boolean {
  const prefix = `reminder:${loanId}:`;
  return key.startsWith(prefix) && isIsoDate(key.slice(prefix.length));
}

export function parseReminderBody(raw: unknown): ReminderBody | null {
  if (!isRecord(raw)) return null;
  const { loanId, reminderKey, status, error } = raw;
  if (!shortString(loanId, 64) || !shortString(reminderKey, 200)) return null;
  if (status !== "sent" && status !== "failed") return null;
  if (!optionalString(error, 2000)) return null;
  if (!validReminderKey(reminderKey, loanId)) return null;
  return { loanId, reminderKey, status, error: error as string | undefined };
}

export function parseWorkflowErrorBody(raw: unknown): WorkflowErrorBody | null {
  if (!isRecord(raw)) return null;
  const { executionId, workflowName, nodeName, message } = raw;
  if (!shortString(executionId, 100) || !shortString(workflowName, 200)) return null;
  if (typeof message !== "string" || message.length === 0 || message.length > 5000) return null;
  if (!optionalString(nodeName, 200)) return null;
  return { executionId, workflowName, nodeName: nodeName as string | undefined, message };
}
