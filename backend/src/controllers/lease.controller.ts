import type { Request, Response } from "express";
import { leaseService } from "../services/lease.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AppError } from "../utils/AppError";

function parseId(value: string, label = "id"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`invalid ${label}`, 400);
  return n;
}

function parseOptionalId(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError("invalid id filter", 400);
  return n;
}

export const leaseController = {
  async list(req: Request, res: Response) {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const tenantId = parseOptionalId(req.query.tenantId);
    const unitId = parseOptionalId(req.query.unitId);
    const items = await leaseService.list({ status, tenantId, unitId });
    res.status(200).json(ApiResponse.success(items));
  },

  async get(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const item = await leaseService.get(id);
    res.status(200).json(ApiResponse.success(item));
  },

  async create(req: Request, res: Response) {
    const tenantId = Number(req.body?.tenantId);
    const unitId = Number(req.body?.unitId);
    const item = await leaseService.create({ tenantId, unitId });
    res.status(201).json(ApiResponse.success(item, "lease created"));
  },

  async activate(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const item = await leaseService.activate(id);
    res.status(200).json(ApiResponse.success(item, "lease activated"));
  },

  async end(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const item = await leaseService.end(id);
    res.status(200).json(ApiResponse.success(item, "lease ended"));
  },

  async remove(req: Request, res: Response) {
    const id = parseId(req.params.id);
    await leaseService.delete(id);
    res.status(200).json(ApiResponse.success(null, "lease deleted"));
  },
};
