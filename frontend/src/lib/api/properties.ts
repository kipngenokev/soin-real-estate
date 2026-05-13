import { api } from "../api";
import type { ApiEnvelope, Property } from "../types";

export type PropertyInput = {
  name: string;
  location: string;
  description?: string | null;
};

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

  async update(id: number, input: PropertyInput): Promise<Property> {
    const { data } = await api.put<ApiEnvelope<Property>>(`/properties/${id}`, input);
    return data.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/properties/${id}`);
  },
};
