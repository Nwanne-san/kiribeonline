import { unstable_cache } from "next/cache";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { mapCreator, type PublicCreator } from "@/lib/content/query-homepage";

export type SpotlightArchiveData = {
  featuredCreator: PublicCreator | null;
  moreCreators: PublicCreator[];
};

const MORE_CREATORS_LIMIT = 8;

/**
 * Spotlight archive data — the editor-chosen homepage spotlight leads the page
 * when set; otherwise the first creator by `sortOrder` takes the slot.
 */
async function fetchSpotlightUncached(): Promise<SpotlightArchiveData> {
  try {
    const payload = await getPayloadClient();
    const [creatorsResult, homepage] = await Promise.all([
      payload.find({
        collection: "creators",
        sort: "sortOrder",
        limit: 20,
        depth: 1,
      }),
      payload.findGlobal({ slug: "homepage", depth: 2 }).catch(() => null),
    ]);

    const creators = creatorsResult.docs.map((doc) =>
      mapCreator(doc as unknown as Record<string, unknown>)
    );

    const spotlightRaw = (homepage as { spotlightCreator?: unknown } | null)
      ?.spotlightCreator;
    const featuredCreator =
      spotlightRaw && typeof spotlightRaw === "object"
        ? mapCreator(spotlightRaw as Record<string, unknown>)
        : creators[0] ?? null;

    const moreCreators = creators
      .filter((creator) => creator.id !== featuredCreator?.id)
      .slice(0, MORE_CREATORS_LIMIT);

    return { featuredCreator, moreCreators };
  } catch {
    return { featuredCreator: null, moreCreators: [] };
  }
}

const cachedSpotlight = unstable_cache(
  fetchSpotlightUncached,
  ["spotlight-archive"],
  { tags: ["homepage", "creators"], revalidate: 60 }
);

export async function getSpotlightArchiveData(): Promise<SpotlightArchiveData> {
  if (process.env.NODE_ENV === "development") {
    return fetchSpotlightUncached();
  }
  return cachedSpotlight();
}
