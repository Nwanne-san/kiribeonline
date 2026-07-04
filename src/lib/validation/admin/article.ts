import { z } from "zod";

export const ARTICLE_STATUSES = [
  "draft",
  "scheduled",
  "published",
  "archived",
] as const;

const idSchema = z.union([z.string(), z.number()]).transform((v) => String(v));

const seoSchema = z
  .object({
    title: z.string().trim().max(120).optional().or(z.literal("")),
    description: z.string().trim().max(300).optional().or(z.literal("")),
    ogImage: idSchema.optional().nullable(),
  })
  .optional();

export const articleSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200),
    slug: z
      .string()
      .trim()
      .max(200)
      .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers, and dashes")
      .optional()
      .or(z.literal("")),
    excerpt: z.string().trim().max(500).optional().or(z.literal("")),
    body: z.string().trim().min(1, "Body is required"),
    heroImage: idSchema.optional().nullable(),
    categories: z.array(idSchema).optional().default([]),
    tags: z.array(idSchema).optional().default([]),
    status: z.enum(ARTICLE_STATUSES).default("draft"),
    publishedAt: z.string().datetime().optional().nullable().or(z.literal("")),
    featured: z.boolean().optional().default(false),
    featuredPriority: z.number().int().min(0).max(999).optional().default(0),
    seo: seoSchema,
  })
  .superRefine((data, ctx) => {
    if (data.status === "scheduled" && !data.publishedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publishedAt"],
        message: "Scheduled articles require a publish date.",
      });
    }
  });

export const articleUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    slug: z
      .string()
      .trim()
      .max(200)
      .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers, and dashes")
      .optional(),
    excerpt: z.string().trim().max(500).optional().or(z.literal("")),
    body: z.string().trim().min(1).optional(),
    heroImage: idSchema.optional().nullable(),
    categories: z.array(idSchema).optional(),
    tags: z.array(idSchema).optional(),
    status: z.enum(ARTICLE_STATUSES).optional(),
    publishedAt: z.string().datetime().optional().nullable().or(z.literal("")),
    featured: z.boolean().optional(),
    featuredPriority: z.number().int().min(0).max(999).optional(),
    seo: seoSchema,
  })
  .superRefine((data, ctx) => {
    if (data.status === "scheduled" && !data.publishedAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publishedAt"],
        message: "Scheduled articles require a publish date.",
      });
    }
  });

export type ArticleFormInput = z.input<typeof articleSchema>;
export type ArticleFormOutput = z.output<typeof articleSchema>;
export type ArticleUpdateInput = z.output<typeof articleUpdateSchema>;
