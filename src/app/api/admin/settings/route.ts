import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWrite,
} from "@/lib/auth";
import { getSiteSettingsAdmin, updateSiteSettingsAdmin } from "@/lib/admin/homepage";
import { settingsPatchSchema } from "@/lib/validation/admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    const data = await getSiteSettingsAdmin();
    return apiSuccess(data);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdminWrite(request);
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
    const updated = await updateSiteSettingsAdmin(data);
    return apiSuccess(updated);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
