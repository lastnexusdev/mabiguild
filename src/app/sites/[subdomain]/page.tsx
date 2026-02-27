import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { validateRequest } from "@/lib/auth";
import WidgetColumn from "@/components/site/WidgetColumn";

export default async function SiteHomePage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const { user } = await validateRequest();

  const site = await prisma.site.findUnique({
    where: { subdomain },
    include: {
      widgetPlacements: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!site) notFound();

  // Determine if current user is a mod for shoutbox delete capability
  let isMod = false;
  if (user) {
    const membership = await prisma.siteMembership.findUnique({
      where: { userId_siteId: { userId: user.id, siteId: site.id } },
    });
    isMod =
      membership?.role === "OWNER" ||
      membership?.role === "ADMIN" ||
      membership?.role === "MODERATOR";
  }

  const col1 = site.widgetPlacements.filter((w) => w.column === 1);
  const col2 = site.widgetPlacements.filter((w) => w.column === 2);
  const col3 = site.widgetPlacements.filter((w) => w.column === 3);

  const hasCol3 = col3.length > 0;
  const gridClass = hasCol3
    ? "grid gap-4 lg:grid-cols-[1fr_2fr_1fr]"
    : col1.length > 0
    ? "grid gap-4 lg:grid-cols-[1fr_2fr]"
    : "block";

  return (
    <div className={gridClass}>
      {col1.length > 0 && (
        <div className="space-y-4">
          {col1.map((w) => (
            <WidgetColumn
              key={w.id}
              widget={w}
              siteId={site.id}
              userId={user?.id}
              isMod={isMod}
            />
          ))}
        </div>
      )}
      <div className="space-y-4">
        {col2.map((w) => (
          <WidgetColumn
            key={w.id}
            widget={w}
            siteId={site.id}
            userId={user?.id}
            isMod={isMod}
          />
        ))}
      </div>
      {hasCol3 && (
        <div className="space-y-4">
          {col3.map((w) => (
            <WidgetColumn
              key={w.id}
              widget={w}
              siteId={site.id}
              userId={user?.id}
              isMod={isMod}
            />
          ))}
        </div>
      )}
    </div>
  );
}
