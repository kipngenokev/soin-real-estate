import { PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { paymentRepository, type PaymentListFilter } from "../repositories/payment.repository";
import { AppError } from "../utils/AppError";
import { computeLeaseFinancials, type LeaseFinancials } from "../utils/billing";

function assertMethod(value: unknown): PaymentMethod {
  if (
    value === PaymentMethod.CASH ||
    value === PaymentMethod.BANK ||
    value === PaymentMethod.MPESA
  ) {
    return value;
  }
  throw new AppError(`method must be one of ${Object.values(PaymentMethod).join(", ")}`, 400);
}

function parseAmount(value: unknown): Prisma.Decimal {
  const n = typeof value === "string" ? Number(value) : (value as number);
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) {
    throw new AppError("amount must be a positive number", 400);
  }
  return new Prisma.Decimal(n.toFixed(2));
}

function parseDate(value: unknown, label: string, optional = false): Date | undefined {
  if (value === undefined || value === null || value === "") {
    if (optional) return undefined;
    throw new AppError(`${label} is required`, 400);
  }
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) throw new AppError(`invalid ${label}`, 400);
  return d;
}

function parseOptionalMethod(value: unknown): PaymentMethod | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return assertMethod(value);
}

export type CreatePaymentInput = {
  leaseId: number;
  amount: number | string;
  method: string;
  reference?: string | null;
  note?: string | null;
  paidAt?: string;
};

export type UpdatePaymentInput = Partial<CreatePaymentInput>;

export type PaymentFilterInput = {
  method?: unknown;
  leaseId?: unknown;
  tenantId?: unknown;
  from?: unknown;
  to?: unknown;
};

function parseOptionalId(value: unknown, label: string): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`invalid ${label}`, 400);
  return n;
}

export const paymentService = {
  list(input: PaymentFilterInput) {
    const filter: PaymentListFilter = {
      method: parseOptionalMethod(input.method),
      leaseId: parseOptionalId(input.leaseId, "leaseId"),
      tenantId: parseOptionalId(input.tenantId, "tenantId"),
      from: parseDate(input.from, "from", true),
      to: parseDate(input.to, "to", true),
    };
    return paymentRepository.list(filter);
  },

  async get(id: number) {
    const payment = await paymentRepository.findById(id);
    if (!payment) throw new AppError("payment not found", 404);
    return payment;
  },

  async create(input: CreatePaymentInput) {
    if (!Number.isInteger(input.leaseId) || input.leaseId <= 0) {
      throw new AppError("leaseId is required", 400);
    }
    const lease = await prisma.lease.findUnique({ where: { id: input.leaseId } });
    if (!lease) throw new AppError("lease not found", 404);

    return paymentRepository.create({
      leaseId: input.leaseId,
      amount: parseAmount(input.amount),
      method: assertMethod(input.method),
      reference: input.reference?.toString().trim() || null,
      note: input.note?.toString().trim() || null,
      paidAt: input.paidAt ? parseDate(input.paidAt, "paidAt")! : new Date(),
    });
  },

  async update(id: number, input: UpdatePaymentInput) {
    await this.get(id);
    const patch: Prisma.PaymentUncheckedUpdateInput = {};
    if (input.amount !== undefined) patch.amount = parseAmount(input.amount);
    if (input.method !== undefined) patch.method = assertMethod(input.method);
    if (input.reference !== undefined) {
      patch.reference = input.reference?.toString().trim() || null;
    }
    if (input.note !== undefined) {
      patch.note = input.note?.toString().trim() || null;
    }
    if (input.paidAt !== undefined) {
      patch.paidAt = parseDate(input.paidAt, "paidAt")!;
    }
    return paymentRepository.update(id, patch);
  },

  async delete(id: number) {
    await this.get(id);
    await paymentRepository.delete(id);
  },

  async monthlySummary(opts: { from?: unknown; to?: unknown }) {
    const to = parseDate(opts.to, "to", true) ?? new Date();
    const fallbackFrom = new Date(to);
    fallbackFrom.setMonth(fallbackFrom.getMonth() - 11);
    fallbackFrom.setDate(1);
    fallbackFrom.setHours(0, 0, 0, 0);
    const from = parseDate(opts.from, "from", true) ?? fallbackFrom;

    const payments = await prisma.payment.findMany({
      where: { paidAt: { gte: from, lte: to } },
      orderBy: { paidAt: "asc" },
      select: { amount: true, method: true, paidAt: true },
    });

    type Bucket = {
      month: string; // YYYY-MM
      total: Prisma.Decimal;
      count: number;
      byMethod: Record<PaymentMethod, Prisma.Decimal>;
    };
    const buckets = new Map<string, Bucket>();

    function key(d: Date) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      return `${y}-${m}`;
    }

    function ensure(month: string): Bucket {
      let b = buckets.get(month);
      if (!b) {
        b = {
          month,
          total: new Prisma.Decimal(0),
          count: 0,
          byMethod: {
            CASH: new Prisma.Decimal(0),
            BANK: new Prisma.Decimal(0),
            MPESA: new Prisma.Decimal(0),
          },
        };
        buckets.set(month, b);
      }
      return b;
    }

    // Pre-seed empty months across the requested window for a contiguous chart/table.
    const cursor = new Date(from);
    cursor.setDate(1);
    while (cursor <= to) {
      ensure(key(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    for (const p of payments) {
      const b = ensure(key(p.paidAt));
      b.total = b.total.add(p.amount);
      b.count += 1;
      b.byMethod[p.method] = b.byMethod[p.method].add(p.amount);
    }

    return Array.from(buckets.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((b) => ({
        month: b.month,
        total: b.total.toFixed(2),
        count: b.count,
        byMethod: {
          CASH: b.byMethod.CASH.toFixed(2),
          BANK: b.byMethod.BANK.toFixed(2),
          MPESA: b.byMethod.MPESA.toFixed(2),
        },
      }));
  },

  async forTenant(tenantId: number) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { leases: true },
    });
    if (!tenant) throw new AppError("tenant not found", 404);

    const payments = await paymentRepository.list({ tenantId });

    const leaseFinancials = await Promise.all(
      tenant.leases.map(async (l) => {
        const sum = await paymentRepository.sumForLease(l.id);
        const fin: LeaseFinancials = computeLeaseFinancials({
          status: l.status,
          startDate: l.startDate,
          endDate: l.endDate,
          monthlyRent: l.monthlyRent,
          paid: sum._sum.amount,
        });
        return { leaseId: l.id, status: l.status, unitId: l.unitId, ...fin };
      })
    );

    const totalBilled = leaseFinancials.reduce(
      (acc, l) => acc.add(l.totalBilled),
      new Prisma.Decimal(0)
    );
    const totalPaid = leaseFinancials.reduce(
      (acc, l) => acc.add(l.totalPaid),
      new Prisma.Decimal(0)
    );
    const outstanding = totalBilled.sub(totalPaid);

    return {
      payments,
      leases: leaseFinancials,
      summary: {
        totalBilled: totalBilled.toFixed(2),
        totalPaid: totalPaid.toFixed(2),
        outstanding: outstanding.toFixed(2),
      },
    };
  },
};
