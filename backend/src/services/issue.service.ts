import { IssueStatus, LeaseStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { issueRepository } from "../repositories/issue.repository";
import { AppError } from "../utils/AppError";

function assertStatus(value: unknown): IssueStatus {
  if (value === IssueStatus.OPEN || value === IssueStatus.RESOLVED) return value;
  throw new AppError(`status must be one of ${Object.values(IssueStatus).join(", ")}`, 400);
}

function parseOptionalStatus(value: unknown): IssueStatus | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  return assertStatus(value);
}

export type CreateIssueInput = {
  title: string;
  description: string;
};

export const issueService = {
  list(filter: { status?: unknown } = {}) {
    return issueRepository.list({ status: parseOptionalStatus(filter.status) });
  },

  listForTenant(tenantId: number) {
    return issueRepository.list({ tenantId });
  },

  async get(id: number) {
    const issue = await issueRepository.findById(id);
    if (!issue) throw new AppError("issue not found", 404);
    return issue;
  },

  async createForUser(userId: number, input: CreateIssueInput) {
    const title = input.title?.trim();
    const description = input.description?.trim();
    if (!title) throw new AppError("title is required", 400);
    if (!description) throw new AppError("description is required", 400);

    const tenant = await prisma.tenant.findUnique({ where: { userId } });
    if (!tenant) throw new AppError("tenant profile not found", 404);

    const activeLease = await prisma.lease.findFirst({
      where: { tenantId: tenant.id, status: LeaseStatus.ACTIVE },
    });
    if (!activeLease) {
      throw new AppError(
        "you must have an active lease to report an issue. Contact your administrator.",
        409
      );
    }

    return issueRepository.create({
      tenantId: tenant.id,
      unitId: activeLease.unitId,
      title,
      description,
    });
  },

  async resolve(id: number) {
    const issue = await this.get(id);
    if (issue.status === IssueStatus.RESOLVED) {
      throw new AppError("issue is already resolved", 409);
    }
    return issueRepository.update(id, {
      status: IssueStatus.RESOLVED,
      resolvedAt: new Date(),
    });
  },
};
