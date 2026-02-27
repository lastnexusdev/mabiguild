import { PrismaClient, PermissionKey } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  for (const key of Object.values(PermissionKey)) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key }
    });
  }

  const passwordHash = await bcrypt.hash("password123", 12);
  const user = await prisma.user.upsert({
    where: { email: "owner@example.com" },
    update: {},
    create: {
      email: "owner@example.com",
      username: "owner",
      passwordHash
    }
  });

  const site = await prisma.site.upsert({
    where: { subdomain: "demo" },
    update: {},
    create: {
      name: "Demo Guild",
      subdomain: "demo",
      description: "Seeded demo community"
    }
  });

  await prisma.siteMembership.upsert({
    where: { userId_siteId: { userId: user.id, siteId: site.id } },
    update: { role: "OWNER" },
    create: { userId: user.id, siteId: site.id, role: "OWNER", bio: "Site owner" }
  });
}

main().finally(() => prisma.$disconnect());
