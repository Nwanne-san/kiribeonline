import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload/get-payload";
import type {
  AuditLogEntry,
  AuditLogListResult,
  ListAuditLogsParams,
} from "./audit.types";

const DEFAULT_LIMIT = 25;

/**
 * List audit-log rows with server-side filters, newest first.
 *
 * `action` matches on prefix (e.g. `articles` matches `articles.created`,
 * `articles.updated`, `articles.deleted`) so a single filter can cover every
 * lifecycle event on an entity. `q` is a substring match on the actor's email
 * — audit rows record the email at write time, so this stays honest even after
 * a user is renamed or removed.
 */
export async function listAuditLogs(
  params: ListAuditLogsParams = {}
): Promise<AuditLogListResult> {
  const payload = await getPayloadClient();

  const conditions: Where[] = [];
  if (params.q) {
    conditions.push({ actorEmail: { like: params.q } });
  }
  if (params.action) {
    conditions.push({ action: { like: params.action } });
  }
  if (params.targetType) {
    conditions.push({ targetType: { equals: params.targetType } });
  }
  if (params.from) {
    conditions.push({ createdAt: { greater_than_equal: params.from } });
  }
  if (params.to) {
    conditions.push({ createdAt: { less_than_equal: params.to } });
  }
  const where: Where | undefined = conditions.length ? { and: conditions } : undefined;

  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), 100);
  const page = Math.max(params.page ?? 1, 1);

  const result = await payload.find({
    collection: "audit-logs",
    where,
    sort: "-createdAt",
    page,
    limit,
    depth: 0,
    overrideAccess: true,
  });

  const docs: AuditLogEntry[] = (result.docs as unknown as Array<Record<string, unknown>>).map(
    (doc) => ({
      id: String(doc.id),
      action: String(doc.action ?? ""),
      actorEmail: doc.actorEmail ? String(doc.actorEmail) : undefined,
      targetType: doc.targetType ? String(doc.targetType) : undefined,
      targetId: doc.targetId ? String(doc.targetId) : undefined,
      metadata:
        doc.metadata && typeof doc.metadata === "object"
          ? (doc.metadata as Record<string, unknown>)
          : undefined,
      createdAt: String(doc.createdAt ?? ""),
    })
  );

  return {
    docs,
    page: result.page ?? page,
    limit,
    totalDocs: result.totalDocs ?? docs.length,
    totalPages: result.totalPages ?? 1,
    hasNextPage: Boolean(result.hasNextPage),
    hasPrevPage: Boolean(result.hasPrevPage),
  };
}

/**
 * Distinct target types present in the log — powers the entity dropdown on the
 * audit page. Cheap enough at Kiribé's audit volume; if the log grows past a
 * few million rows, swap for a manually curated allowlist.
 */
export async function listAuditTargetTypes(): Promise<string[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "audit-logs",
    limit: 500,
    depth: 0,
    sort: "-createdAt",
    overrideAccess: true,
  });
  const seen = new Set<string>();
  for (const doc of result.docs as unknown as Array<{ targetType?: unknown }>) {
    if (doc.targetType) seen.add(String(doc.targetType));
  }
  return Array.from(seen).sort();
}
