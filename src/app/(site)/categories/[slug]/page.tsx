import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoriesForPublic, getPublishedReels } from "@/lib/content";
import { getSpotlightArchiveData } from "@/lib/content/query-creators";
import {
  breadcrumbListSchema,
  collectionPageSchema,
  JsonLd,
} from "@/lib/seo/json-ld";
import { CategoryArchivePage } from "@/modules/editorial/pages/CategoryArchivePage";
import { SpotlightArchivePage } from "@/modules/editorial/pages/SpotlightArchivePage";
import { VideosArchivePage } from "@/modules/editorial/pages/VideosArchivePage";

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

  if (slug === "videos") {
    const title = "Videos — Category";
    const description =
      "Short-form reels, interviews, and visual features from Kiribé.";
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

  const canonical = `/categories/${slug}`;

  // Spotlight is a creator showcase, not an article archive (Figma V5).
  if (slug === "spotlight") {
    const { featuredCreator, moreCreators } = await getSpotlightArchiveData();
    return (
      <>
        <JsonLd
          data={collectionPageSchema({
            name: "Spotlight",
            description:
              "In-depth profiles of the directors, actors, and creatives defining contemporary culture.",
            url: canonical,
          })}
        />
        <JsonLd
          data={breadcrumbListSchema([
            { name: "Home", url: "/" },
            { name: "Categories", url: "/categories" },
            { name: "Spotlight", url: canonical },
          ])}
        />
        <SpotlightArchivePage
          featuredCreator={featuredCreator}
          moreCreators={moreCreators}
        />
      </>
    );
  }

  // Videos is a reels grid, not an article archive — reels live in a separate
  // collection and never carried the `videos` category tag on articles, so the
  // generic archive was always empty here.
  if (slug === "videos") {
    const reels = await getPublishedReels(48);
    return (
      <>
        <JsonLd
          data={collectionPageSchema({
            name: "Videos",
            description: "Short-form reels, interviews, and visual features from Kiribé.",
            url: canonical,
          })}
        />
        <JsonLd
          data={breadcrumbListSchema([
            { name: "Home", url: "/" },
            { name: "Categories", url: "/categories" },
            { name: "Videos", url: canonical },
          ])}
        />
        <VideosArchivePage reels={reels} />
      </>
    );
  }

  // Junk slugs 404 instead of rendering an empty archive with a 200. A real
  // category with no articles still renders (its empty state lives in the archive).
  const categories = await getCategoriesForPublic();
  const category = categories.find((item) => item.slug === slug);
  if (!category) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={collectionPageSchema({
          name: category.name,
          description: `Browse ${category.name} articles on Kiribé Online.`,
          url: canonical,
        })}
      />
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Home", url: "/" },
          { name: "Categories", url: "/categories" },
          { name: category.name, url: canonical },
        ])}
      />
      <CategoryArchivePage slug={slug} title={category.name} />
    </>
  );
}
