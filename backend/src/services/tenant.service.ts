import { LeaseStatus, Prisma, Role, UnitStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { tenantRepository } from "../repositories/tenant.repository";
import { password } from "../utils/password";
import { AppError } from "../utils/AppError";

export type CreateTenantInput = {
  email: string;
  fullName: string;
  password: string;
  phone?: string | null;
  nationalId?: string | null;
  emergencyContact?: string | null;
  unitId?: number | null;
};

export type UpdateTenantInput = {
  fullName?: string;
  phone?: string | null;
  nationalId?: string | null;
  emergencyContact?: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function emptyToNull(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

export const tenantService = {
  list(query?: string) {
    const q = query?.trim();
    return tenantRepository.list(q && q.length > 0 ? q : undefined);
  },

  async get(id: number) {
    const tenant = await tenantRepository.findById(id);
    if (!tenant) throw new AppError("tenant not found", 404);
    return tenant;
  },

  async create(input: CreateTenantInput) {
    const email = normalizeEmail(input.email ?? "");
    const fullName = input.fullName?.trim();
    if (!email || !fullName || !input.password) {
      throw new AppError("email, fullName and password are required", 400);
    }
    if (input.password.length < 8) {
      throw new AppError("password must be at least 8 characters", 400);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError("email is already registered", 409);
    }
    const nationalId = emptyToNull(input.nationalId);
    if (nationalId) {
      const dup = await prisma.tenant.findUnique({ where: { nationalId } });
      if (dup) throw new AppError("nationalId is already in use", 409);
    }

    const unitId =
      input.unitId === undefined || input.unitId === null ? null : Number(input.unitId);
    if (unitId !== null && (!Number.isInteger(unitId) || unitId <= 0)) {
      throw new AppError("invalid unitId", 400);
    }

    const passwordHash = await password.hash(input.password);

    const tenant = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          role: Role.TENANT,
        },
      });
      const created = await tx.tenant.create({
        data: {
          userId: user.id,
          phone: emptyToNull(input.phone),
          nationalId,
          emergencyContact: emptyToNull(input.emergencyContact),
        },
      });

      if (unitId !== null) {
        const unit = await tx.unit.findUnique({ where: { id: unitId } });
        if (!unit) throw new AppError("unit not found", 404);
        if (unit.status !== UnitStatus.AVAILABLE) {
          throw new AppError("unit is not available", 409);
        }
        await tx.lease.create({
          data: {
            tenantId: created.id,
            unitId: unit.id,
            monthlyRent: unit.rentAmount,
            status: LeaseStatus.ACTIVE,
            startDate: new Date(),
          },
        });
        await tx.unit.update({
          where: { id: unit.id },
          data: { status: UnitStatus.OCCUPIED },
        });
      }

      return created;
    });

    return this.get(tenant.id);
  },

  async update(id: number, input: UpdateTenantInput) {
    const tenant = await this.get(id);

    const patch: Prisma.TenantUpdateInput = {};
    if (input.phone !== undefined) patch.phone = emptyToNull(input.phone);
    if (input.nationalId !== undefined) {
      const nationalId = emptyToNull(input.nationalId);
      if (nationalId && nationalId !== tenant.nationalId) {
        const dup = await prisma.tenant.findUnique({ where: { nationalId } });
        if (dup) throw new AppError("nationalId is already in use", 409);
      }
      patch.nationalId = nationalId;
    }
    if (input.emergencyContact !== undefined) {
      patch.emergencyContact = emptyToNull(input.emergencyContact);
    }

    if (input.fullName !== undefined) {
      const fullName = input.fullName?.trim();
      if (!fullName) throw new AppError("fullName cannot be empty", 400);
      patch.user = { update: { fullName } };
    }

    return tenantRepository.update(id, patch);
  },

  async delete(id: number) {
    const tenant = await this.get(id);

    await prisma.$transaction(async (tx) => {
      const activeLease = await tx.lease.findFirst({
        where: { tenantId: tenant.id, status: LeaseStatus.ACTIVE },
      });
      if (activeLease) {
        await tx.lease.update({
          where: { id: activeLease.id },
          data: { status: LeaseStatus.ENDED, endDate: new Date() },
        });
        await tx.unit.update({
          where: { id: activeLease.unitId },
          data: { status: UnitStatus.AVAILABLE },
        });
      }
      // Cascade: deleting the user removes the tenant + remaining leases.
      await tx.user.delete({ where: { id: tenant.userId } });
    });
  },
};
