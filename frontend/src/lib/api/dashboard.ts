import { api } from "../api";
import type { ApiEnvelope } from "../types";

export type DashboardStats = {
  properties: number;
  units: { total: number; occupied: number; available: number };
  occupancyRate: number;
  activeLeases: number;
  payments: { count: number; totalAmount: string };
  openIssues: number;
};

export const dashboardApi = {
  async stats(): Promise<DashboardStats> {
    const { data } = await api.get<ApiEnvelope<DashboardStats>>("/admin/stats");
    return data.data;
  },
};
