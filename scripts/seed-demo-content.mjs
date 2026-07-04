#!/usr/bin/env node
/**
 * Seed demo articles, creators, reels, and homepage global. Run after seed:taxonomy.
 * Usage: npm run seed:demo
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocalPath = resolve(__dirname, "../.env.local");

function loadEnvLocal() {
  if (!existsSync(envLocalPath)) return;
  for (const line of readFileSync(envLocalPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function textToLexical(text) {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (!paragraphs.length) paragraphs.push("");
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: paragraphs.map((paragraph) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        children: [{ type: "text", text: paragraph, format: 0, mode: "normal", style: "", detail: 0, version: 1 }],
      })),
    },
  };
}

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) loadEnvLocal();
process.env.PAYLOAD_MIGRATING = "true";

const { getPayload } = await import("payload");
const config = (await import("../src/payload.config.ts")).default;
const payload = await getPayload({ config });

async function findBySlug(collection, slug) {
  const result = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  });
  return result.docs[0] ?? null;
}

async function ensureMedia(alt, filename = "demo-placeholder.jpg") {
  const existing = await payload.find({
    collection: "media",
    where: { alt: { equals: alt } },
    limit: 1,
    overrideAccess: true,
  });
  if (existing.docs[0]) return existing.docs[0];

  return payload.create({
    collection: "media",
    data: { alt, filename },
    overrideAccess: true,
  });
}

const filmCat = await findBySlug("categories", "film");
const newsCat = await findBySlug("categories", "news");
const opinionCat = await findBySlug("categories", "opinion");
const spotlightCat = await findBySlug("categories", "spotlight");

const heroMedia = await ensureMedia("Demo hero image for seed article");
const portraitMedia = await ensureMedia("Kofi Mensah portrait");
const reelThumb = await ensureMedia("Demo reel thumbnail");

const articleSlugs = [
  {
    title: "The Quiet Revolution in African Cinema",
    slug: "quiet-revolution-african-cinema",
    excerpt: "How a new wave of filmmakers is reshaping the global conversation.",
    category: filmCat,
    body: "**Bold intro.**\n\nAfrican cinema is entering a new chapter.\n\n- Festival debuts\n- Streaming deals\n- Global co-productions",
  },
  {
    title: "Why This Season's Best Drama Is on Television",
    slug: "best-drama-television",
    excerpt: "Television continues to outpace film for character-driven storytelling.",
    category: newsCat,
    body: "Television has become the home for ambitious long-form stories.\n\n1. Character depth\n2. Season arcs\n3. Global distribution",
  },
  {
    title: "Opinion: We Need More Critics Who Look Like Us",
    slug: "opinion-more-critics",
    excerpt: "Representation in criticism shapes what stories get taken seriously.",
    category: opinionCat,
    body: "Criticism is not neutral. Who writes it matters.\n\nWe need more voices from the communities these stories depict.",
  },
];

const articleIds = [];
for (const item of articleSlugs) {
  const existing = await findBySlug("articles", item.slug);
  if (existing) {
    console.log(`Skip article: ${item.slug}`);
    articleIds.push(existing.id);
    continue;
  }
  const doc = await payload.create({
    collection: "articles",
    data: {
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      body: textToLexical(item.body),
      heroImage: heroMedia.id,
      categories: item.category ? [item.category.id] : [],
      status: "published",
      publishedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  });
  console.log(`Created article: ${item.title}`);
  articleIds.push(doc.id);
}

let kofi = await findBySlug("creators", "kofi-mensah");
if (!kofi) {
  kofi = await payload.create({
    collection: "creators",
    data: {
      name: "Kofi Mensah",
      slug: "kofi-mensah",
      role: "Filmmaker & Visual Artist",
      bio: "Kofi Mensah blends documentary instincts with cinematic composition to tell stories from West Africa and the diaspora.",
      quote: "Every frame should carry the weight of the community it represents.",
      portrait: portraitMedia.id,
      badges: [{ label: "Spotlight", color: "#7C3AED" }],
      achievements: [
        { label: "Films", value: "12", icon: "award" },
        { label: "Awards", value: "4", icon: "star" },
      ],
      featuredOnHomepage: true,
      sortOrder: 0,
    },
    overrideAccess: true,
  });
  console.log("Created creator: Kofi Mensah");
}

const extraCreators = [
  { name: "Amara Okafor", slug: "amara-okafor", role: "Documentary Director" },
  { name: "James Chen", slug: "james-chen", role: "Cinematographer" },
  { name: "Zara Ibrahim", slug: "zara-ibrahim", role: "TV Writer" },
  { name: "Leo Martinez", slug: "leo-martinez", role: "Film Critic" },
];

const creatorIds = [kofi.id];
for (const c of extraCreators) {
  let doc = await findBySlug("creators", c.slug);
  if (!doc) {
    doc = await payload.create({
      collection: "creators",
      data: {
        name: c.name,
        slug: c.slug,
        role: c.role,
        portrait: portraitMedia.id,
        featuredOnHomepage: true,
        sortOrder: creatorIds.length,
      },
      overrideAccess: true,
    });
    console.log(`Created creator: ${c.name}`);
  }
  creatorIds.push(doc.id);
}

const reelData = [
  { title: "Behind the Lens", slug: "behind-the-lens", label: "BTS", platform: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { title: "Festival Highlights", slug: "festival-highlights", label: "Events", platform: "instagram", url: "https://www.instagram.com/" },
  { title: "Director's Cut", slug: "directors-cut", label: "Film", platform: "tiktok", url: "https://www.tiktok.com/" },
  { title: "On Set Interview", slug: "on-set-interview", label: "Interview", platform: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { title: "Scene Breakdown", slug: "scene-breakdown", label: "Analysis", platform: "youtube", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
  { title: "Red Carpet Recap", slug: "red-carpet-recap", label: "Events", platform: "instagram", url: "https://www.instagram.com/" },
];

const reelIds = [];
for (const r of reelData) {
  let doc = await findBySlug("reels", r.slug);
  if (!doc) {
    doc = await payload.create({
      collection: "reels",
      data: {
        title: r.title,
        slug: r.slug,
        label: r.label,
        platform: r.platform,
        externalUrl: r.url,
        thumbnail: reelThumb.id,
        published: true,
        sortOrder: reelIds.length,
      },
      overrideAccess: true,
    });
    console.log(`Created reel: ${r.title}`);
  }
  reelIds.push(doc.id);
}

const categoryModules = [];
if (filmCat) categoryModules.push({ enabled: true, category: filmCat.id, sectionTitle: "Film", layout: "grid-3", maxItems: 3, articleSelection: "auto", sortOrder: 0, accentColor: "#6B1D2A" });
if (newsCat) categoryModules.push({ enabled: true, category: newsCat.id, sectionTitle: "News & Updates", layout: "list", maxItems: 4, articleSelection: "auto", sortOrder: 1, accentColor: "#2563EB" });
if (opinionCat) categoryModules.push({ enabled: true, category: opinionCat.id, sectionTitle: "Opinion", layout: "grid-2", maxItems: 2, articleSelection: "auto", sortOrder: 2, accentColor: "#C9A227" });

await payload.updateGlobal({
  slug: "homepage",
  data: {
    heroArticle: articleIds[0] ?? null,
    editorsPicks: articleIds.slice(0, 3).map((id, index) => ({ article: id, sortOrder: index })),
    categoryModules,
    spotlightCreator: kofi.id,
    featuredCreators: creatorIds.slice(1, 5).map((id, index) => ({ creator: id, sortOrder: index })),
    reelsEnabled: true,
    reels: reelIds,
    archiveCtaEnabled: true,
  },
  overrideAccess: true,
});

console.log("Demo content seed complete.");
process.exit(0);
