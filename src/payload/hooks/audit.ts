import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";
import { writeAuditLog } from "@/lib/audit";

export function auditAfterChange(collectionSlug: string): CollectionAfterChangeHook {
  return async ({ doc, operation, req, previousDoc, context }) => {
    if (context?.skipHooks) return;
    const action =
      operation === "create"
        ? `${collectionSlug}.created`
        : `${collectionSlug}.updated`;

    await writeAuditLog(req.payload, {
      action,
      actorEmail: req.user?.email,
      targetType: collectionSlug,
      targetId: String(doc.id),
      metadata: {
        operation,
        previousId: previousDoc?.id,
      },
    });
  };
}

export function auditAfterDelete(collectionSlug: string): CollectionAfterDeleteHook {
  return async ({ doc, req }) => {
    await writeAuditLog(req.payload, {
      action: `${collectionSlug}.deleted`,
      actorEmail: req.user?.email,
      targetType: collectionSlug,
      targetId: String(doc.id),
    });
  };
}
