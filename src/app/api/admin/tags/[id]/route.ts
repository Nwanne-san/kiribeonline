import type { NextRequest } from "next/server";
import { apiSuccess } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminWriteCapability,
} from "@/server/auth";
import { deleteTag } from "@/server/modules/tags";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteProps) {
  try {
    await requireAdminWriteCapability(request, "taxonomy:manage");
    const { id } = await params;
    const result = await deleteTag(id);
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
