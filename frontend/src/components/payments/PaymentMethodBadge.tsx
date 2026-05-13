import type { PaymentMethod } from "../../lib/types";

const cls: Record<PaymentMethod, string> = {
  CASH: "bg-amber-50 text-amber-700 border-amber-200",
  BANK: "bg-sky-50 text-sky-700 border-sky-200",
  MPESA: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const label: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK: "Bank",
  MPESA: "M-Pesa",
};

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs ${cls[method]}`}>
      {label[method]}
    </span>
  );
}
