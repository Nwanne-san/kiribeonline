import { getPayloadClient } from "@/lib/payload/get-payload";
import type { SettingsFormOutput } from "@/lib/validation/admin/settings";

export async function getSiteSettings() {
  const payload = await getPayloadClient();
  return payload.findGlobal({
    slug: "site-settings",
    depth: 1,
    overrideAccess: true,
  });
}

export async function updateSiteSettings(input: SettingsFormOutput) {
  const payload = await getPayloadClient();

  const data = {
    siteName: input.siteName,
    logo: input.logo || null,
    brandColors: input.brandColors
      ? {
          mustard: input.brandColors.mustard || undefined,
          burgundy: input.brandColors.burgundy || undefined,
        }
      : undefined,
    socialLinks: (input.socialLinks ?? []).map((link) => ({
      platform: link.platform,
      url: link.url,
    })),
    seoDefaults: input.seoDefaults
      ? {
          title: input.seoDefaults.title || undefined,
          description: input.seoDefaults.description || undefined,
          ogImage: input.seoDefaults.ogImage || null,
        }
      : undefined,
  };

  return payload.updateGlobal({
    slug: "site-settings",
    data: data as never,
    depth: 1,
    overrideAccess: true,
  });
}
