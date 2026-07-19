import type { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api";
import { handleAdminRouteError, requireAdminWriteCapability } from "@/server/auth";
import { deleteMedia, findMediaReferences } from "@/server/modules";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    await requireAdminWriteCapability(request, "media:delete");
    const { id } = await params;

    // Block deletion while the asset is referenced by a queryable relationship
    // (article hero/og, reel thumbnail, creator portrait). Body-embedded images
    // in Lexical richtext are not scanned yet (see findMediaReferences / PLAN
    // Phase E), so this reduces — not fully eliminates — broken published
    // images. The UI surfaces `errors.references`.
    const references = await findMediaReferences(id);
    if (references.length > 0) {
      return apiError(
        "This image is still in use and can't be deleted. Remove it from the items below first.",
        409,
        { references: references.map((ref) => `${ref.type}: ${ref.title}`) }
      );
    }

    await deleteMedia(id);
    return apiSuccess(null, "Image deleted");
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
