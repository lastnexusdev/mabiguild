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
      widgetPlacements: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!site) notFound();

  const col1 = site.widgetPlacements.filter((w) => w.column === 1);
  const col2 = site.widgetPlacements.filter((w) => w.column === 2);
  const col3 = site.widgetPlacements.filter((w) => w.column === 3);

  const hasCol3 = col3.length > 0;

  return (
    <div className={`grid gap-4 ${hasCol3 ? "lg:grid-cols-[1fr_2fr_1fr]" : "lg:grid-cols-[1fr_2fr]"}`}>
      <div className="space-y-4">
        {col1.map((w) => (
          <WidgetColumn key={w.id} widget={w} siteId={site.id} userId={user?.id} />
        ))}
      </div>
      <div className="space-y-4">
        {col2.map((w) => (
          <WidgetColumn key={w.id} widget={w} siteId={site.id} userId={user?.id} />
        ))}
      </div>
      {hasCol3 && (
        <div className="space-y-4">
          {col3.map((w) => (
            <WidgetColumn key={w.id} widget={w} siteId={site.id} userId={user?.id} />
          ))}
        </div>
      )}
    </div>
  );
}
