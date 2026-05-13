import type { Prisma, Unit, UnitStatus } from "@prisma/client";
import { prisma } from "../config/prisma";

export const unitRepository = {
  findAll(filter: { status?: UnitStatus } = {}) {
    const where: Prisma.UnitWhereInput = {};
    if (filter.status) where.status = filter.status;
    return prisma.unit.findMany({
      where,
      orderBy: [{ propertyId: "asc" }, { label: "asc" }],
      include: { property: true },
    });
  },

  findByProperty(propertyId: number) {
    return prisma.unit.findMany({
      where: { propertyId },
      orderBy: [{ label: "asc" }],
    });
  },

  findById(id: number) {
    return prisma.unit.findUnique({ where: { id } });
  },

  create(data: Prisma.UnitUncheckedCreateInput): Promise<Unit> {
    return prisma.unit.create({ data });
  },

  update(id: number, data: Prisma.UnitUncheckedUpdateInput): Promise<Unit> {
    return prisma.unit.update({ where: { id }, data });
  },

  updateStatus(id: number, status: UnitStatus): Promise<Unit> {
    return prisma.unit.update({ where: { id }, data: { status } });
  },

  delete(id: number): Promise<Unit> {
    return prisma.unit.delete({ where: { id } });
  },
};
