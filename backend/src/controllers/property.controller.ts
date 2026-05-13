import type { Request, Response } from "express";
import { propertyService } from "../services/property.service";
import { ApiResponse } from "../utils/ApiResponse";
import { AppError } from "../utils/AppError";

function parseId(value: string, label = "id"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new AppError(`invalid ${label}`, 400);
  return n;
}

export const propertyController = {
  async list(_req: Request, res: Response) {
    const items = await propertyService.list();
    res.status(200).json(ApiResponse.success(items));
  },

  async get(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const item = await propertyService.get(id);
    res.status(200).json(ApiResponse.success(item));
  },

  async create(req: Request, res: Response) {
    const { name, location, description } = req.body ?? {};
    const item = await propertyService.create({ name, location, description });
    res.status(201).json(ApiResponse.success(item, "property created"));
  },

  async update(req: Request, res: Response) {
    const id = parseId(req.params.id);
    const { name, location, description } = req.body ?? {};
    const item = await propertyService.update(id, { name, location, description });
    res.status(200).json(ApiResponse.success(item, "property updated"));
  },

  async remove(req: Request, res: Response) {
    const id = parseId(req.params.id);
    await propertyService.delete(id);
    res.status(200).json(ApiResponse.success(null, "property deleted"));
  },
};
