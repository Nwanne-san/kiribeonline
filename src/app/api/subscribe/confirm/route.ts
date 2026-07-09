import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { APP_URL } from "@/lib/email/resend";
import { getClientIp } from "@/server/auth";
import {
  DEFAULT_SUBSCRIBE_CONFIRM_RATE_LIMIT,
  RATE_LIMIT_WINDOW_15_MIN_MS,
} from "@/constants";
import { rateLimitForEndpoint, tooManyRequests } from "@/lib/rate-limit";
import { confirmSubscriber } from "@/services/subscribe.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = await rateLimitForEndpoint(
    "subscribe_confirm",
    ip,
    DEFAULT_SUBSCRIBE_CONFIRM_RATE_LIMIT,
    RATE_LIMIT_WINDOW_15_MIN_MS
  );
  if (!limit.allowed) {
    return tooManyRequests(limit);
  }

  const token = request.nextUrl.searchParams.get("token") ?? "";
  const result = await confirmSubscriber(token);
  const url = new URL("/", APP_URL);
  if (result.ok) {
    url.searchParams.set(
      "subscribed",
      result.status === "already-confirmed" ? "already" : "confirmed"
    );
  } else {
    url.searchParams.set("subscribed", "invalid");
  }
  return NextResponse.redirect(url, { status: 302 });
}
