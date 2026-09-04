import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";
import { getClientIp } from "./client-ip";

// Fire once per serverless cold start so a missing secret shows up in the
// Vercel logs at boot — not silently as a 503 that no one reads.
if (!process.env.CRON_SECRET) {
  console.warn(
    "[cron] CRON_SECRET is not set — all cron endpoints will return 503. " +
      "Set CRON_SECRET in the Vercel project env so scheduled publishes and " +
      "sitemap generation can run."
  );
}

export function requireCronSecret(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn("[cron] refused request — CRON_SECRET is not configured");
    return apiError("Cron secret not configured", 503);
  }

  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token || token !== secret) {
    return apiError("Unauthorized", 401);
  }

  return null;
}

export { getClientIp };
