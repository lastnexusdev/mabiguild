import { prisma } from "./db";
import { type NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "localhost:3000";

/**
 * Extract the subdomain from a hostname.
 * e.g. "myguild.platform.com" → "myguild"
 *      "platform.com"         → null
 *      "localhost:3000"        → null
 */
export function getSubdomainFromHostname(hostname: string): string | null {
  // Strip port
  const host = hostname.split(":")[0];
  const rootHost = ROOT_DOMAIN.split(":")[0];

  if (host === rootHost || host === "localhost" || host === "www." + rootHost) {
    return null;
  }

  // Check if it's a subdomain of the root domain
  if (host.endsWith("." + rootHost)) {
    const subdomain = host.slice(0, -(rootHost.length + 1));
    if (subdomain && !subdomain.includes(".")) {
      return subdomain;
    }
  }

  // Development: support ?subdomain= query param or x-subdomain header
  return null;
}

export async function getSiteBySubdomain(subdomain: string) {
  return prisma.site.findUnique({
    where: { subdomain },
  });
}

export async function getSiteFromRequest(req: NextRequest) {
  const hostname = req.headers.get("host") ?? "";
  const subdomain = getSubdomainFromHostname(hostname);
  if (!subdomain) return null;
  return getSiteBySubdomain(subdomain);
}

/**
 * Reserved subdomains that cannot be registered
 */
export const RESERVED_SUBDOMAINS = new Set([
  "admin",
  "api",
  "www",
  "platform",
  "app",
  "mail",
  "smtp",
  "ftp",
  "cdn",
  "static",
  "assets",
  "auth",
  "login",
  "register",
  "dashboard",
  "account",
  "billing",
  "support",
  "help",
  "docs",
  "blog",
  "status",
  "dev",
  "staging",
  "test",
  "demo",
]);

export function isValidSubdomain(subdomain: string): boolean {
  if (!subdomain) return false;
  if (subdomain.length < 2 || subdomain.length > 32) return false;
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain) && !/^[a-z0-9]$/.test(subdomain)) return false;
  if (RESERVED_SUBDOMAINS.has(subdomain)) return false;
  return true;
}
