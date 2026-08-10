import type { NextRequest } from "next/server";
import { handleAdminRouteError, requireAdminCapability } from "@/server/auth";
import { listSubscribersForExport } from "@/server/modules/subscribers";

export const dynamic = "force-dynamic";

/** RFC 4180: quote when a field contains a quote, comma, CR, or LF; escape
 *  literal quotes by doubling. Cheap, correct, no dependency. */
function csvField(value: string | undefined): string {
  if (value === undefined || value === null) return "";
  const needsQuoting = /[",\r\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}

function csvRow(fields: (string | undefined)[]): string {
  return fields.map(csvField).join(",");
}

/**
 * Stream every matching subscriber as a CSV attachment. Respects the current
 * admin filter (q, status) so "Export CSV" always matches what the operator
 * has on screen.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminCapability(request, "subscribers:manage");

    const url = request.nextUrl;
    const q = url.searchParams.get("q") ?? undefined;
    const statusParam = url.searchParams.get("status") ?? undefined;
    const status =
      statusParam === "confirmed" || statusParam === "pending" ? statusParam : undefined;
    const subscribedFrom = url.searchParams.get("subscribedFrom") ?? undefined;
    const subscribedTo = url.searchParams.get("subscribedTo") ?? undefined;

    const subs = await listSubscribersForExport({ q, status, subscribedFrom, subscribedTo });

    const header = csvRow([
      "Email",
      "Status",
      "Source",
      "Consent",
      "Subscribed at",
      "Confirmed at",
    ]);
    const body = subs
      .map((s) =>
        csvRow([
          s.email,
          s.confirmed ? "confirmed" : "pending",
          s.source,
          s.consent ? "yes" : "no",
          s.createdAt,
          s.confirmedAt,
        ]),
      )
      .join("\n");
    // Leading BOM so Excel opens UTF-8 correctly.
    const csv = `﻿${header}\n${body}\n`;

    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `kiribe-subscribers-${stamp}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
