import { Prisma } from "@prisma/client";
import { propertyRepository } from "../repositories/property.repository";
import { AppError } from "../utils/AppError";

export type CreatePropertyInput = {
  name: string;
  location: string;
  description?: string | null;
};

export type UpdatePropertyInput = Partial<CreatePropertyInput>;

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

export const propertyService = {
  list() {
    return propertyRepository.findAll();
  },

  async get(id: number) {
    const property = await propertyRepository.findById(id);
    if (!property) throw new AppError("property not found", 404);
    return property;
  },

  create(input: CreatePropertyInput) {
    const data = normalizeCreate(input);
    return propertyRepository.create(data);
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
