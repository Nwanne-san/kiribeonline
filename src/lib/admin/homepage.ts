import { getPayloadClient } from "@/lib/payload/get-payload";
import type { homepagePatchSchema } from "@/lib/validation/admin";
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

export async function getSiteSettingsAdmin() {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: "site-settings", depth: 2, overrideAccess: true });
}

export async function updateSiteSettingsAdmin(data: Record<string, unknown>) {
  const payload = await getPayloadClient();
  return payload.updateGlobal({ slug: "site-settings", data, overrideAccess: true });
}

export async function listCategoriesAdmin() {
  const payload = await getPayloadClient();
  return payload.find({ collection: "categories", sort: "displayOrder", limit: 100, overrideAccess: true });
}

export async function createCategoryAdmin(data: {
  name: string;
  slug?: string;
  description?: string;
  displayOrder?: number;
  brandColor?: string;
  showInNav?: boolean;
}) {
  const payload = await getPayloadClient();
  return payload.create({ collection: "categories", data: data as never, overrideAccess: true });
}

export async function listTagsAdmin() {
  const payload = await getPayloadClient();
  return payload.find({ collection: "tags", sort: "name", limit: 200, overrideAccess: true });
}

export async function createTagAdmin(data: { name: string; slug?: string; brandColor?: string }) {
  const payload = await getPayloadClient();
  return payload.create({ collection: "tags", data: data as never, overrideAccess: true });
}

export async function listMediaAdmin() {
  const payload = await getPayloadClient();
  return payload.find({ collection: "media", sort: "-createdAt", limit: 100, overrideAccess: true });
}

export async function deleteMediaAdmin(id: string) {
  const payload = await getPayloadClient();
  return payload.delete({ collection: "media", id, overrideAccess: true });
}
