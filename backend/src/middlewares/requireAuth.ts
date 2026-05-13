import type { RequestHandler } from "express";
import { tokens } from "../utils/jwt";
import { authCookies } from "../utils/cookies";
import { AppError } from "../utils/AppError";

export const requireAuth: RequestHandler = (req, _res, next) => {
  const cookieToken = req.cookies?.[authCookies.names.access];
  const header = req.headers.authorization;
  const bearer = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  const token = cookieToken ?? bearer;

  if (!token) {
    return next(new AppError("authentication required", 401));
  }

  try {
    const payload = tokens.verifyAccess(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch {
    return next(new AppError("invalid or expired access token", 401));
  }
};
