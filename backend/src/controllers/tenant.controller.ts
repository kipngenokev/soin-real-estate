import type { Request, Response } from "express";
import { tenantService } from "../services/tenant.service";
import { leaseService } from "../services/lease.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AppError } from "../utils/AppError";

function parseId(value: string, label = "id"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`invalid ${label}`, 400);
  return n;
}

export const tenantController = {
  async list(req: Request, res: Response) {
    const q = typeof req.query.q === "string" ? req.query.q : undefined;
    const items = await tenantService.list(q);
    res.status(200).json(ApiResponse.success(items));
  },

  async get(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const item = await tenantService.get(id);
    res.status(200).json(ApiResponse.success(item));
  },

  async create(req: Request, res: Response) {
    const { email, fullName, password, phone, nationalId, emergencyContact, unitId } =
      req.body ?? {};
    const item = await tenantService.create({
      email,
      fullName,
      password,
      phone,
      nationalId,
      emergencyContact,
      unitId,
    });
    res.status(201).json(ApiResponse.success(item, "tenant created"));
  },

  async update(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const { fullName, phone, nationalId, emergencyContact } = req.body ?? {};
    const item = await tenantService.update(id, { fullName, phone, nationalId, emergencyContact });
    res.status(200).json(ApiResponse.success(item, "tenant updated"));
  },

  async remove(req: Request, res: Response) {
    const id = parseId(req.params.id);
    await tenantService.delete(id);
    res.status(200).json(ApiResponse.success(null, "tenant deleted"));
  },

  async assignLease(req: Request, res: Response) {
    const tenantId = parseId(req.params.id);
    const unitId = Number(req.body?.unitId);
    const lease = await leaseService.assign(tenantId, unitId);
    res.status(201).json(ApiResponse.success(lease, "lease created"));
  },

  async endLease(req: Request, res: Response) {
    const tenantId = parseId(req.params.id);
    const lease = await leaseService.endActiveForTenant(tenantId);
    res.status(200).json(ApiResponse.success(lease, "lease ended"));
  },
};
