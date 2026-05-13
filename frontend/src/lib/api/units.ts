import { api } from "../api";
import type { ApiEnvelope, Unit, UnitStatus, UnitType, UnitWithProperty } from "../types";

export type UnitInput = {
  label: string;
  type: UnitType;
  rentAmount: number | string;
  status?: UnitStatus;
};

export const unitsApi = {
  async listAll(filter: { status?: UnitStatus } = {}): Promise<UnitWithProperty[]> {
    const { data } = await api.get<ApiEnvelope<UnitWithProperty[]>>("/units", {
      params: filter,
    });
    return data.data;
  },

  async listForProperty(propertyId: number): Promise<Unit[]> {
    const { data } = await api.get<ApiEnvelope<Unit[]>>(`/properties/${propertyId}/units`);
    return data.data;
  },

  async create(propertyId: number, input: UnitInput): Promise<Unit> {
    const { data } = await api.post<ApiEnvelope<Unit>>(
      `/properties/${propertyId}/units`,
      input
    );
    return data.data;
  },

  async update(id: number, input: UnitInput): Promise<Unit> {
    const { data } = await api.put<ApiEnvelope<Unit>>(`/units/${id}`, input);
    return data.data;
  },

  async setStatus(id: number, status: UnitStatus): Promise<Unit> {
    const { data } = await api.patch<ApiEnvelope<Unit>>(`/units/${id}/status`, { status });
    return data.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/units/${id}`);
  },
};
