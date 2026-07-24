import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTagBySlug } from "@/lib/content";
import {
  breadcrumbListSchema,
  collectionPageSchema,
  JsonLd,
} from "@/lib/seo/json-ld";
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

  const canonical = `/tags/${slug}`;

  return (
    <>
      <JsonLd
        data={collectionPageSchema({
          name: `${tag.name} — Tag`,
          description: `Articles tagged ${tag.name} on Kiribé Online.`,
          url: canonical,
        })}
      />
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Home", url: "/" },
          { name: "Articles", url: "/articles" },
          { name: `Tag: ${tag.name}`, url: canonical },
        ])}
      />
      <TagArchivePage slug={slug} title={tag.name} />
    </>
  );
}
