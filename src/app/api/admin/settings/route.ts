import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWriteCapability,
} from "@/server/auth";
import { getSiteSettings, updateSiteSettings } from "@/server/modules/settings";
import { settingsPatchSchema } from "@/server/modules/settings/settings.dto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    const data = await getSiteSettings();
    return apiSuccess(data);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminWriteCapability(request, "settings:manage");
    const body = await request.json();
    const input = parseBody(settingsPatchSchema, body);
    const data: Record<string, unknown> = {};
    if (input.siteName) data.siteName = input.siteName;
    if (input.logoId !== undefined) data.logo = input.logoId;
    if (input.socialLinks) data.socialLinks = input.socialLinks;
    if (input.seoDefaults) {
      data.seoDefaults = {
        title: input.seoDefaults.title,
        description: input.seoDefaults.description,
        ogImage: input.seoDefaults.ogImageId ?? undefined,
      };
    }
    const updated = await updateSiteSettings(data);
    return apiSuccess(updated);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
