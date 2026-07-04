#!/usr/bin/env node
/**
 * Seed system categories and tags. Idempotent (skips existing slugs).
 * Usage: npm run seed:taxonomy
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

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) loadEnvLocal();
process.env.PAYLOAD_MIGRATING = "true";

const SYSTEM_CATEGORIES = [
  { name: "Film", slug: "film", brandColor: "#6B1D2A", displayOrder: 1, showInNav: true },
  { name: "TV", slug: "tv", brandColor: "#1A1A1A", displayOrder: 2, showInNav: true },
  { name: "Videos", slug: "videos", brandColor: "#6B1D2A", displayOrder: 3, showInNav: true },
  { name: "News", slug: "news", brandColor: "#2563EB", displayOrder: 4, showInNav: true },
  { name: "Opinion", slug: "opinion", brandColor: "#C9A227", displayOrder: 5, showInNav: true },
  { name: "Spotlight", slug: "spotlight", brandColor: "#7C3AED", displayOrder: 6, showInNav: true },
  { name: "Documentary", slug: "documentary", brandColor: "#15803D", displayOrder: 7, showInNav: false },
  { name: "Events", slug: "events", brandColor: "#0D9488", displayOrder: 8, showInNav: false },
];

const SYSTEM_TAGS = [
  { name: "Analysis", slug: "analysis", brandColor: "#C9A227" },
  { name: "Design", slug: "design", brandColor: "#C9A227" },
  { name: "Culture", slug: "culture", brandColor: "#C9A227" },
  { name: "Review", slug: "review", brandColor: "#C9A227" },
  { name: "Opinion", slug: "opinion-tag", brandColor: "#C9A227" },
  { name: "Commentary", slug: "commentary", brandColor: "#C9A227" },
  { name: "Behind the Scenes", slug: "behind-the-scenes", brandColor: "#C9A227" },
  { name: "Technology", slug: "technology", brandColor: "#C9A227" },
  { name: "Events", slug: "events-tag", brandColor: "#C9A227" },
  { name: "Profile", slug: "profile", brandColor: "#C9A227" },
  { name: "News", slug: "news-tag", brandColor: "#C9A227" },
  { name: "Featured Story", slug: "featured-story", brandColor: "#C9A227" },
  { name: "Documentary", slug: "documentary-tag", brandColor: "#C9A227" },
  { name: "Television", slug: "television", brandColor: "#C9A227" },
];

const { getPayload } = await import("payload");
const config = (await import("../src/payload.config.ts")).default;
const payload = await getPayload({ config });

async function seedCollection(collection, items, extra = {}) {
  for (const item of items) {
    const existing = await payload.find({
      collection,
      where: { slug: { equals: item.slug } },
      limit: 1,
      overrideAccess: true,
    });
    if (existing.docs.length) {
      console.log(`Skip ${collection}: ${item.slug}`);
      continue;
    }
    await payload.create({
      collection,
      data: { ...item, isSystem: true, ...extra },
      overrideAccess: true,
    });
    console.log(`Created ${collection}: ${item.name}`);
  }
}

await seedCollection("categories", SYSTEM_CATEGORIES);
await seedCollection("tags", SYSTEM_TAGS);
console.log("Taxonomy seed complete.");
process.exit(0);
