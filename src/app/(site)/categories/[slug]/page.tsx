import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoriesForPublic } from "@/lib/content";
import { getSpotlightArchiveData } from "@/lib/content/query-creators";
import { CategoryArchivePage } from "@/modules/editorial/pages/CategoryArchivePage";
import { SpotlightArchivePage } from "@/modules/editorial/pages/SpotlightArchivePage";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `/categories/${slug}`;

  if (slug === "spotlight") {
    const title = "Spotlight — Category";
    const description =
      "In-depth profiles of the directors, actors, and creatives defining contemporary culture.";
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { type: "website", title, description, url: canonical },
    };
  }

  // Prefer the category's real name (cached lookup) over the slug when available.
  const categories = await getCategoriesForPublic();
  const category = categories.find((item) => item.slug === slug);
  const name = category?.name ?? slug.replace(/-/g, " ");

  const title = `${name} — Category`;
  const description = `Browse ${name} articles on Kiribé Online.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", title, description, url: canonical },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  // Spotlight is a creator showcase, not an article archive (Figma V5).
  if (slug === "spotlight") {
    const { featuredCreator, moreCreators } = await getSpotlightArchiveData();
    return (
      <SpotlightArchivePage
        featuredCreator={featuredCreator}
        moreCreators={moreCreators}
      />
    );
  }

  // Junk slugs 404 instead of rendering an empty archive with a 200. A real
  // category with no articles still renders (its empty state lives in the archive).
  const categories = await getCategoriesForPublic();
  const category = categories.find((item) => item.slug === slug);
  if (!category) {
    notFound();
  }

  return <CategoryArchivePage slug={slug} title={category.name} />;
}
