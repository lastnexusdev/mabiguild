import Link from "next/link";
import { PlatformNav } from "@/components/platform-nav";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await requireUser();
  const memberships = await prisma.siteMembership.findMany({ where: { userId: user.id }, include: { site: true } });

  return (
    <>
      <PlatformNav />
      <main className="max-w-5xl mx-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Sites</h1>
          <Link href="/dashboard/sites/new" className="bg-sky-600 px-4 py-2 rounded">Create Site</Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {memberships.map((m) => (
            <article key={m.id} className="border border-zinc-800 rounded p-4">
              <h2 className="text-xl font-semibold">{m.site.name}</h2>
              <p className="text-zinc-400">Role: {m.role}</p>
              <p className="text-zinc-400">{m.site.subdomain}.{process.env.ROOT_DOMAIN}</p>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
