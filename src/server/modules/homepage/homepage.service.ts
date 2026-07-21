import { getPayloadClient } from "@/lib/payload/get-payload";
import { toRelId, toRelIds } from "@/server/shared/rel-id";
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
    data.heroArticle = toRelId(input.heroArticleId) ?? null;
  }
  if (input.editorsPicks) {
    data.editorsPicks = input.editorsPicks
      .map((pick) => ({
        article: toRelId(pick.articleId),
        sortOrder: pick.sortOrder,
      }))
      .filter((pick) => pick.article !== undefined);
  }
  if (input.categoryModules) {
    data.categoryModules = input.categoryModules
      .map((mod) => ({
        enabled: mod.enabled ?? true,
        category: toRelId(mod.categoryId),
        sectionTitle: mod.sectionTitle,
        layout: mod.layout ?? "grid-3",
        maxItems: mod.maxItems ?? 3,
        articleSelection: mod.articleSelection ?? "auto",
        manualArticles: toRelIds(mod.manualArticleIds),
        sortOrder: mod.sortOrder ?? 0,
        accentColor: mod.accentColor,
      }))
      .filter((mod) => mod.category !== undefined);
  }
  if (input.spotlightCreatorId !== undefined) {
    data.spotlightCreator = toRelId(input.spotlightCreatorId) ?? null;
  }
  if (input.featuredCreators) {
    data.featuredCreators = input.featuredCreators
      .map((row) => ({
        creator: toRelId(row.creatorId),
        sortOrder: row.sortOrder,
      }))
      .filter((row) => row.creator !== undefined);
  }
  if (input.reelsEnabled !== undefined) data.reelsEnabled = input.reelsEnabled;
  if (input.reelIds) data.reels = toRelIds(input.reelIds) ?? [];
  if (input.archiveCtaEnabled !== undefined) data.archiveCtaEnabled = input.archiveCtaEnabled;

  return payload.updateGlobal({
    slug: "homepage",
    data,
    overrideAccess: true,
  });
}
