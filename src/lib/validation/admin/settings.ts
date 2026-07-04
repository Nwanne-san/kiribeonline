import { z } from "zod";

const idSchema = z.union([z.string(), z.number()]).transform((v) => String(v));

const socialLinkSchema = z.object({
  platform: z.string().trim().min(1, "Platform is required").max(60),
  url: z.string().trim().url("Enter a valid URL").max(300),
});

export const settingsSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required").max(120),
  logo: idSchema.optional().nullable(),
  brandColors: z
    .object({
      mustard: z.string().trim().max(20).optional().or(z.literal("")),
      burgundy: z.string().trim().max(20).optional().or(z.literal("")),
    })
    .optional(),
  socialLinks: z.array(socialLinkSchema).optional().default([]),
  seoDefaults: z
    .object({
      title: z.string().trim().max(120).optional().or(z.literal("")),
      description: z.string().trim().max(300).optional().or(z.literal("")),
      ogImage: idSchema.optional().nullable(),
    })
    .optional(),
});

export type SettingsFormInput = z.input<typeof settingsSchema>;
export type SettingsFormOutput = z.output<typeof settingsSchema>;
