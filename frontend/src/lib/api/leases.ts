import { api } from "../api";
import type { ApiEnvelope, LeaseDetail, LeaseStatus } from "../types";

export type CreateLeaseInput = {
  tenantId: number;
  unitId: number;
};

export const leasesApi = {
  async list(filter: {
    status?: LeaseStatus;
    tenantId?: number;
    unitId?: number;
  } = {}): Promise<LeaseDetail[]> {
    const { data } = await api.get<ApiEnvelope<LeaseDetail[]>>("/leases", {
      params: filter,
    });
    return data.data;
  },

  async get(id: number): Promise<LeaseDetail> {
    const { data } = await api.get<ApiEnvelope<LeaseDetail>>(`/leases/${id}`);
    return data.data;
  },

  async create(input: CreateLeaseInput): Promise<LeaseDetail> {
    const { data } = await api.post<ApiEnvelope<LeaseDetail>>("/leases", input);
    return data.data;
  },

  async activate(id: number): Promise<LeaseDetail> {
    const { data } = await api.post<ApiEnvelope<LeaseDetail>>(`/leases/${id}/activate`);
    return data.data;
  },

  async end(id: number): Promise<LeaseDetail> {
    const { data } = await api.post<ApiEnvelope<LeaseDetail>>(`/leases/${id}/end`);
    return data.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/leases/${id}`);
  },
};
