import type { LeaseStatus } from "../../lib/types";

const cls: Record<LeaseStatus, string> = {
  DRAFT: "bg-slate-50 text-slate-700 border-slate-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ENDED: "bg-gray-100 text-gray-600 border-gray-200",
};

const label: Record<LeaseStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ENDED: "Ended",
};

export function LeaseStatusBadge({ status }: { status: LeaseStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${cls[status]}`}>
      {label[status]}
    </span>
  );
}
