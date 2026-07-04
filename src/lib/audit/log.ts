import type { Payload } from "payload";

export type AuditLogInput = {
  action: string;
  actorEmail?: string | null;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog(payload: Payload, input: AuditLogInput) {
  try {
    await payload.create({
      collection: "audit-logs",
      data: {
        action: input.action,
        actorEmail: input.actorEmail ?? undefined,
        targetType: input.targetType,
        targetId: input.targetId,
        metadata: input.metadata ?? {},
      },
      overrideAccess: true,
    });
  } catch (error) {
    console.error("[audit] failed to write log", error);
  }
}
