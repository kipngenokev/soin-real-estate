import { Prisma, type IssueStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

const detailInclude = {
  tenant: { include: { user: { select: { id: true, email: true, fullName: true } } } },
  unit: { include: { property: true } },
} as const;

export const issueRepository = {
  list(filter: { status?: IssueStatus; tenantId?: number } = {}) {
    const where: Prisma.IssueWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.tenantId) where.tenantId = filter.tenantId;
    return prisma.issue.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: detailInclude,
    });
  },

  findById(id: number) {
    return prisma.issue.findUnique({ where: { id }, include: detailInclude });
  },

  create(data: Prisma.IssueUncheckedCreateInput) {
    return prisma.issue.create({ data, include: detailInclude });
  },

  update(id: number, data: Prisma.IssueUncheckedUpdateInput) {
    return prisma.issue.update({ where: { id }, data, include: detailInclude });
  },
};

export const issueDetailInclude = detailInclude;
