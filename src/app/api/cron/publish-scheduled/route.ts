import type { NextRequest } from "next/server";
import { requireCronSecret } from "@/server/auth";
import { apiSuccess } from "@/lib/api";
import { publishScheduledArticles } from "@/services/cron.service";

export async function GET(request: NextRequest) {
  const authError = requireCronSecret(request);
  if (authError) return authError;

  console.info("[cron] publish-scheduled started");
  const count = await publishScheduledArticles();

  return apiSuccess({ published: count }, `Published ${count} scheduled articles`);
}
