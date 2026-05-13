import { Prisma, UnitType } from "@prisma/client";
import { prisma } from "../config/prisma";
import { propertyRepository } from "../repositories/property.repository";
import { AppError } from "../utils/AppError";

export type UnitGroupInput = {
  type: UnitType | string;
  count: number | string;
  rentAmount: number | string;
};

export type CreatePropertyInput = {
  name: string;
  location: string;
  description?: string | null;
  unitGroups?: UnitGroupInput[];
};

export type UpdatePropertyInput = Partial<Omit<CreatePropertyInput, "unitGroups">>;

const LABEL_PREFIX: Record<UnitType, string> = {
  STUDIO: "S",
  ONE_BEDROOM: "B",
};

function normalizeCreate(input: CreatePropertyInput) {
  const name = input.name?.trim();
  const location = input.location?.trim();
  if (!name) throw new AppError("name is required", 400);
  if (!location) throw new AppError("location is required", 400);
  return {
    name,
    location,
    description: input.description?.toString().trim() || null,
  };
}

function assertUnitType(value: unknown): UnitType {
  if (value === UnitType.STUDIO || value === UnitType.ONE_BEDROOM) return value;
  throw new AppError(`type must be one of ${Object.values(UnitType).join(", ")}`, 400);
}

function parseCount(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  if (!Number.isInteger(n) || n < 0) {
    throw new AppError("count must be a non-negative integer", 400);
  }
  return n;
}

function parseRent(value: unknown): Prisma.Decimal {
  const n = typeof value === "string" ? Number(value) : (value as number);
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) {
    throw new AppError("rentAmount must be a non-negative number", 400);
  }
  return new Prisma.Decimal(n.toFixed(2));
}

function normalizeUnitGroups(groups: UnitGroupInput[] | undefined) {
  if (!groups || groups.length === 0) return [];
  const seen = new Set<UnitType>();
  const out: { type: UnitType; count: number; rentAmount: Prisma.Decimal }[] = [];
  for (const g of groups) {
    const type = assertUnitType(g.type);
    if (seen.has(type)) {
      throw new AppError(`duplicate unit group: ${type}`, 400);
    }
    seen.add(type);
    const count = parseCount(g.count);
    if (count === 0) continue;
    const rentAmount = parseRent(g.rentAmount);
    if (rentAmount.lte(0)) {
      throw new AppError(`rentAmount must be greater than 0 for ${type}`, 400);
    }
    out.push({ type, count, rentAmount });
  }
  return out;
}

export const propertyService = {
  list() {
    return propertyRepository.findAll();
  },

  async get(id: number) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new AppError("property not found", 404);
    return property;
  },

  async create(input: CreatePropertyInput) {
    const data = normalizeCreate(input);
    const groups = normalizeUnitGroups(input.unitGroups);

    if (groups.length === 0) {
      const created = await propertyRepository.create(data);
      return propertyRepository.findById(created.id);
    }

    const propertyId = await prisma.$transaction(async (tx) => {
      const property = await tx.property.create({ data });
      const unitRows = groups.flatMap((g) =>
        Array.from({ length: g.count }, (_, i) => ({
          propertyId: property.id,
          label: `${LABEL_PREFIX[g.type]}${i + 1}`,
          type: g.type,
          rentAmount: g.rentAmount,
        }))
      );
      if (unitRows.length > 0) {
        await tx.unit.createMany({ data: unitRows });
      }
      return property.id;
    });

    return propertyRepository.findById(propertyId);
  },

  async update(id: number, input: UpdatePropertyInput) {
    await this.get(id);
    const patch: Prisma.PropertyUpdateInput = {};
    if (input.name !== undefined) {
      const name = input.name?.trim();
      if (!name) throw new AppError("name cannot be empty", 400);
      patch.name = name;
    }
    if (input.location !== undefined) {
      const location = input.location?.trim();
      if (!location) throw new AppError("location cannot be empty", 400);
      patch.location = location;
    }
    if (input.description !== undefined) {
      patch.description = input.description?.toString().trim() || null;
    }
    return propertyRepository.update(id, patch);
  },

  async delete(id: number) {
    await this.get(id);
    await propertyRepository.delete(id);
  },
};
