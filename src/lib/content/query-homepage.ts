import { unstable_cache } from "next/cache";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { mapPayloadArticle, toArticleCardDoc } from "@/lib/content/map-article";
import { mapPayloadMedia } from "@/lib/content/map-article";
import type { ArticleCardDoc } from "@/lib/content/types";
import type { MediaAsset } from "@/modules/shared/types/content";
import { queryArticles } from "@/lib/content/query-articles";
import { getMostReadArticles } from "@/lib/content/query-most-read";

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
  /**
   * "Most Read" leaderboard — top articles by viewCount. Fixed module (not
   * builder-configurable). Empty array on cold sites or on fetch failure.
   */
  mostReadArticles: ArticleCardDoc[];
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

export function mapCreator(doc: Record<string, unknown>): PublicCreator {
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
      mostReadArticles: [],
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
  let heroArticle =
    heroRaw && typeof heroRaw === "object" ? mapPayloadArticle(heroRaw as never) : null;

  // Editor's Picks come exclusively from the homepage builder's own section —
  // featured articles never spill into this sidebar.
  let editorsPicks = (homepage.editorsPicks ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((pick) => pick.article)
    .filter((a) => a && typeof a === "object")
    // Strip Lexical body + derive read-time so card lists don't ship the full
    // article payload to the browser.
    .map((a) => toArticleCardDoc(a as ArticleCardDoc & { body?: unknown }));

  // The article editor's "Featured" section (checkbox + priority) is the
  // source of truth for the Featured Story slot: the highest-priority
  // featured article takes the hero, and the builder's pinned hero article is
  // only the fallback when no published article is currently flagged.
  const featured = await payload.find({
    collection: "articles",
    where: {
      and: [
        { featured: { equals: true } },
        { status: { equals: "published" } },
      ],
    },
    sort: ["-featuredPriority", "-publishedAt"],
    limit: 1,
    depth: 2,
  });
  if (featured.docs.length > 0) {
    heroArticle = mapPayloadArticle(featured.docs[0] as never);
  }

  // Final hero fallback: newest published article. Same "auto" spirit as the
  // reels/creators sections — as soon as there's *any* content, the hero slot
  // fills without the admin having to visit the builder.
  if (!heroArticle) {
    const latest = await payload.find({
      collection: "articles",
      where: { status: { equals: "published" } },
      sort: "-publishedAt",
      limit: 1,
      depth: 2,
    });
    if (latest.docs.length > 0) {
      heroArticle = mapPayloadArticle(latest.docs[0] as never);
    }
  }

  // Editor's picks fallback: latest published articles (skip the hero) so the
  // sidebar has something to show before the admin curates its own list.
  if (editorsPicks.length === 0) {
    const latest = await payload.find({
      collection: "articles",
      where: {
        and: [
          { status: { equals: "published" } },
          ...(heroArticle ? [{ id: { not_equals: heroArticle.id } }] : []),
        ],
      },
      sort: "-publishedAt",
      limit: 5,
      depth: 2,
    });
    editorsPicks = latest.docs.map((a) =>
      toArticleCardDoc(a as unknown as ArticleCardDoc & { body?: unknown })
    );
  }

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
        // Strip Lexical body + derive read-time — card grids don't render body.
        .map((a) => toArticleCardDoc(a as ArticleCardDoc & { body?: unknown }))
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

  // Default modules ship with empty `articles` arrays — fill them from the
  // category so the homepage isn't blank when the admin hasn't opened the
  // builder yet. Drop any default section that comes back empty, and if
  // nothing at all matches the default slugs, show a single "Latest" module
  // built from the newest published articles.
  let effectiveModules: HomepageCategoryModule[];
  if (categoryModules.length > 0) {
    effectiveModules = categoryModules;
  } else {
    const filled = await Promise.all(
      DEFAULT_CATEGORY_MODULES.map(async (mod) => {
        if (!mod.categorySlug) return mod;
        const result = await queryArticles({
          categorySlug: mod.categorySlug,
          limit: mod.maxItems,
        });
        return { ...mod, articles: result.docs };
      })
    );
    effectiveModules = filled.filter((mod) => mod.articles.length > 0);
    if (effectiveModules.length === 0) {
      const latest = await queryArticles({ limit: 6 });
      if (latest.docs.length > 0) {
        effectiveModules = [
          {
            enabled: true,
            sectionTitle: "Latest",
            layout: "grid-3",
            maxItems: 6,
            articles: latest.docs,
          },
        ];
      }
    }
  }
  const categoryModulesTop = effectiveModules.slice(0, HEAD_SLOT_SIZE);
  const categoryModulesBottom = effectiveModules.slice(HEAD_SLOT_SIZE);

  const spotlightRaw = homepage.spotlightCreator;
  let spotlightCreator =
    spotlightRaw && typeof spotlightRaw === "object"
      ? mapCreator(spotlightRaw as Record<string, unknown>)
      : null;

  let featuredCreators = (homepage.featuredCreators ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((row) => row.creator)
    .filter((c) => c && typeof c === "object")
    .map((c) => mapCreator(c as Record<string, unknown>));

  // Creator fallbacks — spotlight uses the first featured creator (or any
  // creator if none flagged); the More Creators grid fills from all creators
  // by sortOrder, excluding whoever is in the spotlight. Same auto-fallback
  // pattern as reels + articles above.
  if (!spotlightCreator || featuredCreators.length === 0) {
    const allCreators = await payload.find({
      collection: "creators",
      sort: ["-featuredOnHomepage", "sortOrder", "-updatedAt"],
      limit: 8,
      depth: 1,
    });
    const mapped = allCreators.docs.map((c) =>
      mapCreator(c as unknown as Record<string, unknown>)
    );
    if (!spotlightCreator && mapped.length > 0) {
      spotlightCreator = mapped[0];
    }
    if (featuredCreators.length === 0) {
      const spotlightId = spotlightCreator?.id;
      featuredCreators = mapped
        .filter((c) => c.id !== spotlightId)
        .slice(0, 4);
    }
  }

  // The builder's `homepage.reels` list is the source of truth once an admin
  // picks reels there. Until then, fall back to all published reels sorted by
  // sortOrder so creating a reel is enough to see it on the homepage — matches
  // the "auto" pattern used for category modules.
  let reels = (homepage.reels ?? [])
    .filter((r) => r && typeof r === "object")
    .map((r) => mapReel(r as Record<string, unknown>));
  if (reels.length === 0) {
    const fallback = await payload.find({
      collection: "reels",
      where: { published: { equals: true } },
      sort: ["sortOrder", "-updatedAt"],
      limit: 8,
      depth: 1,
    });
    reels = fallback.docs.map((r) => mapReel(r as unknown as Record<string, unknown>));
  }

  // Fixed homepage "Most Read" module — top 5 by viewCount. Fetched inside the
  // homepage cache so a homepage revalidation refreshes it in one shot rather
  // than making the module cache the source of truth on the public page.
  const mostReadArticles = await getMostReadArticles(5);

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
    mostReadArticles,
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
