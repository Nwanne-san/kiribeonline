/** Longest-edge cap for uploads, mirroring the Media collection `resizeOptions`
 *  server-side cap so we don't ship pixels the server will only throw away. */
export const CLIENT_MAX_EDGE = 2560;

/** WebP quality used when re-encoding a downscaled image client-side. */
const WEBP_QUALITY = 0.85;

/** Formats we never re-encode: GIF (would lose animation) and WebP (already the
 *  target format — re-encoding only loses quality). */
const SKIP_DOWNSCALE_TYPES = new Set(["image/gif", "image/webp"]);

export type ImageDimensions = { width: number; height: number };

/**
 * Downscale an image File to `CLIENT_MAX_EDGE` on its longest edge and re-encode
 * as WebP, entirely in the browser. Returns the original File unchanged when it
 * is already small enough, is a skipped type (GIF/WebP), or when the canvas
 * pipeline is unavailable — callers always get a usable File.
 */
export async function downscaleImage(file: File): Promise<File> {
  if (SKIP_DOWNSCALE_TYPES.has(file.type)) return file;
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    // `from-image` bakes the EXIF orientation into the pixels; without it a
    // portrait phone photo re-encodes sideways (canvas drops EXIF metadata).
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return file;
  }

  try {
    const longest = Math.max(bitmap.width, bitmap.height);
    if (longest <= CLIENT_MAX_EDGE) return file;

    const scale = CLIENT_MAX_EDGE / longest;
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", WEBP_QUALITY)
    );
    if (!blob) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp", lastModified: Date.now() });
  } finally {
    bitmap.close?.();
  }
}

/** Read an image File's intrinsic pixel dimensions, or null if it can't decode. */
export async function readImageDimensions(file: File): Promise<ImageDimensions | null> {
  if (typeof createImageBitmap !== "function") return null;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close?.();
    return dimensions;
  } catch {
    return null;
  }
}
