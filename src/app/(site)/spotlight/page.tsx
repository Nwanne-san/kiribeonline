import type { Metadata } from "next";
import { getSpotlightArchiveData } from "@/lib/content/query-creators";
import {
  breadcrumbListSchema,
  collectionPageSchema,
  JsonLd,
} from "@/lib/seo/json-ld";
import { SpotlightArchivePage } from "@/modules/editorial/pages/SpotlightArchivePage";

const title = "Spotlight — Category";
const description =
  "In-depth profiles of the directors, actors, and creatives defining contemporary culture.";
const canonical = "/categories/spotlight";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical },
  openGraph: { type: "website", title, description, url: canonical },
};

export default async function Page() {
  const { featuredCreator, moreCreators } = await getSpotlightArchiveData();

  return (
    <>
      <JsonLd
        data={collectionPageSchema({
          name: "Spotlight",
          description,
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
