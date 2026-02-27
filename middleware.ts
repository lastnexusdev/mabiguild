import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "platform.localhost";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const hostname = host.split(":")[0];

  const headers = new Headers(request.headers);
  if (hostname !== ROOT_DOMAIN && hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    headers.set("x-tenant-subdomain", hostname.replace(`.${ROOT_DOMAIN}`, ""));
  }

  const response = NextResponse.next({ request: { headers } });
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Content-Security-Policy", "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
