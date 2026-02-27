import {
  PrismaClient,
  MembershipRole,
  PermissionKey,
  PageStatus,
} from "@prisma/client";
import { hash } from "argon2";

const prisma = new PrismaClient();

async function seed() {
  console.log("Seeding database...");

  // ── Users ────────────────────────────────────────────────────────────────────

  const adminHash = await hash("admin1234");
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { passwordHash: adminHash },
    create: {
      email: "admin@example.com",
      username: "admin",
      displayName: "Platform Admin",
      bio: "I run this platform.",
      passwordHash: adminHash,
      isGlobalAdmin: true,
    },
  });
  console.log("Admin user:", admin.username);

  const demoHash = await hash("demo1234");
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: { passwordHash: demoHash },
    create: {
      email: "demo@example.com",
      username: "demouser",
      displayName: "Demo User",
      bio: "Just a demo account exploring the community.",
      passwordHash: demoHash,
    },
  });
  console.log("Demo user:", demoUser.username);

  // ── Site ─────────────────────────────────────────────────────────────────────

  const site = await prisma.site.upsert({
    where: { subdomain: "demoguild" },
    update: { name: "Demo Guild" },
    create: {
      subdomain: "demoguild",
      name: "Demo Guild",
      description: "A demonstration community site built with MabiGuild.",
      ownerId: admin.id,
      theme: "dark",
    },
  });
  console.log("Site:", site.subdomain);

  // ── Memberships ──────────────────────────────────────────────────────────────

  const adminMembership = await prisma.siteMembership.upsert({
    where: { userId_siteId: { userId: admin.id, siteId: site.id } },
    update: {},
    create: { userId: admin.id, siteId: site.id, role: MembershipRole.OWNER },
  });

  const demoMembership = await prisma.siteMembership.upsert({
    where: { userId_siteId: { userId: demoUser.id, siteId: site.id } },
    update: {},
    create: {
      userId: demoUser.id,
      siteId: site.id,
      role: MembershipRole.MEMBER,
    },
  });

  // ── Roles ────────────────────────────────────────────────────────────────────

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

  await prisma.siteRole.upsert({
    where: { siteId_name: { siteId: site.id, name: "Admin" } },
    update: {},
    create: {
      siteId: site.id,
      name: "Admin",
      color: "#f59e0b",
      sortOrder: 2,
    },
  });

  // Moderator permissions
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

  // Assign Member role to demoUser
  await prisma.userSiteRole.upsert({
    where: {
      membershipId_roleId: {
        membershipId: demoMembership.id,
        roleId: memberRole.id,
      },
    },
    update: {},
    create: { membershipId: demoMembership.id, roleId: memberRole.id },
  });

  console.log("Roles created");

  // ── Menu ─────────────────────────────────────────────────────────────────────

  const menu = await prisma.menu.upsert({
    where: { siteId_location: { siteId: site.id, location: "primary" } },
    update: {},
    create: { siteId: site.id, name: "Primary", location: "primary" },
  });

  const menuItemData = [
    { label: "Home", url: "/", sortOrder: 0 },
    { label: "Forums", url: "/forums", sortOrder: 1 },
    { label: "Members", url: "/members", sortOrder: 2 },
    { label: "About", url: "/p/about", sortOrder: 3 },
  ];

  for (const item of menuItemData) {
    const existing = await prisma.menuItem.findFirst({
      where: { menuId: menu.id, label: item.label },
    });
    if (!existing) {
      await prisma.menuItem.create({
        data: { siteId: site.id, menuId: menu.id, ...item },
      });
    }
  }

  console.log("Menu created");

  // ── Widgets ──────────────────────────────────────────────────────────────────

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

  console.log("Widgets created");

  // ── Forums ───────────────────────────────────────────────────────────────────

  let generalCat = await prisma.forumCategory.findFirst({
    where: { siteId: site.id, name: "General" },
  });
  if (!generalCat) {
    generalCat = await prisma.forumCategory.create({
      data: { siteId: site.id, name: "General", sortOrder: 0 },
    });
  }

  let generalForum = await prisma.forum.findFirst({
    where: { siteId: site.id, name: "General Discussion" },
  });
  if (!generalForum) {
    generalForum = await prisma.forum.create({
      data: {
        siteId: site.id,
        categoryId: generalCat.id,
        name: "General Discussion",
        description: "Talk about anything!",
        sortOrder: 0,
      },
    });
  }

  let annCat = await prisma.forumCategory.findFirst({
    where: { siteId: site.id, name: "Announcements" },
  });
  if (!annCat) {
    annCat = await prisma.forumCategory.create({
      data: { siteId: site.id, name: "Announcements", sortOrder: 1 },
    });
  }

  let annForum = await prisma.forum.findFirst({
    where: { siteId: site.id, name: "News & Updates" },
  });
  if (!annForum) {
    annForum = await prisma.forum.create({
      data: {
        siteId: site.id,
        categoryId: annCat.id,
        name: "News & Updates",
        description: "Official announcements from the admin team.",
        sortOrder: 0,
      },
    });
  }

  console.log("Forums created");

  // ── Threads & Posts ──────────────────────────────────────────────────────────

  let welcomeThread = await prisma.thread.findFirst({
    where: { siteId: site.id, title: "Welcome to Demo Guild!" },
  });

  if (!welcomeThread) {
    welcomeThread = await prisma.thread.create({
      data: {
        siteId: site.id,
        forumId: annForum.id,
        authorId: admin.id,
        title: "Welcome to Demo Guild!",
        isPinned: true,
        lastPostAt: new Date(),
      },
    });

    await prisma.post.create({
      data: {
        siteId: site.id,
        threadId: welcomeThread.id,
        authorId: admin.id,
        content:
          "<p>Welcome to <strong>Demo Guild</strong>! This is a community platform built with Next.js, Prisma, Lucia Auth, and Tailwind CSS.</p>" +
          "<p>Feel free to explore the forums, check out the member list, and jump into the shoutbox to say hello.</p>" +
          "<ul><li>Use the <strong>Admin Panel</strong> to customise your site</li><li>Create <strong>CMS pages</strong> for static content</li><li>Set up <strong>Forums</strong> and invite your community</li></ul>",
      },
    });

    await prisma.post.create({
      data: {
        siteId: site.id,
        threadId: welcomeThread.id,
        authorId: demoUser.id,
        content:
          "<p>Thanks for having me! Really excited to be part of this community. 🎉</p>",
      },
    });

    await prisma.thread.update({
      where: { id: welcomeThread.id },
      data: { replyCount: 1 },
    });
    await prisma.forum.update({
      where: { id: annForum.id },
      data: { threadCount: 1, postCount: 2 },
    });
  }

  let introThread = await prisma.thread.findFirst({
    where: { siteId: site.id, title: "Introduce yourself!" },
  });
  if (!introThread) {
    introThread = await prisma.thread.create({
      data: {
        siteId: site.id,
        forumId: generalForum.id,
        authorId: admin.id,
        title: "Introduce yourself!",
        lastPostAt: new Date(Date.now() - 60000),
      },
    });

    await prisma.post.create({
      data: {
        siteId: site.id,
        threadId: introThread.id,
        authorId: admin.id,
        content:
          "<p>Hey everyone! Drop a message here to say hi and tell us a bit about yourself. Where are you from? What brings you here?</p>",
      },
    });

    await prisma.post.create({
      data: {
        siteId: site.id,
        threadId: introThread.id,
        authorId: demoUser.id,
        content:
          "<p>Hi! I'm <strong>demouser</strong>, just testing out this awesome platform. Loving it so far!</p>",
      },
    });

    await prisma.thread.update({
      where: { id: introThread.id },
      data: { replyCount: 1 },
    });
    await prisma.forum.update({
      where: { id: generalForum.id },
      data: { threadCount: 1, postCount: 2 },
    });
  }

  console.log("Threads created");

  // ── CMS Pages ────────────────────────────────────────────────────────────────

  await prisma.page.upsert({
    where: { siteId_slug: { siteId: site.id, slug: "about" } },
    update: {},
    create: {
      siteId: site.id,
      authorId: admin.id,
      title: "About Us",
      slug: "about",
      status: PageStatus.PUBLISHED,
      content:
        "<h2>About Demo Guild</h2>" +
        "<p>We are a community of passionate gamers and creators. This site was built using the <strong>MabiGuild</strong> community platform — a Next.js + Prisma + Lucia Auth project.</p>" +
        "<h3>Our Values</h3><ul><li>Respect for all members</li><li>Inclusivity and diversity</li><li>Having fun together</li></ul>" +
        "<h3>How to join</h3><p>Simply create an account and click <em>Join Site</em> in the navigation bar. It's free and instant!</p>",
    },
  });

  await prisma.page.upsert({
    where: { siteId_slug: { siteId: site.id, slug: "rules" } },
    update: {},
    create: {
      siteId: site.id,
      authorId: admin.id,
      title: "Community Rules",
      slug: "rules",
      status: PageStatus.PUBLISHED,
      content:
        "<h2>Community Rules</h2>" +
        "<ol><li>Be respectful to all members.</li><li>No spam or self-promotion.</li><li>Keep content appropriate for all ages.</li><li>Follow the instructions of moderators.</li><li>Enjoy your time here!</li></ol>",
    },
  });

  console.log("CMS pages created");

  // ── Shoutbox ─────────────────────────────────────────────────────────────────

  const shoutMsgs = [
    { userId: admin.id, message: "Hey everyone! Welcome to the shoutbox 👋" },
    { userId: demoUser.id, message: "Hello! Happy to be here!" },
    { userId: admin.id, message: "Feel free to chat here anytime. It refreshes every 5 seconds." },
    { userId: demoUser.id, message: "Pretty cool feature!" },
  ];

  for (const msg of shoutMsgs) {
    const exists = await prisma.shoutMessage.findFirst({
      where: { siteId: site.id, userId: msg.userId, message: msg.message },
    });
    if (!exists) {
      await prisma.shoutMessage.create({
        data: { siteId: site.id, ...msg },
      });
    }
  }

  console.log("Shoutbox seeded");

  console.log("\nSeed complete!");
  console.log("\nCredentials:");
  console.log("  Admin: admin@example.com / admin1234");
  console.log("  Demo:  demo@example.com  / demo1234");
  console.log("\nDemo site URL: http://demoguild.localhost:3000");
  console.log(
    "\nNote: Add '127.0.0.1  demoguild.localhost' to /etc/hosts for subdomain routing."
  );
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
