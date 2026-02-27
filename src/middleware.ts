import { NextRequest, NextResponse } from "next/server";
import { getSubdomainFromHostname } from "./lib/tenant";

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and internals
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") ?? "";
  const subdomain = getSubdomainFromHostname(hostname);

  // Clone the URL so we can mutate it
  const response = NextResponse.next();

  if (subdomain) {
    // Rewrite to /sites/[subdomain]/... route group
    // e.g. myguild.platform.com/forums → /sites/myguild/forums
    const newUrl = new URL(req.url);
    newUrl.pathname = `/sites/${subdomain}${url.pathname}`;

    const rewriteResponse = NextResponse.rewrite(newUrl);
    // Pass the subdomain as a header so layouts can read it
    rewriteResponse.headers.set("x-subdomain", subdomain);
    return rewriteResponse;
  }

  // Root domain – pass through normally
  response.headers.set("x-subdomain", "");
  return response;
}
