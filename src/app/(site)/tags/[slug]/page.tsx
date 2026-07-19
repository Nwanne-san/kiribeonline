import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTagBySlug } from "@/lib/content";
import { TagArchivePage } from "@/modules/editorial/pages/TagArchivePage";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) return { title: "Tag not found" };

  const canonical = `/tags/${slug}`;
  const title = `${tag.name} — Tag`;
  const description = `Articles tagged ${tag.name} on Kiribé Online.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", title, description, url: canonical },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  // Junk slugs 404 instead of rendering an empty archive with a 200. A real
  // tag with no articles still renders (its empty state lives in the archive).
  const tag = await getTagBySlug(slug);
  if (!tag) {
    notFound();
  }

  return <TagArchivePage slug={slug} title={tag.name} />;
}
