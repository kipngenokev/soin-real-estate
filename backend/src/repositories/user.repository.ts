import type { Role, User } from "@prisma/client";
import { prisma } from "../config/prisma";

export const userRepository = {
  findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  },

  create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    role: Role;
  }): Promise<User> {
    return prisma.user.create({ data });
  },
};
