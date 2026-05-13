import type { LeaseStatus } from "../../lib/types";

const cls: Record<LeaseStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700 ring-amber-200",
  ACTIVE: "bg-brand-50 text-brand-700 ring-brand-200",
  ENDED: "bg-gray-100 text-gray-600 ring-gray-200",
};

const label: Record<LeaseStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ENDED: "Ended",
};

export function LeaseStatusBadge({ status }: { status: LeaseStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cls[status]}`}
    >
      {label[status]}
    </span>
  );
}
