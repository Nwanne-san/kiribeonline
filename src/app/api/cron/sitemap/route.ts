import type { NextRequest } from "next/server";
import { requireCronSecret } from "@/lib/auth";
import { apiSuccess } from "@/lib/api";
import { generateSitemapXml } from "@/services/cron.service";

export async function GET(request: NextRequest) {
  const authError = requireCronSecret(request);
  if (authError) return authError;

  console.info("[cron] sitemap started");

  const xml = await generateSitemapXml();

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function POST(request: NextRequest) {
  const authError = requireCronSecret(request);
  if (authError) return authError;

  console.info("[cron] sitemap started");
  const xml = await generateSitemapXml();

  return apiSuccess({ length: xml.length }, "Sitemap generated");
}
