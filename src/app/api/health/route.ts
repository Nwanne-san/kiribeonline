import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/auth";
import { DEFAULT_HEALTH_RATE_LIMIT, RATE_LIMIT_WINDOW_MS } from "@/constants";
import { rateLimitForEndpoint, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = await rateLimitForEndpoint(
    "health",
    ip,
    DEFAULT_HEALTH_RATE_LIMIT,
    RATE_LIMIT_WINDOW_MS
  );
  if (!limit.allowed) {
    return tooManyRequests(limit);
  }

  // Public liveness only — do not leak service configuration to unauthenticated callers.
  return NextResponse.json({ ok: true });
}
