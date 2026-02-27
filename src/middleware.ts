import { NextRequest, NextResponse } from "next/server";
import { getSubdomainFromHostname } from "./lib/tenant";

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static, _next/image (Next.js internals)
     * - favicon and static assets
     * - /api/ routes (MUST NOT be rewritten – client fetch calls go here directly)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") ?? "";
  const subdomain = getSubdomainFromHostname(hostname);

  const response = NextResponse.next();

  if (subdomain) {
    // Rewrite subdomain path to the /sites/[subdomain]/... route segment.
    // myguild.platform.com/forums → internal /sites/myguild/forums
    // myguild.platform.com/       → internal /sites/myguild
    const newUrl = new URL(req.url);
    const cleanPath = url.pathname === "/" ? "" : url.pathname;
    newUrl.pathname = `/sites/${subdomain}${cleanPath}`;

    const rewriteResponse = NextResponse.rewrite(newUrl);
    rewriteResponse.headers.set("x-subdomain", subdomain);
    return rewriteResponse;
  }

  // Root domain – pass through normally
  response.headers.set("x-subdomain", "");
  return response;
}
