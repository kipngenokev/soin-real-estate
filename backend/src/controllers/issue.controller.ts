import type { Request, Response } from "express";
import { issueService } from "../services/issue.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AppError } from "../utils/AppError";
import { prisma } from "../config/prisma";

function parseId(value: string, label = "id"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`invalid ${label}`, 400);
  return n;
}

export const issueController = {
  // Admin endpoints
  async list(req: Request, res: Response) {
    const items = await issueService.list({ status: req.query.status });
    res.status(200).json(ApiResponse.success(items));
  },

  async get(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const item = await issueService.get(id);
    res.status(200).json(ApiResponse.success(item));
  },

  async resolve(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const item = await issueService.resolve(id);
    res.status(200).json(ApiResponse.success(item, "issue resolved"));
  },

  // Tenant portal endpoints
  async listForMe(req: Request, res: Response) {
    if (!req.user) throw new AppError("authentication required", 401);
    const tenant = await prisma.tenant.findUnique({ where: { userId: req.user.id } });
    if (!tenant) throw new AppError("tenant profile not found", 404);
    const items = await issueService.listForTenant(tenant.id);
    res.status(200).json(ApiResponse.success(items));
  },

  async createForMe(req: Request, res: Response) {
    if (!req.user) throw new AppError("authentication required", 401);
    const { title, description } = req.body ?? {};
    const item = await issueService.createForUser(req.user.id, { title, description });
    res.status(201).json(ApiResponse.success(item, "issue created"));
  },
};
