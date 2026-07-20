import type { Metadata } from "next";
import { Open_Sans, Outfit } from "next/font/google";
import { GoogleAnalytics } from "@/modules/shared/components/GoogleAnalytics";
import { getSiteSettingsForPublic } from "@/lib/content";
import { getSiteBaseUrl } from "@/lib/seo/site-url";
import { Analytics } from "@vercel/analytics/next"
import Providers from "./providers";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-headline",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const SITE_NAME = "Kiribé Online";
const SITE_DESCRIPTION =
  "Premium editorial and entertainment — film, television, opinion, news, and spotlight features.";

/**
 * Root metadata pulls the site-wide title / description / OG image from the
 * `SiteSettings.seoDefaults` global so editors can update social previews
 * without a deploy. The read is `unstable_cache`-wrapped in
 * `getSiteSettingsForPublic`, so we're not hitting the DB per request.
 *
 * Every field falls back to a safe literal when settings are missing or the
 * DB read fails, so the site keeps its metadata even in a degraded state.
 * Page-level `generateMetadata` still wins (Next merges child metadata over
 * root) — this only sets defaults.
 */
export async function generateMetadata(): Promise<Metadata> {
  let seo: { title?: string; description?: string; ogImage?: string } = {};
  try {
    const settings = await getSiteSettingsForPublic();
    seo = settings.seoDefaults ?? {};
  } catch {
    // Swallow — metadata generation must not throw during a page render.
  }

  const title = seo.title?.trim() || SITE_NAME;
  const description = seo.description?.trim() || SITE_DESCRIPTION;
  const ogImages = seo.ogImage ? [{ url: seo.ogImage }] : undefined;

  return {
    metadataBase: new URL(getSiteBaseUrl()),
    title: {
      default: title,
      template: `%s | ${SITE_NAME}`,
    },
    description,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      locale: "en_US",
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImages ? { images: ogImages } : {}),
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.variable} ${openSans.variable} antialiased`}>
        <GoogleAnalytics />
        <Analytics />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
