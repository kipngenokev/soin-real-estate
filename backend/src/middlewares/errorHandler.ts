import type { ErrorRequestHandler } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { AppError } from "../utils/AppError";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(ApiResponse.error(err.message));
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error("[errorHandler]", err);
    const message = err instanceof Error ? err.message : "Internal Server Error";
    res.status(500).json(ApiResponse.error(message));
    return;
  }

  res.status(500).json(ApiResponse.error("Internal Server Error"));
};
