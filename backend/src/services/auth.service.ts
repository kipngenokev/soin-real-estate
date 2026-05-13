import { Role } from "@prisma/client";
import { userRepository } from "../repositories/user.repository";
import { password } from "../utils/password";
import { tokens } from "../utils/jwt";
import { AppError } from "../utils/AppError";

export type AuthenticatedUser = {
  id: number;
  email: string;
  fullName: string;
  role: Role;
};

const toAuthUser = (u: {
  id: number;
  email: string;
  fullName: string;
  role: Role;
}): AuthenticatedUser => ({
  id: u.id,
  email: u.email,
  fullName: u.fullName,
  role: u.role,
});

export const authService = {
  async register(input: {
    email: string;
    password: string;
    fullName: string;
    role?: Role;
  }): Promise<AuthenticatedUser> {
    const email = input.email.trim().toLowerCase();
    if (!email || !input.password || !input.fullName?.trim()) {
      throw new AppError("email, password and fullName are required", 400);
    }
    if (input.password.length < 8) {
      throw new AppError("password must be at least 8 characters", 400);
    }

    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new AppError("email is already registered", 409);
    }

    const hash = await password.hash(input.password);
    const user = await userRepository.create({
      email,
      passwordHash: hash,
      fullName: input.fullName.trim(),
      role: input.role ?? Role.TENANT,
    });

    return toAuthUser(user);
  },

  async login(input: {
    email: string;
    password: string;
  }): Promise<{ user: AuthenticatedUser; accessToken: string; refreshToken: string }> {
    const email = input.email?.trim().toLowerCase();
    if (!email || !input.password) {
      throw new AppError("email and password are required", 400);
    }

    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      throw new AppError("invalid credentials", 401);
    }

    const ok = await password.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new AppError("invalid credentials", 401);
    }

    const accessToken = tokens.signAccess({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = tokens.signRefresh({ sub: user.id });

    return { user: toAuthUser(user), accessToken, refreshToken };
  },

  async refresh(refreshToken: string): Promise<{
    user: AuthenticatedUser;
    accessToken: string;
    refreshToken: string;
  }> {
    let payload;
    try {
      payload = tokens.verifyRefresh(refreshToken);
    } catch {
      throw new AppError("invalid or expired refresh token", 401);
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new AppError("user no longer exists", 401);
    }

    const newAccess = tokens.signAccess({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const newRefresh = tokens.signRefresh({ sub: user.id });

    return { user: toAuthUser(user), accessToken: newAccess, refreshToken: newRefresh };
  },

  async me(userId: number): Promise<AuthenticatedUser> {
    const user = await userRepository.findById(userId);
    if (!user || !user.isActive) {
      throw new AppError("user not found", 404);
    }
    return toAuthUser(user);
  },
};
