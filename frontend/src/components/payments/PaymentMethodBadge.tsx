import type { PaymentMethod } from "../../lib/types";

const cls: Record<PaymentMethod, string> = {
  CASH: "bg-amber-50 text-amber-700 ring-amber-200",
  BANK: "bg-sky-50 text-sky-700 ring-sky-200",
  MPESA: "bg-brand-50 text-brand-700 ring-brand-200",
};

const label: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK: "Bank",
  MPESA: "M-Pesa",
};

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${cls[method]}`}
    >
      {label[method]}
    </span>
  );
}
