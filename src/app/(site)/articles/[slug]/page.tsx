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
  return {
    title: article.seo?.title ?? article.title,
    description: article.seo?.description ?? article.excerpt,
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
