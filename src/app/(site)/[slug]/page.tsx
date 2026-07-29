import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedPageBySlug } from "@/lib/content";
import { breadcrumbListSchema, JsonLd } from "@/lib/seo/json-ld";
import { CmsPage } from "@/modules/marketing/pages/CmsPage";

/**
 * Catch-all for editor-authored CMS pages at `/<slug>`.
 *
 * Next resolves static segments before dynamic ones, so `/about`, `/contact`,
 * `/articles`, `/privacy`, `/terms`, `/search`, `/categories`, and `/tags` all
 * still hit their own routes — this only sees paths nothing else claimed.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) {
    // Unpublished/unknown slugs 404 — keep them out of the index either way.
    return { title: "Page not found", robots: { index: false, follow: false } };
  }

  const title = page.seo?.title || page.title;
  const description = page.seo?.description || page.excerpt || undefined;
  const url = `/${page.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    openGraph: {
      title: `${title} | Kiribé Online`,
      description,
      type: "article",
      url,
      ...(page.seo?.ogImage ? { images: [{ url: page.seo.ogImage }] } : {}),
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPublishedPageBySlug(slug);
  if (!page) notFound();

  return (
    <>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Home", url: "/" },
          { name: page.title, url: `/${page.slug}` },
        ])}
      />
      <CmsPage page={page} />
    </>
  );
}
