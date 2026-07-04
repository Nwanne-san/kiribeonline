import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import { handleAdminRouteError, requireAdminWrite } from "@/lib/auth";
import { deleteMedia } from "@/lib/admin";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminWrite(request);
    const { id } = await params;
    await deleteMedia(id);
    return apiSuccess(null, "Image deleted");
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
