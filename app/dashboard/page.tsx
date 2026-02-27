import Link from "next/link";
import { PlatformNav } from "@/components/platform-nav";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();

  const memberships = await prisma.siteMembership.findMany({
    where: { userId: user.id },
    include: { site: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <PlatformNav />
      <main className="mx-auto max-w-5xl p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">My Sites</h1>
          <Link href="/dashboard/sites/new" className="rounded bg-sky-600 px-4 py-2 text-white">Create Site</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {memberships.map((membership) => (
            <article key={membership.id} className="rounded border border-zinc-800 bg-zinc-900 p-4">
              <h2 className="text-xl font-semibold">{membership.site.name}</h2>
              <p className="text-sm text-zinc-400">Role: {membership.role}</p>
              <p className="text-sm text-zinc-400">{membership.site.subdomain}.{process.env.ROOT_DOMAIN}</p>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
