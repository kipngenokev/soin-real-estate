import type { RequestHandler } from "express";
import { ApiResponse } from "../utils/ApiResponse";

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json(ApiResponse.error(`Route not found: ${req.method} ${req.originalUrl}`));
};
