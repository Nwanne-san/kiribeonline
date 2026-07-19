import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mapPayloadArticle, queryArticleBySlug, queryArticles } from "@/lib/content";
import type { ArticleCardDoc } from "@/lib/content/types";
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

  // NOTE: the co-located `opengraph-image.tsx` file convention takes precedence
  // over `openGraph.images` set here (file-based metadata wins in Next.js), so
  // the OG image + its seo.ogImage → hero → branded-fallback chain lives there.
  // Twitter inherits the same image via the og:image fallback.
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      publishedTime: article.publishedAt,
      authors: article.author?.name ? [article.author.name] : undefined,
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

  return <ArticleDetailPage article={article} relatedArticles={relatedArticles} />;
}
