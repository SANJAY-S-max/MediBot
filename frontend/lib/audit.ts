import { prisma } from "./prisma";

export interface LogAuditParams {
  actorUserId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export async function logAudit({
  actorUserId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
  userAgent,
}: LogAuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        actorUserId: actorUserId || null,
        action,
        entity,
        entityId: entityId || null,
        details: details ? (details as any) : undefined,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
    return null;
  }
}
