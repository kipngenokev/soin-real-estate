import type { Request, Response } from "express";
import { paymentService } from "../services/payment.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AppError } from "../utils/AppError";

function parseId(value: string, label = "id"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`invalid ${label}`, 400);
  return n;
}

export const paymentController = {
  async list(req: Request, res: Response) {
    const items = await paymentService.list({
      method: req.query.method,
      leaseId: req.query.leaseId,
      tenantId: req.query.tenantId,
      from: req.query.from,
      to: req.query.to,
    });
    res.status(200).json(ApiResponse.success(items));
  },

  async summary(req: Request, res: Response) {
    const items = await paymentService.monthlySummary({
      from: req.query.from,
      to: req.query.to,
    });
    res.status(200).json(ApiResponse.success(items));
  },

  async get(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const item = await paymentService.get(id);
    res.status(200).json(ApiResponse.success(item));
  },

  async create(req: Request, res: Response) {
    const { leaseId, amount, method, reference, note, paidAt } = req.body ?? {};
    const item = await paymentService.create({
      leaseId: Number(leaseId),
      amount,
      method,
      reference,
      note,
      paidAt,
    });
    res.status(201).json(ApiResponse.success(item, "payment recorded"));
  },

  async update(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const { amount, method, reference, note, paidAt } = req.body ?? {};
    const item = await paymentService.update(id, { amount, method, reference, note, paidAt });
    res.status(200).json(ApiResponse.success(item, "payment updated"));
  },

  async remove(req: Request, res: Response) {
    const id = parseId(req.params.id);
    await paymentService.delete(id);
    res.status(200).json(ApiResponse.success(null, "payment deleted"));
  },

  async forTenant(req: Request, res: Response) {
    const tenantId = parseId(req.params.id, "tenantId");
    const result = await paymentService.forTenant(tenantId);
    res.status(200).json(ApiResponse.success(result));
  },
};
