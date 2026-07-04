import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWrite,
} from "@/lib/auth";
import { createReelAdmin, listReelsAdmin } from "@/lib/admin/reels";
import { z } from "zod";

export const dynamic = "force-dynamic";

const reelInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  label: z.string().min(1),
  platform: z.enum(["instagram", "tiktok", "youtube"]),
  thumbnailId: z.union([z.string(), z.number()]),
  externalUrl: z.string().url(),
  published: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    return apiSuccess(await listReelsAdmin());
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminWrite(request);
    const body = await request.json();
    const input = parseBody(reelInputSchema, body);
    return apiSuccess(await createReelAdmin(input));
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
