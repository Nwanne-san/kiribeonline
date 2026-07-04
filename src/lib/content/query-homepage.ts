import { unstable_cache } from "next/cache";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { mapPayloadArticle } from "@/lib/content/map-article";
import { mapPayloadMedia } from "@/lib/content/map-article";
import type { ArticleCardDoc } from "@/lib/content/types";
import type { MediaAsset } from "@/modules/shared/types/content";
import { queryArticles } from "@/lib/content/query-articles";

export type HomepageCategoryModule = {
  enabled: boolean;
  sectionTitle: string;
  layout: "grid-3" | "grid-2" | "list" | "hero-plus-grid";
  maxItems: number;
  accentColor?: string;
  categorySlug?: string;
  articles: ArticleCardDoc[];
};

export type PublicCreator = {
  id: string;
  name: string;
  slug: string;
  role: string;
  bio?: string;
  quote?: string;
  portrait?: MediaAsset;
  badges?: Array<{ label: string; color?: string }>;
  achievements?: Array<{ label: string; value: string; icon?: string }>;
};

export type PublicReel = {
  id: string;
  title: string;
  label: string;
  platform: string;
  externalUrl: string;
  thumbnail?: MediaAsset;
};

export type HomepageData = {
  heroArticle: ReturnType<typeof mapPayloadArticle> | null;
  editorsPicks: ArticleCardDoc[];
  /** First 3 category modules — render above Spotlight (Figma order). */
  categoryModulesTop: HomepageCategoryModule[];
  /** Remaining category modules — render below More Creators (Figma order). */
  categoryModulesBottom: HomepageCategoryModule[];
  spotlightCreator: PublicCreator | null;
  featuredCreators: PublicCreator[];
  reels: PublicReel[];
  reelsEnabled: boolean;
  archiveCtaEnabled: boolean;
};

const HEAD_SLOT_SIZE = 3;

/**
 * Default category sections rendered when the admin hasn't configured any
 * modules yet. Matches the Figma editorial layout: Film / TV / Opinion above
 * the Spotlight, News below.
 */
const DEFAULT_CATEGORY_MODULES: HomepageCategoryModule[] = [
  {
    enabled: true,
    sectionTitle: "Film",
    layout: "grid-3",
    maxItems: 3,
    categorySlug: "film",
    articles: [],
  },
  {
    enabled: true,
    sectionTitle: "Television",
    layout: "grid-3",
    maxItems: 3,
    categorySlug: "tv",
    articles: [],
  },
  {
    enabled: true,
    sectionTitle: "Opinion",
    layout: "grid-3",
    maxItems: 3,
    categorySlug: "opinion",
    articles: [],
  },
  {
    enabled: true,
    sectionTitle: "News & Updates",
    layout: "grid-3",
    maxItems: 3,
    categorySlug: "news",
    articles: [],
  },
];

function mapCreator(doc: Record<string, unknown>): PublicCreator {
  const portraitRaw = doc.portrait;
  const portrait =
    portraitRaw && typeof portraitRaw === "object"
      ? mapPayloadMedia(portraitRaw as never)
      : undefined;
  return {
    id: String(doc.id),
    name: String(doc.name),
    slug: String(doc.slug),
    role: String(doc.role),
    bio: doc.bio ? String(doc.bio) : undefined,
    quote: doc.quote ? String(doc.quote) : undefined,
    portrait,
    badges: (doc.badges as PublicCreator["badges"]) ?? undefined,
    achievements: (doc.achievements as PublicCreator["achievements"]) ?? undefined,
  };
}

function mapReel(doc: Record<string, unknown>): PublicReel {
  const thumbRaw = doc.thumbnail;
  const thumbnail =
    thumbRaw && typeof thumbRaw === "object"
      ? mapPayloadMedia(thumbRaw as never)
      : undefined;
  return {
    id: String(doc.id),
    title: String(doc.title),
    label: String(doc.label),
    platform: String(doc.platform),
    externalUrl: String(doc.externalUrl),
    thumbnail,
  };
}

async function fetchHomepageUncached(): Promise<HomepageData> {
  try {
    return await fetchHomepageFromPayload();
  } catch (err) {
    // Surface why we fell back so this isn't silently empty in dev.
    console.warn("[homepage] payload fetch failed, using defaults:", err);
    return {
      heroArticle: null,
      editorsPicks: [],
      categoryModulesTop: DEFAULT_CATEGORY_MODULES.slice(0, HEAD_SLOT_SIZE),
      categoryModulesBottom: DEFAULT_CATEGORY_MODULES.slice(HEAD_SLOT_SIZE),
      spotlightCreator: null,
      featuredCreators: [],
      reels: [],
      reelsEnabled: true,
      archiveCtaEnabled: true,
    };
  }
}

async function fetchHomepageFromPayload(): Promise<HomepageData> {
  const payload = await getPayloadClient();
  const homepage = (await payload.findGlobal({ slug: "homepage", depth: 2 })) as {
    heroArticle?: unknown;
    editorsPicks?: Array<{ sortOrder?: number; article?: unknown }>;
    categoryModules?: Array<{
      enabled?: boolean;
      category?: { slug?: string; name?: string } | string;
      sectionTitle?: string;
      layout?: HomepageCategoryModule["layout"];
      maxItems?: number;
      accentColor?: string;
      articleSelection?: string;
      manualArticles?: unknown[];
      sortOrder?: number;
    }>;
    spotlightCreator?: unknown;
    featuredCreators?: Array<{ sortOrder?: number; creator?: unknown }>;
    reelsEnabled?: boolean;
    reels?: unknown[];
    archiveCtaEnabled?: boolean;
  };

  const heroRaw = homepage.heroArticle;
  const heroArticle =
    heroRaw && typeof heroRaw === "object" ? mapPayloadArticle(heroRaw as never) : null;

  const editorsPicks = (homepage.editorsPicks ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((pick) => pick.article)
    .filter((a) => a && typeof a === "object")
    .map((a) => a as ArticleCardDoc);

  const modules = (homepage.categoryModules ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .filter((mod) => mod.enabled !== false);

  const categoryModules: HomepageCategoryModule[] = [];

  for (const mod of modules) {
    const category = mod.category;
    const categorySlug =
      category && typeof category === "object" ? category.slug : undefined;
    const sectionTitle =
      mod.sectionTitle ||
      (category && typeof category === "object" ? category.name : undefined) ||
      "Section";

    let articles: ArticleCardDoc[] = [];

    if (mod.articleSelection === "manual" && mod.manualArticles?.length) {
      articles = mod.manualArticles
        .filter((a) => a && typeof a === "object")
        .map((a) => a as ArticleCardDoc)
        .slice(0, mod.maxItems ?? 3);
    } else if (categorySlug) {
      const result = await queryArticles({
        categorySlug,
        limit: mod.maxItems ?? 3,
      });
      articles = result.docs;
    }

    categoryModules.push({
      enabled: mod.enabled !== false,
      sectionTitle,
      layout: (mod.layout as HomepageCategoryModule["layout"]) ?? "grid-3",
      maxItems: mod.maxItems ?? 3,
      accentColor: mod.accentColor ?? undefined,
      categorySlug,
      articles,
    });
  }

  const effectiveModules =
    categoryModules.length > 0 ? categoryModules : DEFAULT_CATEGORY_MODULES;
  const categoryModulesTop = effectiveModules.slice(0, HEAD_SLOT_SIZE);
  const categoryModulesBottom = effectiveModules.slice(HEAD_SLOT_SIZE);

  const spotlightRaw = homepage.spotlightCreator;
  const spotlightCreator =
    spotlightRaw && typeof spotlightRaw === "object"
      ? mapCreator(spotlightRaw as Record<string, unknown>)
      : null;

  const featuredCreators = (homepage.featuredCreators ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((row) => row.creator)
    .filter((c) => c && typeof c === "object")
    .map((c) => mapCreator(c as Record<string, unknown>));

  const reels = (homepage.reels ?? [])
    .filter((r) => r && typeof r === "object")
    .map((r) => mapReel(r as Record<string, unknown>));

  return {
    heroArticle,
    editorsPicks,
    categoryModulesTop,
    categoryModulesBottom,
    spotlightCreator,
    featuredCreators,
    reels,
    reelsEnabled: homepage.reelsEnabled !== false,
    archiveCtaEnabled: homepage.archiveCtaEnabled !== false,
  };
}

const cachedHomepage = unstable_cache(
  fetchHomepageUncached,
  ["homepage-public"],
  // Short revalidate during initial build-out so edits show up promptly;
  // raise this once content/sections stabilise.
  { tags: ["homepage"], revalidate: 30 }
);

/**
 * In development the data cache is bypassed entirely so iteration is instant.
 * In prod/staging it goes through `unstable_cache` with tag-based invalidation.
 */
export async function getHomepageForPublic(): Promise<HomepageData> {
  if (process.env.NODE_ENV === "development") {
    return fetchHomepageUncached();
  }
  return cachedHomepage();
}
