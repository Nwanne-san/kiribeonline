import { unstable_cache } from "next/cache";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { resolveMediaUrl } from "@/lib/storage/media-url";
import { getNavigationChrome } from "@/server/modules/navigation";
import type {
  MediaAsset,
  SiteNavigation,
  SiteSettings,
} from "@/modules/shared/types/content";

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

/**
 * Drops rows an admin has toggled off and strips the editing-only fields, so
 * the header/footer render exactly what's visible and nothing more. Header
 * links arrive from the service already capped at `NAV_MAX_HEADER_LINKS`.
 */
async function fetchNavigation(): Promise<SiteNavigation | undefined> {
  try {
    const chrome = await getNavigationChrome();
    return {
      headerLinks: chrome.headerLinks
        .filter((link) => link.visible && link.label && link.href)
        .map(({ label, href }) => ({ label, href })),
      footerColumns: chrome.footerColumns
        .map((col) => ({
          title: col.title,
          links: col.links
            .filter((link) => link.visible && link.label && link.href)
            .map(({ label, href }) => ({ label, href })),
        }))
        .filter((col) => col.title && col.links.length > 0),
    };
  } catch {
    // Chrome is decoration — never let it take down the layout.
    return undefined;
  }
}

async function fetchSiteSettingsUncached(): Promise<SiteSettings> {
  try {
    const payload = await getPayloadClient();
    const [raw, navigation] = await Promise.all([
      payload.findGlobal({
        slug: "site-settings",
        depth: 1,
      }) as Promise<RawSettings>,
      fetchNavigation(),
    ]);

    return {
      navigation,
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
