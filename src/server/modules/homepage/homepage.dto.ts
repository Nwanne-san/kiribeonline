import { z } from "zod";

const idSchema = z.union([z.string(), z.number()]).transform((v) => String(v));

export const HOMEPAGE_LAYOUTS = [
  "grid-3",
  "grid-2",
  "list",
  "hero-plus-grid",
] as const;

const categoryModuleSchema = z.object({
  enabled: z.boolean().optional().default(true),
  category: idSchema,
  sectionTitle: z.string().trim().max(120).optional().or(z.literal("")),
  layout: z.enum(HOMEPAGE_LAYOUTS).optional().default("grid-3"),
  maxItems: z.number().int().min(1).max(12).optional().default(3),
  articleSelection: z.enum(["auto", "manual"]).optional().default("auto"),
  manualArticles: z.array(idSchema).optional().default([]),
  sortOrder: z.number().int().min(0).max(999).optional().default(0),
  accentColor: z.string().trim().max(20).optional().or(z.literal("")),
});

const editorsPickSchema = z.object({
  article: idSchema,
  sortOrder: z.number().int().min(0).max(999).optional().default(0),
});

export const homepageSchema = z.object({
  heroArticle: idSchema.optional().nullable(),
  editorsPicks: z.array(editorsPickSchema).max(5).optional().default([]),
  categoryModules: z.array(categoryModuleSchema).optional().default([]),
});

export type HomepageFormInput = z.input<typeof homepageSchema>;
export type HomepageFormOutput = z.output<typeof homepageSchema>;

// --- API input schema (admin route payload) ---
export const homepagePatchSchema = z.object({
  heroArticleId: z.union([z.string(), z.number()]).nullable().optional(),
  editorsPicks: z
    .array(
      z.object({
        articleId: z.union([z.string(), z.number()]),
        sortOrder: z.number().default(0),
      })
    )
    .max(5)
    .optional(),
  categoryModules: z
    .array(
      z.object({
        enabled: z.boolean().optional(),
        categoryId: z.union([z.string(), z.number()]),
        sectionTitle: z.string().optional(),
        layout: z.enum(["grid-3", "grid-2", "list", "hero-plus-grid"]).optional(),
        maxItems: z.number().min(1).max(12).optional(),
        articleSelection: z.enum(["auto", "manual"]).optional(),
        manualArticleIds: z.array(z.union([z.string(), z.number()])).optional(),
        sortOrder: z.number().optional(),
        accentColor: z.string().optional(),
      })
    )
    .optional(),
  spotlightCreatorId: z.union([z.string(), z.number()]).nullable().optional(),
  featuredCreators: z
    .array(
      z.object({
        creatorId: z.union([z.string(), z.number()]),
        sortOrder: z.number().default(0),
      })
    )
    .max(4)
    .optional(),
  reelsEnabled: z.boolean().optional(),
  reelIds: z.array(z.union([z.string(), z.number()])).optional(),
  archiveCtaEnabled: z.boolean().optional(),
});
