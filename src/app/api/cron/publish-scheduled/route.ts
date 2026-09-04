import type { NextRequest } from "next/server";
import { requireCronSecret } from "@/server/auth";
import { apiSuccess } from "@/lib/api";
import { publishScheduledArticles } from "@/services/cron.service";

export async function GET(request: NextRequest) {
  const authError = requireCronSecret(request);
  if (authError) return authError;

  const startedAt = new Date().toISOString();
  console.info(`[cron] publish-scheduled started at ${startedAt}`);
  const result = await publishScheduledArticles();
  console.info(
    `[cron] publish-scheduled finished at ${new Date().toISOString()} — ` +
      `${result.promoted}/${result.candidates} promoted`
  );

  return apiSuccess(
    { published: result.promoted, candidates: result.candidates, slugs: result.promotedSlugs },
    `Published ${result.promoted} scheduled articles`
  );
}
