import type { Metadata } from "next";
import { getSpotlightArchiveData } from "@/lib/content/query-creators";
import { CategoryArchivePage } from "@/modules/editorial/pages/CategoryArchivePage";
import { SpotlightArchivePage } from "@/modules/editorial/pages/SpotlightArchivePage";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "spotlight") {
    return {
      title: "Spotlight — Category",
      description:
        "In-depth profiles of the directors, actors, and creatives defining contemporary culture.",
    };
  }
  const title = slug.replace(/-/g, " ");
  return {
    title: `${title} — Category`,
    description: `Browse ${title} articles on Kiribé Online.`,
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

  return <CategoryArchivePage slug={slug} />;
}
