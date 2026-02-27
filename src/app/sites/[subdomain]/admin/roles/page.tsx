import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import AdminRolesClient from "./AdminRolesClient";
import { PermissionKey } from "@prisma/client";

export default async function AdminRolesPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const roles = await prisma.siteRole.findMany({
    where: { siteId: site.id },
    orderBy: { sortOrder: "asc" },
    include: { permissions: true },
  });

  const allPerms = Object.values(PermissionKey);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Roles</h1>
      <AdminRolesClient siteId={site.id} roles={roles} allPermissions={allPerms} />
    </div>
  );
}
