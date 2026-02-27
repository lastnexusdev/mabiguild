import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const createSiteSchema = z.object({
  name: z.string().min(2).max(60),
  subdomain: z.string().min(3).max(32).regex(/^[a-z0-9-]+$/)
});

export const updateSiteSchema = z.object({
  name: z.string().min(2).max(60),
  description: z.string().max(500).optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  homepageIntro: z.string().max(5000).optional().or(z.literal("")),
  autoRankEnabled: z.boolean().default(false),
  rankMember: z.number().int().min(0).max(100000).default(0),
  rankModerator: z.number().int().min(0).max(100000).default(50),
  rankAdmin: z.number().int().min(0).max(100000).default(200),
  rankOwner: z.number().int().min(0).max(100000).default(500)
});

export const createMenuSchema = z.object({
  label: z.string().min(1).max(40),
  url: z.string().min(1).max(200)
});

export const createPageSchema = z.object({
  title: z.string().min(2).max(120),
  slug: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  content: z.string().min(1),
  isPublished: z.boolean().default(false)
});

export const createThreadSchema = z.object({
  forumId: z.string().min(1),
  title: z.string().min(3).max(160),
  body: z.string().min(1).max(10000)
});

export const createReplySchema = z.object({
  threadId: z.string().min(1),
  body: z.string().min(1).max(10000)
});

export const moderateThreadSchema = z.object({
  threadId: z.string().min(1),
  action: z.enum(["lock", "unlock", "pin", "unpin", "move", "delete"]),
  targetForumId: z.string().optional()
});

export const editPostSchema = z.object({
  postId: z.string().min(1),
  body: z.string().min(1).max(10000)
});

export const shoutMessageSchema = z.object({
  body: z.string().min(1).max(300)
});

export const updateWidgetSchema = z.object({
  widget: z.enum(["RECENT_THREADS", "ONLINE_MEMBERS", "SHOUTBOX", "SITE_STATS"]),
  enabled: z.boolean(),
  column: z.number().int().min(0).max(2),
  position: z.number().int().min(0).max(20)
});

export const updateProfileSchema = z.object({
  bio: z.string().max(600).optional().or(z.literal(""))
});

export const updateMembershipRoleSchema = z.object({
  membershipId: z.string().min(1),
  role: z.enum(["OWNER", "ADMIN", "MODERATOR", "MEMBER"])
});

export const banMemberSchema = z.object({
  membershipId: z.string().min(1),
  reason: z.string().max(200).optional().or(z.literal(""))
});

export const unbanMemberSchema = z.object({
  userId: z.string().min(1)
});

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "admin",
  "api",
  "platform",
  "mail",
  "app",
  "dashboard"
]);
