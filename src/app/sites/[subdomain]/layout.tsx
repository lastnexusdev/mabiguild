import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import SiteShell from "@/components/site/SiteShell";

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  const site = await prisma.site.findUnique({
    where: { subdomain },
    include: {
      menus: {
        include: {
          items: {
            where: { parentId: null },
            include: { children: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        where: { location: "primary" },
      },
    },
  });

  if (!site || !site.isActive) notFound();

  return <SiteShell site={site}>{children}</SiteShell>;
}
