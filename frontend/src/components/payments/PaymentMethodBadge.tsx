import type { PaymentMethod } from "../../lib/types";
import { Pill } from "../ui/Pill";
import type { Tone } from "../ui/tones";

const TONE: Record<PaymentMethod, Tone> = {
  CASH: "amber",
  BANK: "blue",
  MPESA: "emerald",
};

const LABEL: Record<PaymentMethod, string> = {
  CASH: "Cash",
  BANK: "Bank",
  MPESA: "M-Pesa",
};

export function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  return <Pill tone={TONE[method]}>{LABEL[method]}</Pill>;
}
