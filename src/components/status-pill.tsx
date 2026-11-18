import { Badge } from "./badge";
import { STATUS_LABELS, type LoanStatus } from "@/lib/labels";

const TONES = {
  pending: "warn",
  approved: "good",
  declined: "neutral",
  cancelled: "neutral",
  returned: "accent",
} as const;

export function StatusPill({ status }: { status: LoanStatus }) {
  return <Badge tone={TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}

export function AvailabilityBadge({ availability }: { availability: "available" | "on_loan" }) {
  return availability === "available" ? <Badge tone="good">Available</Badge> : <Badge tone="warn">On loan</Badge>;
}
