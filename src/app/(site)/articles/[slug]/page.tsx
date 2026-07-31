import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getAdjacentArticles,
  getMostReadArticles,
  getRelatedArticles,
  hasNamedAuthor,
  mapPayloadArticle,
  queryArticleBySlug,
  queryArticles,
} from "@/lib/content";
import type { ArticleCardDoc } from "@/lib/content/types";
import {
  breadcrumbListSchema,
  JsonLd,
  newsArticleSchema,
} from "@/lib/seo/json-ld";
import { ArticleDetailPage } from "@/modules/editorial/pages/ArticleDetailPage";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const doc = await queryArticleBySlug(slug);
  if (!doc) return { title: "Article not found" };

  const article = mapPayloadArticle(doc as never);
  const title = article.seo?.title ?? article.title;
  const description = article.seo?.description ?? article.excerpt;
  const canonical = `/articles/${article.slug}`;
  const primaryCategory = article.categories?.[0];
  const tags = article.tags?.map((t) => t.name).filter(Boolean) as string[] | undefined;

  // NOTE: the co-located `opengraph-image.tsx` file convention takes precedence
  // over `openGraph.images` set here (file-based metadata wins in Next.js), so
  // the OG image + its seo.ogImage → hero → branded-fallback chain lives there.
  // Twitter inherits the same image via the og:image fallback.
  return {
    title,
    description,
    keywords: tags,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      publishedTime: article.publishedAt,
      modifiedTime: (article as { updatedAt?: string }).updatedAt,
      // Respects the byline opt-out — see `resolvePublicByline`.
      authors: hasNamedAuthor(article) ? [article.author!.name!] : undefined,
      section: primaryCategory?.name,
      tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const doc = await queryArticleBySlug(slug);

  if (!doc) {
    notFound();
  }

  const article = mapPayloadArticle(doc as never);

  const primaryCategorySlug = article.categories?.[0]?.slug;
  let relatedArticles: ArticleCardDoc[] = [];
  if (primaryCategorySlug) {
    const related = await queryArticles({
      categorySlug: primaryCategorySlug,
      limit: 4,
    });
    relatedArticles = related.docs.filter((doc) => doc.id !== article.id).slice(0, 3);
  }

  // Fetch the most-read leaderboard for the sidebar module. Ask for 6 so we
  // can drop the current article (if it happens to be trending) and still show
  // a clean 5.
  const mostReadRaw = await getMostReadArticles(6);
  const mostReadArticles = mostReadRaw
    .filter((doc) => doc.id !== article.id)
    .slice(0, 5);

  // Discovery: "Read next" scored by tag overlap (fallback: same-category
  // newest → site-wide newest), plus chronological prev/next within the
  // primary category. Both run in parallel — neither depends on the other.
  const [readNextArticles, adjacentArticles] = await Promise.all([
    getRelatedArticles(
      {
        id: article.id,
        categories: article.categories?.map((c) => ({ id: c.id, slug: c.slug })),
        tags: article.tags?.map((t) => ({ id: t.id, slug: t.slug })),
      },
      3
    ),
    getAdjacentArticles({
      id: article.id,
      publishedAt: article.publishedAt,
      categories: article.categories?.map((c) => ({ slug: c.slug })),
    }),
  ]);

  const canonical = `/articles/${article.slug}`;
  const primaryCategory = article.categories?.[0];
  const heroImageUrl = article.heroImage?.url ?? undefined;
  const tagNames = article.tags?.map((t) => t.name).filter(Boolean) as string[] | undefined;

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Articles", url: "/articles" },
    ...(primaryCategory
      ? [{ name: primaryCategory.name, url: `/categories/${primaryCategory.slug}` }]
      : []),
    { name: article.title, url: canonical },
  ];

  // Word count for JSON-LD — cheap approximation from the existing reading-
  // time estimate (200 wpm) so we don't walk the Lexical body twice.
  const readingMinutes = (article as { readingTime?: number }).readingTime;
  const wordCount = readingMinutes ? readingMinutes * 200 : undefined;

  const articleSchema = newsArticleSchema({
    url: canonical,
    headline: article.title,
    description: article.seo?.description ?? article.excerpt,
    imageUrl: heroImageUrl,
    datePublished: article.publishedAt ?? new Date().toISOString(),
    dateModified: (article as { updatedAt?: string }).updatedAt,
    // Structured data must respect the byline opt-out too — a hidden name must
    // not leak through schema.org. `undefined` lets the schema fall back to the
    // publisher as author.
    authorName: hasNamedAuthor(article) ? article.author?.name : undefined,
    section: primaryCategory?.name,
    keywords: tagNames,
    wordCount,
  });

  return (
    <>
      <JsonLd data={articleSchema} />
      <JsonLd data={breadcrumbListSchema(breadcrumbs)} />
      <ArticleDetailPage
        article={article}
        relatedArticles={relatedArticles}
        mostReadArticles={mostReadArticles}
        readNextArticles={readNextArticles}
        adjacentArticles={adjacentArticles}
      />
    </>
  );
}
