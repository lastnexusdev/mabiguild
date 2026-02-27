import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      username: "admin",
      passwordHash
    }
  });

  const demoSite = await prisma.site.upsert({
    where: { subdomain: "demo" },
    update: {},
    create: {
      name: "Demo Community",
      subdomain: "demo"
    }
  });

  await prisma.siteMembership.upsert({
    where: { userId_siteId: { userId: admin.id, siteId: demoSite.id } },
    update: { role: "OWNER" },
    create: {
      userId: admin.id,
      siteId: demoSite.id,
      role: "OWNER"
    }
  });

  await prisma.auditLog.create({
    data: {
      siteId: demoSite.id,
      actorUserId: admin.id,
      action: "seed.demo_site_created",
      metadata: { subdomain: demoSite.subdomain }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
