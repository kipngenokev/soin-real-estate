import { api } from "../api";
import type {
  ApiEnvelope,
  MonthlySummary,
  Payment,
  PaymentMethod,
  TenantPaymentsView,
} from "../types";

export type CreatePaymentInput = {
  leaseId: number;
  amount: number | string;
  method: PaymentMethod;
  reference?: string | null;
  note?: string | null;
  paidAt?: string;
};

export type PaymentFilter = {
  method?: PaymentMethod;
  leaseId?: number;
  tenantId?: number;
  from?: string;
  to?: string;
};

export const paymentsApi = {
  async list(filter: PaymentFilter = {}): Promise<Payment[]> {
    const { data } = await api.get<ApiEnvelope<Payment[]>>("/payments", { params: filter });
    return data.data;
  },

  async summary(filter: { from?: string; to?: string } = {}): Promise<MonthlySummary[]> {
    const { data } = await api.get<ApiEnvelope<MonthlySummary[]>>("/payments/summary", {
      params: filter,
    });
    return data.data;
  },

  async create(input: CreatePaymentInput): Promise<Payment> {
    const { data } = await api.post<ApiEnvelope<Payment>>("/payments", input);
    return data.data;
  },

  async update(id: number, input: Partial<CreatePaymentInput>): Promise<Payment> {
    const { data } = await api.put<ApiEnvelope<Payment>>(`/payments/${id}`, input);
    return data.data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/payments/${id}`);
  },

  async forTenant(tenantId: number): Promise<TenantPaymentsView> {
    const { data } = await api.get<ApiEnvelope<TenantPaymentsView>>(
      `/tenants/${tenantId}/payments`
    );
    return data.data;
  },
};
