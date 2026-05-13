import { LeaseStatus, UnitStatus, type Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { leaseDetailInclude, leaseRepository } from "../repositories/lease.repository";

type Tx = Prisma.TransactionClient;

async function assertNoBlockingLease(tx: Tx, opts: { tenantId: number; unitId: number }) {
  const [tenantBlock, unitBlock] = await Promise.all([
    tx.lease.findFirst({
      where: { tenantId: opts.tenantId, status: { in: [LeaseStatus.DRAFT, LeaseStatus.ACTIVE] } },
    }),
    tx.lease.findFirst({
      where: { unitId: opts.unitId, status: { in: [LeaseStatus.DRAFT, LeaseStatus.ACTIVE] } },
    }),
  ]);
  if (tenantBlock) throw new AppError("tenant already has a draft or active lease", 409);
  if (unitBlock) throw new AppError("unit already has a draft or active lease", 409);
}

async function assertUnitActivatable(tx: Tx, unitId: number) {
  const unit = await tx.unit.findUnique({ where: { id: unitId } });
  if (!unit) throw new AppError("unit not found", 404);
  if (unit.status !== UnitStatus.AVAILABLE) {
    throw new AppError("unit is not available", 409);
  }
  return unit;
}

export const leaseService = {
  list(filter: {
    status?: string;
    tenantId?: number;
    unitId?: number;
  }) {
    let status: LeaseStatus | undefined;
    if (filter.status) {
      if (
        filter.status !== LeaseStatus.DRAFT &&
        filter.status !== LeaseStatus.ACTIVE &&
        filter.status !== LeaseStatus.ENDED
      ) {
        throw new AppError(`status must be one of ${Object.values(LeaseStatus).join(", ")}`, 400);
      }
      status = filter.status;
    }
    return leaseRepository.list({ status, tenantId: filter.tenantId, unitId: filter.unitId });
  },

  async get(id: number) {
    const lease = await leaseRepository.findById(id);
    if (!lease) throw new AppError("lease not found", 404);
    return lease;
  },

  async create(input: { tenantId: number; unitId: number }) {
    if (!Number.isInteger(input.tenantId) || input.tenantId <= 0) {
      throw new AppError("tenantId is required", 400);
    }
    if (!Number.isInteger(input.unitId) || input.unitId <= 0) {
      throw new AppError("unitId is required", 400);
    }

    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: input.tenantId } });
      if (!tenant) throw new AppError("tenant not found", 404);

      const unit = await tx.unit.findUnique({ where: { id: input.unitId } });
      if (!unit) throw new AppError("unit not found", 404);

      await assertNoBlockingLease(tx, { tenantId: input.tenantId, unitId: input.unitId });

      return tx.lease.create({
        data: {
          tenantId: input.tenantId,
          unitId: input.unitId,
          monthlyRent: unit.rentAmount,
          status: LeaseStatus.DRAFT,
        },
        include: leaseDetailInclude,
      });
    });
  },

  async activate(id: number) {
    return prisma.$transaction(async (tx) => {
      const lease = await tx.lease.findUnique({ where: { id } });
      if (!lease) throw new AppError("lease not found", 404);
      if (lease.status === LeaseStatus.ACTIVE) {
        throw new AppError("lease is already active", 409);
      }
      if (lease.status === LeaseStatus.ENDED) {
        throw new AppError("ended leases cannot be reactivated", 409);
      }

      // Re-check the unit hasn't been taken since this draft was made.
      const conflictingActive = await tx.lease.findFirst({
        where: {
          unitId: lease.unitId,
          status: LeaseStatus.ACTIVE,
          NOT: { id: lease.id },
        },
      });
      if (conflictingActive) {
        throw new AppError("unit already has an active lease", 409);
      }
      await assertUnitActivatable(tx, lease.unitId);

      const activated = await tx.lease.update({
        where: { id: lease.id },
        data: { status: LeaseStatus.ACTIVE, startDate: new Date() },
        include: leaseDetailInclude,
      });

      await tx.unit.update({
        where: { id: lease.unitId },
        data: { status: UnitStatus.OCCUPIED },
      });

      return activated;
    });
  },

  async end(id: number) {
    return prisma.$transaction(async (tx) => {
      const lease = await tx.lease.findUnique({ where: { id } });
      if (!lease) throw new AppError("lease not found", 404);
      if (lease.status === LeaseStatus.ENDED) {
        throw new AppError("lease is already ended", 409);
      }

      const wasActive = lease.status === LeaseStatus.ACTIVE;

      const ended = await tx.lease.update({
        where: { id: lease.id },
        data: { status: LeaseStatus.ENDED, endDate: new Date() },
        include: leaseDetailInclude,
      });

      if (wasActive) {
        await tx.unit.update({
          where: { id: lease.unitId },
          data: { status: UnitStatus.AVAILABLE },
        });
      }

      return ended;
    });
  },

  async delete(id: number) {
    const lease = await this.get(id);
    if (lease.status !== LeaseStatus.DRAFT) {
      throw new AppError("only DRAFT leases can be deleted", 409);
    }
    await prisma.lease.delete({ where: { id } });
  },

  // Shortcut used by tenant-detail "assign to unit": create + activate atomically.
  async assign(tenantId: number, unitId: number) {
    if (!Number.isInteger(unitId) || unitId <= 0) {
      throw new AppError("unitId is required", 400);
    }

    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new AppError("tenant not found", 404);

      await assertNoBlockingLease(tx, { tenantId, unitId });
      const unit = await assertUnitActivatable(tx, unitId);

      const lease = await tx.lease.create({
        data: {
          tenantId,
          unitId,
          monthlyRent: unit.rentAmount,
          status: LeaseStatus.ACTIVE,
          startDate: new Date(),
        },
        include: leaseDetailInclude,
      });

      await tx.unit.update({
        where: { id: unit.id },
        data: { status: UnitStatus.OCCUPIED },
      });

      return lease;
    });
  },

  // Used by tenant-detail "end lease": ends the tenant's active lease if any.
  async endActiveForTenant(tenantId: number) {
    return prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new AppError("tenant not found", 404);

      const active = await tx.lease.findFirst({
        where: { tenantId, status: LeaseStatus.ACTIVE },
      });
      if (!active) throw new AppError("tenant has no active lease", 404);

      const ended = await tx.lease.update({
        where: { id: active.id },
        data: { status: LeaseStatus.ENDED, endDate: new Date() },
        include: leaseDetailInclude,
      });

      await tx.unit.update({
        where: { id: active.unitId },
        data: { status: UnitStatus.AVAILABLE },
      });

      return ended;
    });
  },
};
