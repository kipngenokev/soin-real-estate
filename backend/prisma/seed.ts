import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@soinsync.local";
  const password = process.env.ADMIN_PASSWORD ?? "ChangeMe!123";
  const fullName = process.env.ADMIN_NAME ?? "Soinsync Admin";

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      fullName,
      role: Role.ADMIN,
    },
  });

  console.log(`Admin ready: ${admin.email} (id=${admin.id})`);
  console.log(`Login with: ${email} / ${password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
