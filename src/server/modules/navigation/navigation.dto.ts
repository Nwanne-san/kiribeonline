import { z } from "zod";
import { NAV_MAX_HEADER_LINKS } from "@/constants";

/**
 * Hrefs are rendered straight into the public header/footer, so only allow
 * site-relative paths and absolute http(s) URLs. This rejects `javascript:`,
 * `data:`, and protocol-relative `//evil.com` — an editor-controlled string
 * reaching an anchor `href` is a stored-XSS / open-redirect surface otherwise.
 */
const hrefSchema = z
  .string()
  .trim()
  .min(1, "URL is required")
  .max(300)
  .refine(
    (value) =>
      (value.startsWith("/") && !value.startsWith("//")) ||
      /^https?:\/\//i.test(value),
    "Use a site path like /about or a full https:// URL"
  );

const navLinkSchema = z.object({
  label: z.string().trim().min(1, "Label is required").max(60),
  href: hrefSchema,
  visible: z.boolean().default(true),
});

export const navigationPatchSchema = z.object({
  headerLinks: z
    .array(navLinkSchema)
    .max(
      NAV_MAX_HEADER_LINKS,
      `The header holds at most ${NAV_MAX_HEADER_LINKS} links`
    )
    .optional(),
  footerColumns: z
    .array(
      z.object({
        title: z.string().trim().min(1, "Column title is required").max(60),
        links: z.array(navLinkSchema).max(12).default([]),
      })
    )
    .max(4, "The footer holds at most 4 columns")
    .optional(),
});

export type NavigationPatchInput = z.infer<typeof navigationPatchSchema>;
