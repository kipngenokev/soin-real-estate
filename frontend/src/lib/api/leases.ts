import { api } from "../api";
import type { ApiEnvelope, LeaseDetail, LeaseStatus } from "../types";

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

  async end(id: number): Promise<LeaseDetail> {
    const { data } = await api.post<ApiEnvelope<LeaseDetail>>(`/leases/${id}/end`);
    return data.data;
  },
};
