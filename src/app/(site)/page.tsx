import type { Metadata } from "next";
import { getHomepageForPublic } from "@/lib/content";
import { HomePage } from "@/modules/editorial/pages/HomePage";

const description =
  "Premium editorial and entertainment from Kiribé — film, television, opinion, news, and the cultural conversations that matter.";

/**
 * Homepage metadata explicit override so social shares of `/` don't inherit
 * the generic site defaults set on the root layout. The co-located
 * `opengraph-image.tsx` still owns the OG image (file-based wins), so the
 * home preview uses the hero article's artwork when available.
 */
export const metadata: Metadata = {
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    description,
  },
  twitter: {
    card: "summary_large_image",
    description,
  },
};

export default async function Page() {
  const data = await getHomepageForPublic();
  return <HomePage data={data} />;
}
