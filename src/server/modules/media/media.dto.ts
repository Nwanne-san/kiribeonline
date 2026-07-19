import { z } from "zod";

/**
 * Metadata that editors can update after the file has been uploaded.
 * Alt is required and non-empty when present — a missing key leaves the value
 * untouched, but an explicit empty string is rejected so screen-reader
 * accessibility can't be silently downgraded on an existing asset.
 */
export const mediaPatchSchema = z
  .object({
    alt: z.string().trim().min(1, "Alt text is required.").optional(),
    caption: z.string().trim().optional(),
    credit: z.string().trim().optional(),
  })
  .refine(
    (data) =>
      data.alt !== undefined ||
      data.caption !== undefined ||
      data.credit !== undefined,
    { message: "Nothing to update." },
  );

export type MediaPatchInput = z.infer<typeof mediaPatchSchema>;
