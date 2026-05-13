import { LeaseStatus, Prisma } from "@prisma/client";

/**
 * Inclusive count of calendar months touched between `start` and `end`.
 * Example: start = 2026-03-15, end = 2026-05-13 → 3 (March, April, May).
 * Returns 0 if start is after end.
 */
export function monthsBilled(start: Date, end: Date): number {
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1;
  return Math.max(0, months);
}

export type LeaseFinancials = {
  monthsBilled: number;
  totalBilled: string; // decimal string
  totalPaid: string;
  balance: string;
};

export function computeLeaseFinancials(opts: {
  status: LeaseStatus;
  startDate: Date | null;
  endDate: Date | null;
  monthlyRent: Prisma.Decimal | string | number;
  paid: Prisma.Decimal | string | number | null;
  now?: Date;
}): LeaseFinancials {
  const now = opts.now ?? new Date();
  const billed =
    opts.status === LeaseStatus.DRAFT || !opts.startDate
      ? 0
      : monthsBilled(opts.startDate, opts.endDate ?? now);
  const rent = new Prisma.Decimal(opts.monthlyRent as Prisma.Decimal.Value);
  const totalBilled = rent.mul(billed);
  const totalPaid = new Prisma.Decimal((opts.paid ?? 0) as Prisma.Decimal.Value);
  const balance = totalBilled.sub(totalPaid);
  return {
    monthsBilled: billed,
    totalBilled: totalBilled.toFixed(2),
    totalPaid: totalPaid.toFixed(2),
    balance: balance.toFixed(2),
  };
}
