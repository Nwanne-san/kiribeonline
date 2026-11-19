import { downscaleImage } from "@/lib/media/downscale-image";
import { MAX_UPLOAD_BYTES } from "@/constants";
import type { AdminMediaItem, AdminMediaRef } from "@/server/modules";

const ACCEPTED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export type InlineUploadError =
  | { kind: "unsupported-type"; file: File }
  | { kind: "too-large"; file: File }
  | { kind: "server"; file: File; message: string };

export type InlineUploadResult =
  | { ok: true; media: AdminMediaRef }
  | { ok: false; error: InlineUploadError };

/**
 * Upload a single image straight to R2 from the article editor without
 * surfacing it in the Media Library grid. Alt text is derived from the
 * filename (operator can edit the resulting UploadNode's alt after insertion).
 *
 * This is the "insert from device" / drop-onto-editor path — a fast lane
 * distinct from `MediaUploadForm`, which is tuned for curated library
 * uploads with hand-picked alt text.
 */
export async function uploadInlineImage(file: File): Promise<InlineUploadResult> {
  if (!ACCEPTED_MIME.has(file.type)) {
    return { ok: false, error: { kind: "unsupported-type", file } };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: { kind: "too-large", file } };
  }

  const optimized = await downscaleImage(file);
  if (optimized.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: { kind: "too-large", file } };
  }

  const altFromName = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  const alt = altFromName.length > 0 ? altFromName : "Inline image";

  const finalName = (file.name || "image").replace(/[/\\]/g, "-");
  const renamed = new File([optimized], finalName, { type: optimized.type });

  const formData = new FormData();
  formData.append("file", renamed);
  formData.append("alt", alt);
  // Keeps the upload off the Media Library grid — the article still renders
  // it fine, it just isn't catalogued among library-visible assets.
  formData.append("hiddenFromLibrary", "true");

  const response = await fetch("/api/admin/media", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    let message = "Upload failed.";
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload.message) message = payload.message;
    } catch {
      // Fall through — keep the generic message.
    }
    return { ok: false, error: { kind: "server", file, message } };
  }

  const body = (await response.json()) as
    | { data?: AdminMediaItem }
    | AdminMediaItem;
  const media: AdminMediaItem =
    "data" in body && body.data ? body.data : (body as AdminMediaItem);

  return {
    ok: true,
    media: { id: String(media.id), url: media.url, alt: media.alt ?? alt },
  };
}

/** Upload multiple files in parallel (up to `concurrency` at a time). Preserves
 *  input order in the returned results so callers can report per-file failures
 *  and insert successes in the order the operator picked. */
export async function uploadInlineImages(
  files: File[],
  concurrency = 3,
): Promise<InlineUploadResult[]> {
  const results: InlineUploadResult[] = new Array(files.length);
  let cursor = 0;

  async function worker() {
    while (cursor < files.length) {
      const index = cursor++;
      results[index] = await uploadInlineImage(files[index]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, files.length) },
    worker,
  );
  await Promise.all(workers);
  return results;
}
