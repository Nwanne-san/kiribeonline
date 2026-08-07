import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";
import { writeAuditLog } from "@/lib/audit";

/**
 * Pull a human-friendly label off any document — falls back through the fields
 * the various content collections use. Keeps the audit summary readable when
 * we render "Published the article 'X'" downstream.
 */
function docLabel(doc: Record<string, unknown> | undefined | null): string | undefined {
  if (!doc) return undefined;
  const candidates = ["title", "name", "label", "email", "slug"] as const;
  for (const key of candidates) {
    const value = doc[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function pickStatus(doc: Record<string, unknown> | undefined | null): string | undefined {
  if (!doc) return undefined;
  const status = doc.status;
  return typeof status === "string" ? status : undefined;
}

export function auditAfterChange(collectionSlug: string): CollectionAfterChangeHook {
  return async ({ doc, operation, req, previousDoc, context }) => {
    if (context?.skipHooks) return;

    const nextStatus = pickStatus(doc as Record<string, unknown>);
    const prevStatus = pickStatus(previousDoc as Record<string, unknown>);

    // Promote status transitions into their own action so the UI can render
    // "Published the article 'X'" instead of a generic "Updated". Every audit
    // row still has an unambiguous slug the timeline can prefix-filter on.
    let action = operation === "create"
      ? `${collectionSlug}.created`
      : `${collectionSlug}.updated`;

    if (operation === "update" && nextStatus && nextStatus !== prevStatus) {
      if (nextStatus === "published") action = `${collectionSlug}.published`;
      else if (nextStatus === "scheduled") action = `${collectionSlug}.scheduled`;
      else if (nextStatus === "in_review") action = `${collectionSlug}.submitted_for_review`;
      else if (nextStatus === "archived") action = `${collectionSlug}.archived`;
      else if (nextStatus === "draft" && prevStatus) action = `${collectionSlug}.reverted_to_draft`;
    }

    await writeAuditLog(req.payload, {
      action,
      actorEmail: req.user?.email,
      targetType: collectionSlug,
      targetId: String(doc.id),
      metadata: {
        operation,
        title: docLabel(doc as Record<string, unknown>),
        previousStatus: prevStatus,
        nextStatus,
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
      metadata: {
        title: docLabel(doc as Record<string, unknown>),
      },
    });
  };
}
