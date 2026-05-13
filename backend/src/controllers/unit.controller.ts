import type { Request, Response } from "express";
import { unitService } from "../services/unit.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AppError } from "../utils/AppError";

function parseId(value: string, label = "id"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`invalid ${label}`, 400);
  return n;
}

export const unitController = {
  async listForProperty(req: Request, res: Response) {
    const propertyId = parseId(req.params.propertyId, "propertyId");
    const items = await unitService.listForProperty(propertyId);
    res.status(200).json(ApiResponse.success(items));
  },

  async create(req: Request, res: Response) {
    const propertyId = parseId(req.params.propertyId, "propertyId");
    const { label, type, rentAmount, status } = req.body ?? {};
    const item = await unitService.create(propertyId, { label, type, rentAmount, status });
    res.status(201).json(ApiResponse.success(item, "unit created"));
  },

  async get(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const item = await unitService.get(id);
    res.status(200).json(ApiResponse.success(item));
  },

  async update(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const { label, type, rentAmount, status } = req.body ?? {};
    const item = await unitService.update(id, { label, type, rentAmount, status });
    res.status(200).json(ApiResponse.success(item, "unit updated"));
  },

  async setStatus(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const { status } = req.body ?? {};
    const item = await unitService.setStatus(id, status);
    res.status(200).json(ApiResponse.success(item, "unit status updated"));
  },

  async remove(req: Request, res: Response) {
    const id = parseId(req.params.id);
    await unitService.delete(id);
    res.status(200).json(ApiResponse.success(null, "unit deleted"));
  },
};
