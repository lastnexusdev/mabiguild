import { PrismaClient, MembershipRole, PermissionKey, PageStatus } from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

export async function seed() {
  console.log("🌱 Seeding database...");

  // Create global admin user
  const adminHash = await hash("admin1234");
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      username: "admin",
      displayName: "Platform Admin",
      passwordHash: adminHash,
      isGlobalAdmin: true,
    },
  });
  console.log("✅ Admin user created:", admin.username);

  // Create a demo user
  const demoHash = await hash("demo1234");
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      username: "demouser",
      displayName: "Demo User",
      passwordHash: demoHash,
    },
  });
  console.log("✅ Demo user created:", demoUser.username);

  // Create a demo site
  const site = await prisma.site.upsert({
    where: { subdomain: "demoguild" },
    update: {},
    create: {
      subdomain: "demoguild",
      name: "Demo Guild",
      description: "A demonstration community site.",
      ownerId: admin.id,
      theme: "dark",
    },
  });
  console.log("✅ Demo site created:", site.subdomain);

  // Owner membership for admin
  const adminMembership = await prisma.siteMembership.upsert({
    where: { userId_siteId: { userId: admin.id, siteId: site.id } },
    update: {},
    create: {
      userId: admin.id,
      siteId: site.id,
      role: MembershipRole.OWNER,
    },
  });

  // Member membership for demo user
  const demoMembership = await prisma.siteMembership.upsert({
    where: { userId_siteId: { userId: demoUser.id, siteId: site.id } },
    update: {},
    create: {
      userId: demoUser.id,
      siteId: site.id,
      role: MembershipRole.MEMBER,
    },
  });

  console.log("✅ Memberships created");

  // Create default roles
  const memberRole = await prisma.siteRole.upsert({
    where: { siteId_name: { siteId: site.id, name: "Member" } },
    update: {},
    create: {
      siteId: site.id,
      name: "Member",
      color: "#888888",
      isDefault: true,
      sortOrder: 0,
    },
  });

  const modRole = await prisma.siteRole.upsert({
    where: { siteId_name: { siteId: site.id, name: "Moderator" } },
    update: {},
    create: {
      siteId: site.id,
      name: "Moderator",
      color: "#22c55e",
      sortOrder: 1,
    },
  });

  // Mod permissions
  const modPerms: PermissionKey[] = [
    PermissionKey.moderate_posts,
    PermissionKey.manage_shoutbox,
  ];
  for (const perm of modPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permission: { roleId: modRole.id, permission: perm } },
      update: {},
      create: { roleId: modRole.id, permission: perm },
    });
  }

  console.log("✅ Roles created");

  // Assign member role to demo user
  await prisma.userSiteRole.upsert({
    where: { membershipId_roleId: { membershipId: demoMembership.id, roleId: memberRole.id } },
    update: {},
    create: { membershipId: demoMembership.id, roleId: memberRole.id },
  });

  // Primary menu
  const menu = await prisma.menu.upsert({
    where: { siteId_location: { siteId: site.id, location: "primary" } },
    update: {},
    create: {
      siteId: site.id,
      name: "Primary",
      location: "primary",
    },
  });

  const menuItems = [
    { label: "Home", url: "/", sortOrder: 0 },
    { label: "Forums", url: "/forums", sortOrder: 1 },
    { label: "Members", url: "/members", sortOrder: 2 },
  ];

  for (const item of menuItems) {
    const existing = await prisma.menuItem.findFirst({
      where: { menuId: menu.id, label: item.label },
    });
    if (!existing) {
      await prisma.menuItem.create({
        data: { siteId: site.id, menuId: menu.id, ...item },
      });
    }
  }

  console.log("✅ Menu created");

  // Widgets
  const widgetData = [
    { widgetType: "shoutbox", column: 1, sortOrder: 0 },
    { widgetType: "recent_threads", column: 2, sortOrder: 0 },
    { widgetType: "members_online", column: 3, sortOrder: 0 },
  ];

  for (const w of widgetData) {
    const existing = await prisma.widgetPlacement.findFirst({
      where: { siteId: site.id, widgetType: w.widgetType },
    });
    if (!existing) {
      await prisma.widgetPlacement.create({ data: { siteId: site.id, ...w } });
    }
  }

  console.log("✅ Widgets created");

  // Forum category + forums
  const category = await prisma.forumCategory.upsert({
    where: { id: "seed-category-1" },
    update: { name: "General" },
    create: {
      id: "seed-category-1",
      siteId: site.id,
      name: "General",
      sortOrder: 0,
    },
  });

  const forum = await prisma.forum.upsert({
    where: { id: "seed-forum-1" },
    update: { name: "General Discussion" },
    create: {
      id: "seed-forum-1",
      siteId: site.id,
      categoryId: category.id,
      name: "General Discussion",
      description: "Talk about anything!",
      sortOrder: 0,
    },
  });

  console.log("✅ Forums created");

  // Sample thread + post
  const existingThread = await prisma.thread.findFirst({
    where: { siteId: site.id, title: "Welcome to Demo Guild!" },
  });

  if (!existingThread) {
    const thread = await prisma.thread.create({
      data: {
        siteId: site.id,
        forumId: forum.id,
        authorId: admin.id,
        title: "Welcome to Demo Guild!",
        isPinned: true,
        lastPostAt: new Date(),
      },
    });

    await prisma.post.create({
      data: {
        siteId: site.id,
        threadId: thread.id,
        authorId: admin.id,
        content:
          "<p>Welcome to the Demo Guild! This is a sample community platform built with Next.js, Prisma, and Lucia Auth.</p><p>Feel free to explore the forums, pages, and member features.</p>",
      },
    });

    // Reply from demo user
    await prisma.post.create({
      data: {
        siteId: site.id,
        threadId: thread.id,
        authorId: demoUser.id,
        content:
          "<p>Thanks for having me! Looking forward to being part of this community. 🎉</p>",
      },
    });

    await prisma.thread.update({
      where: { id: thread.id },
      data: { replyCount: 1 },
    });

    await prisma.forum.update({
      where: { id: forum.id },
      data: { threadCount: 1, postCount: 2 },
    });
  }

  console.log("✅ Sample thread created");

  // CMS page
  const existingPage = await prisma.page.findFirst({
    where: { siteId: site.id, slug: "about" },
  });

  if (!existingPage) {
    await prisma.page.create({
      data: {
        siteId: site.id,
        authorId: admin.id,
        title: "About Us",
        slug: "about",
        status: PageStatus.PUBLISHED,
        content:
          "<h2>About Demo Guild</h2><p>We are a community of passionate gamers and content creators. This site was created using the MabiGuild community platform.</p><h3>Our Values</h3><ul><li>Respect</li><li>Inclusivity</li><li>Fun</li></ul>",
      },
    });
  }

  console.log("✅ CMS page created");

  // Shoutbox messages
  const msgs = [
    { userId: admin.id, message: "Hey everyone! Welcome to the shoutbox! 👋" },
    { userId: demoUser.id, message: "Hello! Happy to be here!" },
    { userId: admin.id, message: "Feel free to chat here anytime." },
  ];

  for (const msg of msgs) {
    const exists = await prisma.shoutMessage.findFirst({
      where: { siteId: site.id, userId: msg.userId, message: msg.message },
    });
    if (!exists) {
      await prisma.shoutMessage.create({
        data: { siteId: site.id, ...msg },
      });
    }
  }

  console.log("✅ Shoutbox messages created");
  console.log("\n🎉 Seed complete!");
  console.log("\nDemo credentials:");
  console.log("  Admin: admin@example.com / admin1234");
  console.log("  Demo:  demo@example.com  / demo1234");
  console.log("\nDemo site: http://demoguild.localhost:3000");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
