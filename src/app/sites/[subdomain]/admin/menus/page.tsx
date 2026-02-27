import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import AdminMenusClient from "./AdminMenusClient";

export default async function AdminMenusPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const menus = await prisma.menu.findMany({
    where: { siteId: site.id },
    include: {
      items: {
        where: { parentId: null },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Menus</h1>
      <AdminMenusClient siteId={site.id} menus={menus} />
    </div>
  );
}
