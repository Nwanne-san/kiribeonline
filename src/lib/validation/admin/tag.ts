import { z } from "zod";

export const tagSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers, and dashes")
    .optional()
    .or(z.literal("")),
});

export const tagUpdateSchema = tagSchema.partial();

export type TagFormInput = z.input<typeof tagSchema>;
export type TagFormOutput = z.output<typeof tagSchema>;
