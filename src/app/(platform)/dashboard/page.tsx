import { redirect } from "next/navigation";
import { validateRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { getSiteUrl } from "@/lib/utils";
import { MembershipRole } from "@prisma/client";

export const metadata = { title: "My Sites" };

export default async function DashboardPage() {
  const { user } = await validateRequest();
  if (!user) redirect("/login");

  const memberships = await prisma.siteMembership.findMany({
    where: { userId: user.id },
    include: {
      site: {
        include: {
          _count: {
            select: { memberships: true, threads: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Sites</h1>
          <p className="text-slate-500 text-sm mt-1">
            Sites you&apos;re a member of
          </p>
        </div>
        <Link href="/dashboard/create" className="btn-primary btn">
          + Create New Site
        </Link>
      </div>

      {memberships.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-3xl mb-4">🏰</p>
          <h3 className="text-lg font-medium mb-2">No sites yet</h3>
          <p className="text-slate-500 mb-6">
            Create your first community site or get an invite from a friend.
          </p>
          <Link href="/dashboard/create" className="btn-primary btn">
            Create a Site
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {memberships.map(({ site, role }) => (
            <div key={site.id} className="card hover:shadow-md transition-shadow">
              {site.bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={site.bannerUrl}
                  alt={site.name}
                  className="w-full h-20 object-cover rounded-t-lg"
                />
              ) : (
                <div className="w-full h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold">{site.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {site.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN}
                    </p>
                  </div>
                  <span
                    className={`badge text-xs ${
                      role === MembershipRole.OWNER
                        ? "bg-yellow-100 text-yellow-800"
                        : role === MembershipRole.ADMIN
                        ? "bg-purple-100 text-purple-800"
                        : role === MembershipRole.MODERATOR
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {role}
                  </span>
                </div>
                {site.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                    {site.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span>{site._count.memberships} members</span>
                  <span>{site._count.threads} threads</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <a
                    href={getSiteUrl(site.subdomain)}
                    className="btn-secondary btn-sm btn flex-1 text-center"
                  >
                    Visit Site
                  </a>
                  {(role === MembershipRole.OWNER || role === MembershipRole.ADMIN) && (
                    <a
                      href={`${getSiteUrl(site.subdomain)}/admin`}
                      className="btn-primary btn-sm btn flex-1 text-center"
                    >
                      Admin
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
