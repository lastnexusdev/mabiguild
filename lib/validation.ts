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

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "admin",
  "api",
  "platform",
  "mail",
  "app",
  "dashboard"
]);
