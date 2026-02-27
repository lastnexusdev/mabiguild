import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import type { Site, Menu, MenuItem } from "@prisma/client";

type MenuWithItems = Menu & {
  items: (MenuItem & { children: MenuItem[] })[];
};

type SiteWithMenus = Site & {
  menus: MenuWithItems[];
};

export default async function SiteShell({
  site,
  children,
}: {
  site: SiteWithMenus;
  children: React.ReactNode;
}) {
  const { user } = await validateRequest();

  let membership = null;
  if (user) {
    membership = await prisma.siteMembership.findUnique({
      where: { userId_siteId: { userId: user.id, siteId: site.id } },
    });
  }

  const primaryMenu = site.menus[0];
  const isDark = site.theme === "dark";

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        {/* Banner */}
        <div
          className="w-full h-32 md:h-48 relative"
          style={{
            backgroundImage: site.bannerUrl
              ? `url(${site.bannerUrl})`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {!site.bannerUrl && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-800 via-blue-700 to-blue-600" />
          )}
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative h-full max-w-7xl mx-auto px-4 flex items-end pb-4">
            <div className="flex items-end gap-4">
              {site.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={site.logoUrl}
                  alt={site.name}
                  className="w-16 h-16 rounded-lg border-2 border-white shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-white/20 backdrop-blur border-2 border-white/50 flex items-center justify-center text-2xl text-white shadow-lg">
                  🛡️
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow">
                  {site.name}
                </h1>
                {site.description && (
                  <p className="text-sm text-white/80 drop-shadow">
                    {site.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="bg-slate-800 dark:bg-slate-900 border-b border-slate-700 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
            <div className="flex items-center gap-1">
              {primaryMenu?.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.url}
                  className="px-3 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  {membership && (
                    <Link
                      href={`/u/${user.username}`}
                      className="text-sm text-slate-300 hover:text-white"
                    >
                      {user.displayName ?? user.username}
                    </Link>
                  )}
                  {!membership && (
                    <form action="/api/site/join" method="POST">
                      <input type="hidden" name="siteId" value={site.id} />
                      <button
                        type="submit"
                        className="btn-primary btn-sm btn"
                      >
                        Join Site
                      </button>
                    </form>
                  )}
                  <Link href="/logout" className="text-xs text-slate-400 hover:text-white">
                    Logout
                  </Link>
                </>
              ) : (
                <Link href="/login" className="btn-primary btn-sm btn">
                  Login
                </Link>
              )}
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-700 mt-12 py-6 text-center text-sm text-slate-500">
          {site.name} · Powered by{" "}
          <a
            href={process.env.NEXT_PUBLIC_APP_URL ?? "/"}
            className="text-blue-500 hover:underline"
          >
            MabiGuild
          </a>
        </footer>
      </div>
    </div>
  );
}
