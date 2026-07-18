import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWriteCapability,
} from "@/server/auth";
import { createTag, listTags } from "@/server/modules/tags";
import { tagInputSchema } from "@/server/modules/tags/tags.dto";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    const result = await listTags();
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminWriteCapability(request, "taxonomy:manage");
    const body = await request.json();
    const input = parseBody(tagInputSchema, body);
    const doc = await createTag(input);
    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
