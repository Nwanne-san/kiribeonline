import { z } from "zod";

const idSchema = z.union([z.string(), z.number()]).transform((v) => String(v));

/**
 * Slugs land in a public URL (`/<slug>`), so keep them to the lowercase
 * kebab shape the slug hook produces. Rejecting `/` here also stops an editor
 * from minting a nested path the `[slug]` segment could never resolve.
 */
const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers, and single hyphens"
  );

/**
 * Lexical editor state is an opaque nested document — validating its internals
 * here would duplicate Payload's own richText validation and break whenever
 * lexical's schema moves. Accept any object and let Payload reject a malformed
 * one.
 */
const richTextSchema = z.record(z.string(), z.unknown());

const seoSchema = z.object({
  title: z.string().trim().max(120).optional().or(z.literal("")),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  ogImageId: idSchema.nullable().optional(),
});

export const pageCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: slugSchema.optional(),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  body: richTextSchema.optional().nullable(),
  status: z.enum(["draft", "published"]).default("draft"),
  showInFooter: z.boolean().optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  seo: seoSchema.optional(),
});

/** Every field optional — a PATCH only touches what the client actually sent. */
export const pageUpdateSchema = pageCreateSchema.partial();

export type PageCreateInput = z.infer<typeof pageCreateSchema>;
export type PageUpdateInput = z.infer<typeof pageUpdateSchema>;
