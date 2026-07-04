import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { mapPayloadArticle, queryArticleBySlug } from "@/lib/content";
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
  return <ArticleDetailPage article={article} />;
}
