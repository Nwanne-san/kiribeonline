import type { NextRequest } from "next/server";
import { apiSuccess, parseBody } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWrite,
} from "@/lib/auth";
import { deleteCreatorAdmin, getCreatorAdmin, updateCreatorAdmin } from "@/lib/admin/creators";
import { z } from "zod";

export const dynamic = "force-dynamic";

const creatorPatchSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  role: z.string().min(1).optional(),
  bio: z.string().optional(),
  quote: z.string().optional(),
  portraitId: z.union([z.string(), z.number()]).optional(),
  badges: z.array(z.object({ label: z.string(), color: z.string().optional() })).optional(),
  achievements: z
    .array(z.object({ label: z.string(), value: z.string(), icon: z.string().optional() }))
    .optional(),
  featuredOnHomepage: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminUserFromRequest(_request);
    const { id } = await params;
    return apiSuccess(await getCreatorAdmin(id));
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminWrite(request);
    const { id } = await params;
    const body = await request.json();
    const input = parseBody(creatorPatchSchema, body);
    return apiSuccess(await updateCreatorAdmin(id, input));
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminWrite(request);
    const { id } = await params;
    return apiSuccess(await deleteCreatorAdmin(id));
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
