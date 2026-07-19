import type { CollectionBeforeChangeHook } from "payload";
import sharp from "sharp";

/** Longest edge of the generated placeholder, in pixels. Kept tiny so the
 *  base64 string stays well under ~1KB and ships inline in the doc. */
const LQIP_EDGE = 16;

/**
 * Generate a low-quality image placeholder (LQIP) as a base64 WebP data URI on
 * upload, stored in `blurDataUrl`. next/image renders it (blurred + scaled up)
 * while the full image loads, giving a premium blur-up effect.
 *
 * Runs only when a new file is present (`req.file`) — updates that don't replace
 * the binary keep the existing placeholder. Failures are swallowed so a quirky
 * source image never blocks an otherwise-valid upload.
 */
export const generateBlurPlaceholder: CollectionBeforeChangeHook = async ({
  data,
  req,
}) => {
  const file = req.file;
  if (!file?.data || !Buffer.isBuffer(file.data)) {
    return data;
  }

  try {
    const buffer = await sharp(file.data)
      .resize(LQIP_EDGE, LQIP_EDGE, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 40 })
      .toBuffer();
    return {
      ...data,
      blurDataUrl: `data:image/webp;base64,${buffer.toString("base64")}`,
    };
  } catch {
    // Non-decodable source — leave blurDataUrl untouched rather than fail upload.
    return data;
  }
};
