import { unstable_cache } from "next/cache";
import { getPayloadClient } from "@/lib/payload/get-payload";

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  brandColor?: string | null;
  showInNav?: boolean | null;
};

async function fetchCategoriesUncached(): Promise<PublicCategory[]> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "categories",
      sort: "displayOrder",
      limit: 50,
      depth: 0,
    });
    return result.docs.map((doc) => ({
      id: String(doc.id),
      name: doc.name as string,
      slug: doc.slug as string,
      brandColor: (doc as { brandColor?: string }).brandColor,
      showInNav: (doc as { showInNav?: boolean }).showInNav,
    }));
  } catch {
    return [];
  }
}

export const getCategoriesForPublic = unstable_cache(
  fetchCategoriesUncached,
  ["categories-public"],
  { tags: ["categories"], revalidate: 60 }
);
