import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { authCookies } from "../utils/cookies";
import { ApiResponse } from "../utils/ApiResponse";
import { AppError } from "../utils/AppError";

export const authController = {
  async register(req: Request, res: Response) {
    const { email, password, fullName, role } = req.body ?? {};
    const user = await authService.register({ email, password, fullName, role });
    res.status(201).json(ApiResponse.success(user, "user created"));
  },

  async login(req: Request, res: Response) {
    const { email, password } = req.body ?? {};
    const { user, accessToken, refreshToken } = await authService.login({ email, password });
    authCookies.setAccess(res, accessToken);
    authCookies.setRefresh(res, refreshToken);
    res.status(200).json(ApiResponse.success(user, "login successful"));
  },

  async refresh(req: Request, res: Response) {
    const token = req.cookies?.[authCookies.names.refresh];
    if (!token) throw new AppError("missing refresh token", 401);

    const { user, accessToken, refreshToken } = await authService.refresh(token);
    authCookies.setAccess(res, accessToken);
    authCookies.setRefresh(res, refreshToken);
    res.status(200).json(ApiResponse.success(user, "token refreshed"));
  },

  async logout(_req: Request, res: Response) {
    authCookies.clearAll(res);
    res.status(200).json(ApiResponse.success(null, "logged out"));
  },

  async me(req: Request, res: Response) {
    if (!req.user) throw new AppError("authentication required", 401);
    const user = await authService.me(req.user.id);
    res.status(200).json(ApiResponse.success(user));
  },
};
