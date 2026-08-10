import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload/get-payload";
import type {
  ListSubscribersParams,
  SubscriberEntry,
  SubscriberListResult,
} from "./subscribers.types";

const DEFAULT_LIMIT = 25;

function mapSubscriber(doc: Record<string, unknown>): SubscriberEntry {
  return {
    id: String(doc.id),
    email: String(doc.email ?? ""),
    source: doc.source ? String(doc.source) : undefined,
    consent: Boolean(doc.consent),
    confirmed: Boolean(doc.confirmed),
    confirmedAt: doc.confirmedAt ? String(doc.confirmedAt) : undefined,
    createdAt: String(doc.createdAt ?? ""),
    updatedAt: String(doc.updatedAt ?? ""),
  };
}

/**
 * Normalise a YYYY-MM-DD date string to a full ISO datetime usable in Payload
 * `greater_than_equal` / `less_than_equal` comparisons.
 *
 * - `from` dates are floored to the start of day (00:00:00.000Z)
 * - `to`   dates are ceiled  to the end of day  (23:59:59.999Z)
 */
function toIsoFrom(raw: string): string {
  if (raw.length === 10) return `${raw}T00:00:00.000Z`;
  return raw;
}

function toIsoTo(raw: string): string {
  if (raw.length === 10) return `${raw}T23:59:59.999Z`;
  return raw;
}

/**
 * Admin newsletter subscribers list with filter + pagination and a
 * whole-set stats summary (confirmed / pending / total) so the table
 * header can show counts without a second round-trip.
 *
 * `q` matches on email substring. `status` filters on the `confirmed`
 * boolean — "pending" means confirmed=false (they clicked subscribe but
 * haven't clicked the confirmation link yet). `subscribedFrom` /
 * `subscribedTo` restrict on `createdAt`.
 */
export async function listSubscribers(
  params: ListSubscribersParams = {}
): Promise<SubscriberListResult> {
  const payload = await getPayloadClient();

  const conditions: Where[] = [];
  if (params.q) {
    conditions.push({ email: { like: params.q } });
  }
  if (params.status === "confirmed") {
    conditions.push({ confirmed: { equals: true } });
  } else if (params.status === "pending") {
    conditions.push({ confirmed: { equals: false } });
  }
  if (params.subscribedFrom) {
    conditions.push({ createdAt: { greater_than_equal: toIsoFrom(params.subscribedFrom) } });
  }
  if (params.subscribedTo) {
    conditions.push({ createdAt: { less_than_equal: toIsoTo(params.subscribedTo) } });
  }

  const where: Where | undefined = conditions.length
    ? conditions.length === 1
      ? conditions[0]
      : { and: conditions }
    : undefined;

  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), 100);
  const page = Math.max(params.page ?? 1, 1);

  const [pageResult, totalCount, confirmedCount] = await Promise.all([
    payload.find({
      collection: "subscribers",
      where,
      sort: "-createdAt",
      page,
      limit,
      depth: 0,
      overrideAccess: true,
    }),
    payload.count({ collection: "subscribers", overrideAccess: true }),
    payload.count({
      collection: "subscribers",
      where: { confirmed: { equals: true } },
      overrideAccess: true,
    }),
  ]);

  const docs = (pageResult.docs as unknown as Array<Record<string, unknown>>).map(
    mapSubscriber
  );

  return {
    docs,
    page: pageResult.page ?? page,
    limit,
    totalDocs: pageResult.totalDocs ?? docs.length,
    totalPages: pageResult.totalPages ?? 1,
    hasNextPage: Boolean(pageResult.hasNextPage),
    hasPrevPage: Boolean(pageResult.hasPrevPage),
    stats: {
      total: totalCount.totalDocs,
      confirmed: confirmedCount.totalDocs,
      pending: Math.max(totalCount.totalDocs - confirmedCount.totalDocs, 0),
    },
  };
}

/** Cap on how many subscribers a single CSV export may return. Above this we
 *  refuse the request so an accidental full-list export can't blow up memory. */
const EXPORT_ROW_CAP = 25_000;

/**
 * Stream every subscriber matching the given filter into a plain array, ready
 * for CSV encoding. Ignores pagination on purpose — the admin export button is
 * meant to hand a marketing lead the whole confirmed list. Bounded at
 * `EXPORT_ROW_CAP` to keep the export path predictable.
 */
export async function listSubscribersForExport(
  params: Pick<ListSubscribersParams, "q" | "status" | "subscribedFrom" | "subscribedTo"> = {}
): Promise<SubscriberEntry[]> {
  const payload = await getPayloadClient();

  const conditions: Where[] = [];
  if (params.q) conditions.push({ email: { like: params.q } });
  if (params.status === "confirmed") conditions.push({ confirmed: { equals: true } });
  else if (params.status === "pending") conditions.push({ confirmed: { equals: false } });
  if (params.subscribedFrom) {
    conditions.push({ createdAt: { greater_than_equal: toIsoFrom(params.subscribedFrom) } });
  }
  if (params.subscribedTo) {
    conditions.push({ createdAt: { less_than_equal: toIsoTo(params.subscribedTo) } });
  }

  const where: Where | undefined = conditions.length
    ? conditions.length === 1 ? conditions[0] : { and: conditions }
    : undefined;

  const result = await payload.find({
    collection: "subscribers",
    where,
    sort: "-createdAt",
    limit: EXPORT_ROW_CAP,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  });

  return (result.docs as unknown as Array<Record<string, unknown>>).map(mapSubscriber);
}
