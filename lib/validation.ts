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
  homepageIntro: z.string().max(5000).optional().or(z.literal(""))
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

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "admin",
  "api",
  "platform",
  "mail",
  "app",
  "dashboard"
]);
