import { api } from "../api";
import type { ApiEnvelope, LeaseWithUnit, Tenant } from "../types";

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

export const tenantsApi = {
  async list(q?: string): Promise<Tenant[]> {
    const { data } = await api.get<ApiEnvelope<Tenant[]>>("/tenants", {
      params: q ? { q } : undefined,
    });
    return data.data;
  },

  async get(id: number): Promise<Tenant> {
    const { data } = await api.get<ApiEnvelope<Tenant>>(`/tenants/${id}`);
    return data.data;
  },

  async create(input: CreateTenantInput): Promise<Tenant> {
    const { data } = await api.post<ApiEnvelope<Tenant>>("/tenants", input);
    return data.data;
  },

  async update(id: number, input: UpdateTenantInput): Promise<Tenant> {
    const { data } = await api.put<ApiEnvelope<Tenant>>(`/tenants/${id}`, input);
    return data.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/tenants/${id}`);
  },

  async assignLease(tenantId: number, unitId: number): Promise<LeaseWithUnit> {
    const { data } = await api.post<ApiEnvelope<LeaseWithUnit>>(`/tenants/${tenantId}/leases`, {
      unitId,
    });
    return data.data;
  },

  async endLease(tenantId: number): Promise<LeaseWithUnit> {
    const { data } = await api.post<ApiEnvelope<LeaseWithUnit>>(
      `/tenants/${tenantId}/leases/end`
    );
    return data.data;
  },
};
