import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { validateRequest } from "@/lib/auth";
import AdminMembersClient from "./AdminMembersClient";

export default async function AdminMembersPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const { user } = await validateRequest();
  if (!user) notFound();

  const memberships = await prisma.siteMembership.findMany({
    where: { siteId: site.id },
    include: {
      user: true,
      userRoles: { include: { role: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  const roles = await prisma.siteRole.findMany({
    where: { siteId: site.id },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Members</h1>
      <AdminMembersClient
        siteId={site.id}
        memberships={memberships}
        roles={roles}
        currentUserId={user.id}
      />
    </div>
  );
}
