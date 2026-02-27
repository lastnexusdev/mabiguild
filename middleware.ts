import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "localhost";

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const hostname = host.split(":")[0];
  const pathname = request.nextUrl.pathname;

  const headers = new Headers(request.headers);

  // Dev fallback for environments without subdomain routing:
  // /t/<subdomain>/... -> routes as tenant request
  if (pathname.startsWith("/t/")) {
    const parts = pathname.split("/").filter(Boolean); // ["t", "subdomain", ...]
    const subdomain = parts[1];
    if (subdomain) {
      headers.set("x-tenant-subdomain", subdomain);
      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `/${parts.slice(2).join("/")}`;
      if (rewriteUrl.pathname === "/") {
        // keep root
      }
      if (rewriteUrl.pathname === "") rewriteUrl.pathname = "/";
      const response = NextResponse.rewrite(rewriteUrl, { request: { headers } });
      return applySecurityHeaders(response);
    }
  }

  // Normal subdomain handling
  if (hostname !== ROOT_DOMAIN && hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "");
    headers.set("x-tenant-subdomain", subdomain);
  }

  const response = NextResponse.next({ request: { headers } });
  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
