import { z } from "zod";

export const articleStatusSchema = z.enum(["draft", "scheduled", "published", "archived"]);

export const articleInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  bodyText: z.string().min(1).optional(),
  body: z.record(z.unknown()).optional(),
  categoryIds: z.array(z.union([z.string(), z.number()])).optional(),
  tagIds: z.array(z.union([z.string(), z.number()])).optional(),
  heroImageId: z.union([z.string(), z.number()]).nullable().optional(),
  status: articleStatusSchema.default("draft"),
  publishedAt: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  featuredPriority: z.number().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogImageId: z.union([z.string(), z.number()]).nullable().optional(),
    })
    .optional(),
}).refine((data) => Boolean(data.body) || Boolean(data.bodyText?.trim()), {
  message: "Body is required",
  path: ["body"],
});

const articleBaseSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  bodyText: z.string().min(1).optional(),
  body: z.record(z.unknown()).optional(),
  categoryIds: z.array(z.union([z.string(), z.number()])).optional(),
  tagIds: z.array(z.union([z.string(), z.number()])).optional(),
  heroImageId: z.union([z.string(), z.number()]).nullable().optional(),
  status: articleStatusSchema.optional(),
  publishedAt: z.string().nullable().optional(),
  featured: z.boolean().optional(),
  featuredPriority: z.number().optional(),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogImageId: z.union([z.string(), z.number()]).nullable().optional(),
    })
    .optional(),
});

export const articlePatchSchema = articleBaseSchema.partial();

export type ArticleInput = z.infer<typeof articleInputSchema>;

export const categoryInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
  brandColor: z.string().optional(),
  showInNav: z.boolean().optional(),
});

export const tagInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  brandColor: z.string().optional(),
});

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

export const settingsPatchSchema = z.object({
  siteName: z.string().min(1).optional(),
  logoId: z.union([z.string(), z.number()]).nullable().optional(),
  socialLinks: z.array(z.object({ platform: z.string(), url: z.string().url() })).optional(),
  seoDefaults: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogImageId: z.union([z.string(), z.number()]).nullable().optional(),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
