import type { Prisma, Property } from "@prisma/client";
import { prisma } from "../config/prisma";

export const propertyRepository = {
  findAll() {
    return prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { units: true } } },
    });
  },

  findById(id: number) {
    return prisma.property.findUnique({
      where: { id },
      include: { _count: { select: { units: true } } },
    });
  },

  create(data: Prisma.PropertyCreateInput): Promise<Property> {
    return prisma.property.create({ data });
  },

  update(id: number, data: Prisma.PropertyUpdateInput): Promise<Property> {
    return prisma.property.update({ where: { id }, data });
  },

  delete(id: number): Promise<Property> {
    return prisma.property.delete({ where: { id } });
  },
};
