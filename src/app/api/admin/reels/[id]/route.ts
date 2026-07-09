import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWrite,
} from "@/server/auth";
import { deleteReelAdmin, getReelAdmin, updateReelAdmin } from "@/server/modules/reels";
import { z } from "zod";

export const dynamic = "force-dynamic";

const reelPatchSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().optional(),
  label: z.string().min(1).optional(),
  platform: z.enum(["instagram", "tiktok", "youtube"]).optional(),
  thumbnailId: z.union([z.string(), z.number()]).optional(),
  externalUrl: z.string().url().optional(),
  published: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUserFromRequest(_request);
    const { id } = await params;
    return apiSuccess(await getReelAdmin(id));
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminWrite(request);
    const { id } = await params;
    const body = await request.json();
    const input = parseBody(reelPatchSchema, body);
    return apiSuccess(await updateReelAdmin(id, input));
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminWrite(request);
    const { id } = await params;
    return apiSuccess(await deleteReelAdmin(id));
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
