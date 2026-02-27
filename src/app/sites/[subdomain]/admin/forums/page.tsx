import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import AdminForumsClient from "./AdminForumsClient";

export default async function AdminForumsPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const site = await prisma.site.findUnique({ where: { subdomain } });
  if (!site) notFound();

  const categories = await prisma.forumCategory.findMany({
    where: { siteId: site.id },
    orderBy: { sortOrder: "asc" },
    include: {
      forums: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { threads: true } } },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Manage Forums</h1>
      <AdminForumsClient siteId={site.id} categories={categories} />
    </div>
  );
}
