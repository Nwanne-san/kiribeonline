import type { NextRequest } from "next/server";
import sharp from "sharp";
import { apiError, apiSuccess } from "@/lib/api";
import {
  handleAdminRouteError,
  requireAdminUserFromRequest,
  requireAdminWriteCapability,
} from "@/server/auth";
import { MAX_IMAGE_PIXELS, MAX_UPLOAD_BYTES } from "@/constants";
import { listMedia } from "@/server/modules/media";
import { getPayloadClient } from "@/lib/payload/get-payload";

export const dynamic = "force-dynamic";

/** Server-side whitelist — never trust the collection config or client MIME
 *  alone. Mirrors the Media collection `upload.mimeTypes`. */
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/** Map sharp's detected format to the MIME we accept, for magic-byte checks. */
const SHARP_FORMAT_TO_MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(request: NextRequest) {
  try {
    await requireAdminUserFromRequest(request);
    const { searchParams } = new URL(request.url);
    const result = await listMedia({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      q: searchParams.get("q"),
    });
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
      return apiError("File is required.", 400);
    }
    if (!alt) {
      return apiError("Alt text is required.", 400);
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return apiError("Unsupported file type. Upload a JPG, PNG, WebP, or GIF image.", 400);
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return apiError(`File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB upload limit.`, 413);
    }

    const payload = await getPayloadClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    // Magic-byte check: decode the header and confirm the real format matches an
    // allowed type. Blocks a mislabelled or non-image payload slipping through on
    // a spoofed Content-Type. Cheap — sharp only reads metadata, not all pixels.
    let detectedMime: string | undefined;
    try {
      const { format } = await sharp(buffer, {
        limitInputPixels: MAX_IMAGE_PIXELS,
        failOn: "error",
      }).metadata();
      detectedMime = format ? SHARP_FORMAT_TO_MIME[format] : undefined;
    } catch {
      detectedMime = undefined;
    }
    if (!detectedMime || !ALLOWED_MIME.has(detectedMime)) {
      return apiError("File is not a valid image.", 400);
    }

    const doc = await payload.create({
      collection: "media",
      data: { alt },
      file: {
        data: buffer,
        // Store what the bytes actually are, not what the client claimed.
        mimetype: detectedMime,
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
