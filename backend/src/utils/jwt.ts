import jwt, { type SignOptions } from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "../config/env";

export type AccessTokenPayload = {
  sub: number;
  email: string;
  role: Role;
};

export type RefreshTokenPayload = {
  sub: number;
  tokenVersion?: number;
};

export const tokens = {
  signAccess(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.jwt.accessSecret, {
      expiresIn: env.jwt.accessTtl,
    } as SignOptions);
  },
  signRefresh(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, env.jwt.refreshSecret, {
      expiresIn: env.jwt.refreshTtl,
    } as SignOptions);
  },
  verifyAccess(token: string): AccessTokenPayload {
    return jwt.verify(token, env.jwt.accessSecret) as unknown as AccessTokenPayload;
  },
  verifyRefresh(token: string): RefreshTokenPayload {
    return jwt.verify(token, env.jwt.refreshSecret) as unknown as RefreshTokenPayload;
  },
};
