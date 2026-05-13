import type { Request, Response } from "express";
import { dashboardService } from "../services/dashboard.service";
import { ApiResponse } from "../utils/ApiResponse";

export const dashboardController = {
  async stats(_req: Request, res: Response) {
    const data = await dashboardService.getStats();
    res.status(200).json(ApiResponse.success(data));
  },
};
