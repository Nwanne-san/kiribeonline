import { getPayloadClient } from "@/lib/payload/get-payload";
import type { homepagePatchSchema } from "./homepage.dto";
import type { z } from "zod";

type HomepagePatch = z.infer<typeof homepagePatchSchema>;

export async function getHomepageAdmin() {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: "homepage", depth: 2, overrideAccess: true });
}

export async function updateHomepageAdmin(input: HomepagePatch) {
  const payload = await getPayloadClient();
  const data: Record<string, unknown> = {};

  if (input.heroArticleId !== undefined) {
    data.heroArticle = input.heroArticleId;
  }
  if (input.editorsPicks) {
    data.editorsPicks = input.editorsPicks.map((pick) => ({
      article: pick.articleId,
      sortOrder: pick.sortOrder,
    }));
  }
  if (input.categoryModules) {
    data.categoryModules = input.categoryModules.map((mod) => ({
      enabled: mod.enabled ?? true,
      category: mod.categoryId,
      sectionTitle: mod.sectionTitle,
      layout: mod.layout ?? "grid-3",
      maxItems: mod.maxItems ?? 3,
      articleSelection: mod.articleSelection ?? "auto",
      manualArticles: mod.manualArticleIds,
      sortOrder: mod.sortOrder ?? 0,
      accentColor: mod.accentColor,
    }));
  }
  if (input.spotlightCreatorId !== undefined) {
    data.spotlightCreator = input.spotlightCreatorId;
  }
  if (input.featuredCreators) {
    data.featuredCreators = input.featuredCreators.map((row) => ({
      creator: row.creatorId,
      sortOrder: row.sortOrder,
    }));
  }
  if (input.reelsEnabled !== undefined) data.reelsEnabled = input.reelsEnabled;
  if (input.reelIds) data.reels = input.reelIds;
  if (input.archiveCtaEnabled !== undefined) data.archiveCtaEnabled = input.archiveCtaEnabled;

  return payload.updateGlobal({
    slug: "homepage",
    data,
    overrideAccess: true,
  });
}
