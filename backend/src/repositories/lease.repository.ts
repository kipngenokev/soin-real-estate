import type { LeaseStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

const detailInclude = {
  tenant: { include: { user: { select: { id: true, email: true, fullName: true } } } },
  unit: { include: { property: true } },
} as const;

export const leaseRepository = {
  list(filter: { status?: LeaseStatus; tenantId?: number; unitId?: number }) {
    const where: Prisma.LeaseWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.tenantId) where.tenantId = filter.tenantId;
    if (filter.unitId) where.unitId = filter.unitId;

    return prisma.lease.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: detailInclude,
    });
  },

  findById(id: number) {
    return prisma.lease.findUnique({
      where: { id },
      include: detailInclude,
    });
  },
};

export const leaseDetailInclude = detailInclude;
