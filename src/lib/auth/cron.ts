import type { NextRequest } from "next/server";
import { apiError } from "@/lib/api/response";
import { getClientIp } from "./client-ip";

export function requireCronSecret(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
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
