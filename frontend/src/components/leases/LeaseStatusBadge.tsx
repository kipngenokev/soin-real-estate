import type { LeaseStatus } from "../../lib/types";
import { Pill } from "../ui/Pill";
import type { Tone } from "../ui/tones";

const TONE: Record<LeaseStatus, Tone> = {
  DRAFT: "amber",
  ACTIVE: "emerald",
  ENDED: "slate",
};

const LABEL: Record<LeaseStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ENDED: "Ended",
};

export function LeaseStatusBadge({ status }: { status: LeaseStatus }) {
  return <Pill tone={TONE[status]}>{LABEL[status]}</Pill>;
}
