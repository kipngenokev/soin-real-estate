import { Prisma, UnitStatus, UnitType } from "@prisma/client";
import { unitRepository } from "../repositories/unit.repository";
import { propertyRepository } from "../repositories/property.repository";
import { AppError } from "../utils/AppError";

export type CreateUnitInput = {
  label: string;
  type: UnitType | string;
  rentAmount: number | string;
  status?: UnitStatus | string;
};

export type UpdateUnitInput = Partial<CreateUnitInput>;

function assertUnitType(value: unknown): UnitType {
  if (value === UnitType.STUDIO || value === UnitType.ONE_BEDROOM) return value;
  throw new AppError(`type must be one of ${Object.values(UnitType).join(", ")}`, 400);
}

function assertUnitStatus(value: unknown): UnitStatus {
  if (value === UnitStatus.AVAILABLE || value === UnitStatus.OCCUPIED) return value;
  throw new AppError(`status must be one of ${Object.values(UnitStatus).join(", ")}`, 400);
}

function parseRent(value: unknown): Prisma.Decimal {
  const n = typeof value === "string" ? Number(value) : (value as number);
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) {
    throw new AppError("rentAmount must be a non-negative number", 400);
  }
  return new Prisma.Decimal(n.toFixed(2));
}

export const unitService = {
  list(filter: { status?: unknown } = {}) {
    const status = filter.status === undefined ? undefined : assertUnitStatus(filter.status);
    return unitRepository.findAll({ status });
  },

  async listForProperty(propertyId: number) {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new AppError("property not found", 404);
    return unitRepository.findByProperty(propertyId);
  },

  async get(id: number) {
    const unit = await unitRepository.findById(id);
    if (!unit) throw new AppError("unit not found", 404);
    return unit;
  },

  async create(propertyId: number, input: CreateUnitInput) {
    const property = await propertyRepository.findById(propertyId);
    if (!property) throw new AppError("property not found", 404);

    const label = input.label?.trim();
    if (!label) throw new AppError("label is required", 400);

    return unitRepository.create({
      propertyId,
      label,
      type: assertUnitType(input.type),
      rentAmount: parseRent(input.rentAmount),
      status: input.status ? assertUnitStatus(input.status) : UnitStatus.AVAILABLE,
    });
  },

  async update(id: number, input: UpdateUnitInput) {
    await this.get(id);
    const patch: Prisma.UnitUncheckedUpdateInput = {};
    if (input.label !== undefined) {
      const label = input.label?.trim();
      if (!label) throw new AppError("label cannot be empty", 400);
      patch.label = label;
    }
    if (input.type !== undefined) patch.type = assertUnitType(input.type);
    if (input.rentAmount !== undefined) patch.rentAmount = parseRent(input.rentAmount);
    if (input.status !== undefined) patch.status = assertUnitStatus(input.status);
    return unitRepository.update(id, patch);
  },

  async setStatus(id: number, status: unknown) {
    await this.get(id);
    return unitRepository.updateStatus(id, assertUnitStatus(status));
  },

  async delete(id: number) {
    await this.get(id);
    await unitRepository.delete(id);
  },
};
