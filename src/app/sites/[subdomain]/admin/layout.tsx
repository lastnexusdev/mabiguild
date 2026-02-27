import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { validateRequest } from "@/lib/auth";
import Link from "next/link";

const navItems = [
  { href: "", label: "Overview", icon: "🏠" },
  { href: "/settings", label: "Site Settings", icon: "⚙️" },
  { href: "/pages", label: "Pages", icon: "📄" },
  { href: "/menus", label: "Menus", icon: "🧭" },
  { href: "/widgets", label: "Widgets", icon: "🧩" },
  { href: "/forums", label: "Forums", icon: "💬" },
  { href: "/members", label: "Members", icon: "👥" },
  { href: "/roles", label: "Roles", icon: "🎭" },
  { href: "/audit", label: "Audit Log", icon: "📋" },
];

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const { user } = await validateRequest();
  if (!user) redirect("/login");

  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const membership = await prisma.siteMembership.findUnique({
    where: { userId_siteId: { userId: user.id, siteId: site.id } },
  });

  if (
    !membership ||
    !["OWNER", "ADMIN"].includes(membership.role)
  ) {
    redirect(`/`);
  }

  return (
    <div className="flex gap-6 min-h-screen">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0">
        <div className="card sticky top-20">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Admin Panel
            </p>
            <p className="text-sm font-medium mt-1">{site.name}</p>
          </div>
          <nav className="p-2 space-y-0.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={`/admin${item.href}`}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <a href="/" className="text-xs text-blue-500 hover:underline">
              ← Back to site
            </a>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
