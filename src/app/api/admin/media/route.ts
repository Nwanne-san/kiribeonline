import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWriteCapability,
} from "@/server/auth";
import { MAX_UPLOAD_BYTES } from "@/constants";
import { listMedia } from "@/server/modules/media";
import { getPayloadClient } from "@/lib/payload/get-payload";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    const result = await listMedia();
    return apiSuccess(result);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminWriteCapability(request, "media:upload");
    const formData = await request.formData();
    const file = formData.get("file");
    const alt = String(formData.get("alt") ?? "").trim();

    if (!(file instanceof File)) {
      throw new Error("File is required.");
    }
    if (!alt) {
      throw new Error("Alt text is required.");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: `File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB upload limit.` },
        { status: 413 }
      );
    }

    const payload = await getPayloadClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const doc = await payload.create({
      collection: "media",
      data: { alt },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      overrideAccess: true,
    });

    return apiSuccess(doc);
  } catch (error) {
    return handleAdminRouteError(error);
  }
}
