import type { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

const userSafeSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

const detailInclude = {
  user: { select: userSafeSelect },
  leases: {
    where: { endDate: null },
    take: 1,
    include: {
      unit: { include: { property: true } },
    },
  },
} as const;

export const tenantRepository = {
  list(q?: string) {
    const where: Prisma.TenantWhereInput = q
      ? {
          OR: [
            { phone: { contains: q } },
            { nationalId: { contains: q } },
            { user: { is: { email: { contains: q } } } },
            { user: { is: { fullName: { contains: q } } } },
          ],
        }
      : {};

    return prisma.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: detailInclude,
    });
  },

  findById(id: number) {
    return prisma.tenant.findUnique({
      where: { id },
      include: detailInclude,
    });
  },

  findByUserId(userId: number) {
    return prisma.tenant.findUnique({ where: { userId } });
  },

  update(id: number, data: Prisma.TenantUpdateInput) {
    return prisma.tenant.update({
      where: { id },
      data,
      include: detailInclude,
    });
  },
};
