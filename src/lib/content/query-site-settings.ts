import { unstable_cache } from "next/cache";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { resolveMediaUrl } from "@/lib/storage/media-url";
import type { MediaAsset, SiteSettings } from "@/modules/shared/types/content";

type RawMedia = { id: string | number; url?: string | null; filename?: string | null; alt?: string | null };

type RawSettings = {
  siteName?: string | null;
  logo?: RawMedia | string | number | null;
  brandColors?: { mustard?: string | null; burgundy?: string | null } | null;
  socialLinks?: Array<{ platform?: string | null; url?: string | null }> | null;
  seoDefaults?: {
    title?: string | null;
    description?: string | null;
    ogImage?: RawMedia | string | number | null;
  } | null;
};

function mapMedia(value: unknown): MediaAsset | undefined {
  if (!value || typeof value !== "object") return undefined;
  const media = value as RawMedia;
  const url = resolveMediaUrl(media as { url?: string | null; filename?: string | null });
  if (!url) return undefined;
  return { id: String(media.id), url, alt: media.alt ?? undefined };
}

export async function getSiteSettingsForPublic(): Promise<SiteSettings> {
  return getSiteSettingsCached();
}

const getSiteSettingsCached = unstable_cache(
  fetchSiteSettingsUncached,
  ["site-settings-public"],
  { tags: ["site-settings"], revalidate: 60 }
);

async function fetchSiteSettingsUncached(): Promise<SiteSettings> {
  try {
    const payload = await getPayloadClient();
    const raw = (await payload.findGlobal({
      slug: "site-settings",
      depth: 1,
    })) as RawSettings;

    return {
      siteName: raw.siteName ?? "Kiribe Online",
      logo: mapMedia(raw.logo),
      brandColors: {
        mustard: raw.brandColors?.mustard ?? undefined,
        burgundy: raw.brandColors?.burgundy ?? undefined,
      },
      socialLinks: (raw.socialLinks ?? [])
        .filter((link): link is { platform: string; url: string } =>
          Boolean(link?.platform) && Boolean(link?.url)
        )
        .map((link) => ({ platform: link.platform, url: link.url })),
      seoDefaults: raw.seoDefaults
        ? {
            title: raw.seoDefaults.title ?? undefined,
            description: raw.seoDefaults.description ?? undefined,
            ogImage: mapMedia(raw.seoDefaults.ogImage)?.url,
          }
        : undefined,
    };
  } catch {
    return { siteName: "Kiribe Online" };
  }
}
