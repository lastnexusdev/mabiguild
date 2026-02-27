import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSiteMembership } from "@/lib/tenant";
import { updateWidgetSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const ctx = await requireSiteMembership("ADMIN");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const updates = Array.isArray(body) ? body : [body];

  for (const item of updates) {
    const parsed = updateWidgetSchema.safeParse(item);
    if (!parsed.success) continue;

    await prisma.widgetPlacement.upsert({
      where: { siteId_widget: { siteId: ctx.site.id, widget: parsed.data.widget } },
      update: {
        enabled: parsed.data.enabled,
        column: parsed.data.column,
        position: parsed.data.position
      },
      create: {
        siteId: ctx.site.id,
        widget: parsed.data.widget,
        enabled: parsed.data.enabled,
        column: parsed.data.column,
        position: parsed.data.position
      }
    });
  }

  return NextResponse.json({ ok: true });
}
