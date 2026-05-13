import { Prisma, type PaymentMethod } from "@prisma/client";
import { prisma } from "../config/prisma";

const detailInclude = {
  lease: {
    include: {
      tenant: { include: { user: { select: { id: true, email: true, fullName: true } } } },
      unit: { include: { property: true } },
    },
  },
} as const;

export type PaymentListFilter = {
  method?: PaymentMethod;
  leaseId?: number;
  tenantId?: number;
  from?: Date;
  to?: Date;
};

export const paymentRepository = {
  list(filter: PaymentListFilter) {
    const where: Prisma.PaymentWhereInput = {};
    if (filter.method) where.method = filter.method;
    if (filter.leaseId) where.leaseId = filter.leaseId;
    if (filter.tenantId) where.lease = { is: { tenantId: filter.tenantId } };
    if (filter.from || filter.to) {
      where.paidAt = {};
      if (filter.from) where.paidAt.gte = filter.from;
      if (filter.to) where.paidAt.lte = filter.to;
    }

    return prisma.payment.findMany({
      where,
      orderBy: { paidAt: "desc" },
      include: detailInclude,
    });
  },

  findById(id: number) {
    return prisma.payment.findUnique({
      where: { id },
      include: detailInclude,
    });
  },

  create(data: Prisma.PaymentUncheckedCreateInput) {
    return prisma.payment.create({ data, include: detailInclude });
  },

  update(id: number, data: Prisma.PaymentUncheckedUpdateInput) {
    return prisma.payment.update({ where: { id }, data, include: detailInclude });
  },

  delete(id: number) {
    return prisma.payment.delete({ where: { id } });
  },

  sumForLease(leaseId: number) {
    return prisma.payment.aggregate({
      where: { leaseId },
      _sum: { amount: true },
    });
  },
};

export const paymentDetailInclude = detailInclude;
