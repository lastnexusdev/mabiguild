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
      subdomain: "demo",
      description: "A seeded demo tenant.",
      bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200"
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

  await prisma.menu.createMany({
    data: [
      { siteId: demoSite.id, label: "Home", url: "/", position: 0 },
      { siteId: demoSite.id, label: "About", url: "/p/about", position: 1 }
    ],
    skipDuplicates: true
  });

  await prisma.page.upsert({
    where: { siteId_slug: { siteId: demoSite.id, slug: "about" } },
    update: {},
    create: {
      siteId: demoSite.id,
      title: "About",
      slug: "about",
      content: "# About Demo Community\n\nThis is a seeded markdown page.",
      isPublished: true
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
