import Link from "next/link";
import type { Menu, Site } from "@prisma/client";

export function SiteLayout({
  site,
  menus,
  children
}: {
  site: Site;
  menus: Menu[];
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <header
        className="border-b border-zinc-800 bg-cover bg-center"
        style={{ backgroundImage: site.bannerUrl ? `url(${site.bannerUrl})` : undefined }}
      >
        <div className="bg-black/60">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <h1 className="text-4xl font-bold">{site.name}</h1>
            <p className="mt-2 text-zinc-200">{site.description || "Welcome to this community."}</p>
          </div>
        </div>
      </header>

      <nav className="border-b border-zinc-800 bg-zinc-900">
        <div className="mx-auto flex max-w-6xl gap-5 px-6 py-3 text-sm">
          {menus.length === 0 ? <Link href="/">Home</Link> : null}
          {menus.map((item) => (
            <Link key={item.id} href={item.url}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </main>
  );
}
