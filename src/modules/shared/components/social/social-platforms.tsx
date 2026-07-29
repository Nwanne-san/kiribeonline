import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import type { SvgIconComponent } from "@mui/icons-material";
import {
  SOCIAL_PLATFORMS,
  normalizeSocialPlatform,
  type SocialPlatformKey,
} from "@/constants";
import type { SiteSettings } from "@/modules/shared/types/content";

/**
 * Icons for the platform keys defined in `@/constants/social.constants`. The keys
 * live in constants (server code validates against them); only the rendering half
 * lives here.
 */
export const SOCIAL_PLATFORM_ICONS: Record<SocialPlatformKey, SvgIconComponent> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  twitter: TwitterIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
  tiktok: MusicNoteIcon,
};

/** Legacy free-text values typed before the platform picker existed. */
const PLATFORM_ALIASES: Record<string, SocialPlatformKey> = {
  x: "twitter",
  xtwitter: "twitter",
  twitterx: "twitter",
};

export type SocialLinkItem = {
  /** Set when the stored platform maps to a known brand — drives the icon. */
  key?: SocialPlatformKey;
  label: string;
  href: string;
  Icon?: SvgIconComponent;
};

function toPlatformKey(value: string | undefined | null): SocialPlatformKey | undefined {
  if (!value) return undefined;
  const normalized = normalizeSocialPlatform(value);
  const letters = normalized.replace(/[^a-z]/g, "");
  const known = SOCIAL_PLATFORMS.find(
    (platform) => platform.key === normalized || platform.key === letters
  );
  return known?.key ?? PLATFORM_ALIASES[letters];
}

/** Only http(s) — a CMS text field must never be able to inject `javascript:`. */
function isSafeSocialHref(url: string): boolean {
  try {
    const { protocol } = new URL(url);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Site settings → renderable social links, in the order the admin arranged them.
 * Entries without a usable http(s) URL are dropped so no surface has to fall back
 * to a placeholder `#` href.
 */
export function resolveSocialLinks(
  socialLinks: SiteSettings["socialLinks"]
): SocialLinkItem[] {
  const seen = new Set<string>();
  const items: SocialLinkItem[] = [];

  for (const link of socialLinks ?? []) {
    const href = link.url?.trim();
    if (!href || !isSafeSocialHref(href)) continue;

    const key = toPlatformKey(link.platform);
    const label =
      SOCIAL_PLATFORMS.find((platform) => platform.key === key)?.label ??
      link.platform?.trim();
    if (!label) continue;

    const dedupeKey = key ?? label.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    items.push({ key, label, href, Icon: key ? SOCIAL_PLATFORM_ICONS[key] : undefined });
  }

  return items;
}

/** Icon-only surfaces (header rail, About page) — known brands in brand order. */
export function resolveSocialIconLinks(
  socialLinks: SiteSettings["socialLinks"]
): (SocialLinkItem & { key: SocialPlatformKey; Icon: SvgIconComponent })[] {
  const resolved = resolveSocialLinks(socialLinks);
  return SOCIAL_PLATFORMS.flatMap((platform) => {
    const match = resolved.find((item) => item.key === platform.key);
    return match
      ? [{ ...match, key: platform.key, Icon: SOCIAL_PLATFORM_ICONS[platform.key] }]
      : [];
  });
}
