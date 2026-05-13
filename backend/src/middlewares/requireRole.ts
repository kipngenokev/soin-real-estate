import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
import { AppError } from "../utils/AppError";

export const requireRole = (...allowed: Role[]): RequestHandler => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError("authentication required", 401));
    }
    if (!allowed.includes(req.user.role)) {
      return next(new AppError("forbidden: insufficient role", 403));
    }
    return next();
  };
};
