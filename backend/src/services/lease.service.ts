import { UnitStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

export const leaseService = {
  async assign(tenantId: number, unitId: number) {
    if (!Number.isInteger(unitId) || unitId <= 0) {
      throw new AppError("unitId is required", 400);
    }

    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new AppError("tenant not found", 404);

      const activeForTenant = await tx.lease.findFirst({
        where: { tenantId, endDate: null },
      });
      if (activeForTenant) {
        throw new AppError("tenant already has an active lease", 409);
      }

      const unit = await tx.unit.findUnique({ where: { id: unitId } });
      if (!unit) throw new AppError("unit not found", 404);
      if (unit.status !== UnitStatus.AVAILABLE) {
        throw new AppError("unit is not available", 409);
      }

      const lease = await tx.lease.create({
        data: {
          tenantId,
          unitId,
          monthlyRent: unit.rentAmount,
        },
        include: { unit: { include: { property: true } } },
      });

      await tx.unit.update({
        where: { id: unit.id },
        data: { status: UnitStatus.OCCUPIED },
      });

      return lease;
    });
  },

  async endActive(tenantId: number) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new AppError("tenant not found", 404);

      const active = await tx.lease.findFirst({
        where: { tenantId, endDate: null },
      });
      if (!active) throw new AppError("tenant has no active lease", 404);

      const ended = await tx.lease.update({
        where: { id: active.id },
        data: { endDate: new Date() },
        include: { unit: { include: { property: true } } },
      });

      await tx.unit.update({
        where: { id: active.unitId },
        data: { status: UnitStatus.AVAILABLE },
      });

      return ended;
    });
  },
};
