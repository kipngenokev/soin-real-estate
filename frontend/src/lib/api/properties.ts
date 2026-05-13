import { api } from "../api";
import type { ApiEnvelope, Property, UnitType } from "../types";

export type UnitGroupInput = {
  type: UnitType;
  count: number;
  rentAmount: number;
};

export type PropertyInput = {
  name: string;
  location: string;
  description?: string | null;
  unitGroups?: UnitGroupInput[];
};

export type PropertyUpdateInput = Omit<PropertyInput, "unitGroups">;

export const propertiesApi = {
  async list(): Promise<Property[]> {
    const { data } = await api.get<ApiEnvelope<Property[]>>("/properties");
    return data.data;
  },

  async get(id: number): Promise<Property> {
    const { data } = await api.get<ApiEnvelope<Property>>(`/properties/${id}`);
    return data.data;
  },

  async create(input: PropertyInput): Promise<Property> {
    const { data } = await api.post<ApiEnvelope<Property>>("/properties", input);
    return data.data;
  },

  async update(id: number, input: PropertyUpdateInput): Promise<Property> {
    const { data } = await api.put<ApiEnvelope<Property>>(`/properties/${id}`, input);
    return data.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/properties/${id}`);
  },
};
