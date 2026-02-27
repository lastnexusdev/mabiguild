import { PrismaClient, WidgetType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { lastSeenAt: new Date() },
    create: { email: "admin@example.com", username: "admin", passwordHash, lastSeenAt: new Date() }
  });

  const demoSite = await prisma.site.upsert({
    where: { subdomain: "demo" },
    update: {},
    create: {
      name: "Demo Community",
      subdomain: "demo",
      description: "A seeded demo tenant.",
      bannerUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200",
      homepageIntro: "Welcome to the demo guild forums.",
      autoRankEnabled: true,
      rankThresholds: { member: 0, moderator: 20, admin: 100, owner: 300 }
    }
  });

  await prisma.siteMembership.upsert({
    where: { userId_siteId: { userId: admin.id, siteId: demoSite.id } },
    update: { role: "OWNER", bio: "Site founder", avatarUrl: "/uploads/default-avatar.svg" },
    create: { userId: admin.id, siteId: demoSite.id, role: "OWNER", bio: "Site founder", avatarUrl: "/uploads/default-avatar.svg" }
  });

  await prisma.menu.createMany({
    data: [
      { siteId: demoSite.id, label: "Home", url: "/", position: 0 },
      { siteId: demoSite.id, label: "Forums", url: "/forums", position: 1 },
      { siteId: demoSite.id, label: "Members", url: "/members", position: 2 },
      { siteId: demoSite.id, label: "About", url: "/p/about", position: 3 }
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

  const category = await prisma.forumCategory.upsert({
    where: { id: "seed-category" },
    update: {},
    create: { id: "seed-category", siteId: demoSite.id, name: "General", position: 0 }
  });

  const forum = await prisma.forum.upsert({
    where: { id: "seed-forum" },
    update: {},
    create: {
      id: "seed-forum",
      siteId: demoSite.id,
      categoryId: category.id,
      name: "Announcements",
      description: "Official site announcements",
      position: 0
    }
  });

  const thread = await prisma.thread.upsert({
    where: { id: "seed-thread" },
    update: {},
    create: { id: "seed-thread", siteId: demoSite.id, forumId: forum.id, authorId: admin.id, title: "Welcome to the forums" }
  });

  await prisma.post.upsert({
    where: { id: "seed-post" },
    update: {},
    create: { id: "seed-post", siteId: demoSite.id, threadId: thread.id, authorId: admin.id, body: "Introduce yourself here!" }
  });

  for (const [idx, widget] of ["RECENT_THREADS", "SHOUTBOX", "ONLINE_MEMBERS", "SITE_STATS"].entries()) {
    await prisma.widgetPlacement.upsert({
      where: { siteId_widget: { siteId: demoSite.id, widget: widget as WidgetType } },
      update: {},
      create: {
        siteId: demoSite.id,
        widget: widget as WidgetType,
        enabled: true,
        column: idx === 1 ? 1 : idx >= 2 ? 2 : 0,
        position: idx === 3 ? 1 : 0
      }
    });
  }

  await prisma.shoutMessage.create({
    data: { siteId: demoSite.id, userId: admin.id, body: "Welcome to the shoutbox!" }
  });
}

main().finally(async () => prisma.$disconnect());
