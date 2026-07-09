import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers, and dashes")
    .optional()
    .or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  displayOrder: z.number().int().min(0).max(999).optional().default(0),
});

export const categoryUpdateSchema = categorySchema.partial();

export type CategoryFormInput = z.input<typeof categorySchema>;
export type CategoryFormOutput = z.output<typeof categorySchema>;

// --- API input schema (admin route payload) ---
export const categoryInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
  brandColor: z.string().optional(),
  showInNav: z.boolean().optional(),
});
