import { api } from "../api";
import type { ApiEnvelope, Issue, IssueStatus } from "../types";

export const issuesApi = {
  // Admin
  async list(filter: { status?: IssueStatus } = {}): Promise<Issue[]> {
    const { data } = await api.get<ApiEnvelope<Issue[]>>("/issues", { params: filter });
    return data.data;
  },

  async resolve(id: number): Promise<Issue> {
    const { data } = await api.post<ApiEnvelope<Issue>>(`/issues/${id}/resolve`);
    return data.data;
  },

  // Tenant portal
  async listMine(): Promise<Issue[]> {
    const { data } = await api.get<ApiEnvelope<Issue[]>>("/portal/issues");
    return data.data;
  },

  async createMine(input: { title: string; description: string }): Promise<Issue> {
    const { data } = await api.post<ApiEnvelope<Issue>>("/portal/issues", input);
    return data.data;
  },
};
