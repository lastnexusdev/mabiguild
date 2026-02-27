import { prisma } from "./db";

interface AuditParams {
  siteId?: string;
  actorId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditParams) {
  return prisma.auditLog.create({
    data: {
      siteId: params.siteId,
      actorId: params.actorId,
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    },
  });
}
