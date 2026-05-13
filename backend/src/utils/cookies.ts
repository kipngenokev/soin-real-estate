import type { Response } from "express";
import { env } from "../config/env";

const ACCESS_COOKIE = "access_token";
const REFRESH_COOKIE = "refresh_token";

const baseOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.isProd,
  path: "/",
};

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000; // 15 min
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const authCookies = {
  names: { access: ACCESS_COOKIE, refresh: REFRESH_COOKIE },

  setAccess(res: Response, token: string) {
    res.cookie(ACCESS_COOKIE, token, {
      ...baseOptions,
      maxAge: ACCESS_MAX_AGE_MS,
    });
  },

  setRefresh(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      ...baseOptions,
      maxAge: REFRESH_MAX_AGE_MS,
    });
  },

  clearAll(res: Response) {
    res.clearCookie(ACCESS_COOKIE, baseOptions);
    res.clearCookie(REFRESH_COOKIE, baseOptions);
  },
};
