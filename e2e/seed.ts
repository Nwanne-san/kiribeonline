/**
 * E2E seed — creates the minimum content the smoke suite depends on.
 *
 * Reuses existing scripts for the heavy lifting (`scripts/seed-taxonomy.mjs`
 * covers the system categories) and only adds what's specific to smoke:
 * a dedicated admin user + one guaranteed-published article we can navigate to.
 *
 * Idempotent — safe to run before every suite invocation.
 *
 * Runs against whichever Postgres `DATABASE_URL` points to. In CI that's the
 * ephemeral Actions service; locally it's your `.env.local` (which by policy is
 * a per-feature Neon branch, never `main`).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  SMOKE_ADMIN_EMAIL,
  SMOKE_ADMIN_NAME,
  SMOKE_ADMIN_PASSWORD,
  SMOKE_ARTICLE_BODY_TEXT,
  SMOKE_ARTICLE_EXCERPT,
  SMOKE_ARTICLE_SLUG,
  SMOKE_ARTICLE_TITLE,
  SMOKE_CATEGORY_NAME,
  SMOKE_CATEGORY_SLUG,
} from "./fixtures/constants";

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

if (!process.env.DATABASE_URL) {
  console.error(
    "[e2e/seed] DATABASE_URL is not set. Point at a disposable Neon branch or the CI Postgres service.",
  );
  process.exit(1);
}

// Skip Payload's drizzle push (migrations own the schema).
process.env.PAYLOAD_MIGRATING = "true";

/** Run a repo script as a subprocess so we don't duplicate its logic. */
function runNodeScript(rel: string) {
  const scriptPath = resolve(__dirname, "..", rel);
  const result = spawnSync("npx", ["tsx", scriptPath], {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`Script failed (${result.status}): ${rel}`);
  }
}

function textToLexical(text: string) {
  const paragraphs = text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
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
        children: [
          {
            type: "text",
            text: paragraph,
            format: 0,
            mode: "normal",
            style: "",
            detail: 0,
            version: 1,
          },
        ],
      })),
    },
  };
}

async function main() {
  // 1. System taxonomy (Film / News / Opinion / …) — reuse the canonical seed.
  runNodeScript("scripts/seed-taxonomy.mjs");

  // 2. Payload local API for the smoke-specific docs.
  const { getPayload } = await import("payload");
  const config = (await import("../src/payload.config")).default;
  const payload = await getPayload({ config });

  // Admin user — force `role: admin` + `status: active` so login and every
  // write capability check passes.
  const existingAdmin = await payload.find({
    collection: "users",
    where: { email: { equals: SMOKE_ADMIN_EMAIL } },
    limit: 1,
    overrideAccess: true,
  });
  if (!existingAdmin.docs.length) {
    await payload.create({
      collection: "users",
      // Cast to unknown → object for the extra fields the generated types
      // won't know about at seed-script compile time (role/status live on the
      // Users collection but aren't part of the create DTO surface Payload
      // exports before types generation).
      data: {
        email: SMOKE_ADMIN_EMAIL,
        password: SMOKE_ADMIN_PASSWORD,
        name: SMOKE_ADMIN_NAME,
        role: "admin",
        status: "active",
        // Payload's generated create type wants the fully typed shape; this
        // script is authoritative for these fields and is only run as tsx.
      } as never,
      overrideAccess: true,
    });
    console.log(`[e2e/seed] Created admin: ${SMOKE_ADMIN_EMAIL}`);
  } else {
    console.log(`[e2e/seed] Admin exists: ${SMOKE_ADMIN_EMAIL}`);
  }

  // Dedicated smoke category (separate from system taxonomy so re-seeding
  // won't collide with other suites).
  const existingCategory = await payload.find({
    collection: "categories",
    where: { slug: { equals: SMOKE_CATEGORY_SLUG } },
    limit: 1,
    overrideAccess: true,
  });
  const category = existingCategory.docs[0]
    ? existingCategory.docs[0]
    : await payload.create({
        collection: "categories",
        data: {
          name: SMOKE_CATEGORY_NAME,
          slug: SMOKE_CATEGORY_SLUG,
          brandColor: "#6B1D2A",
          displayOrder: 100,
          showInNav: false,
          // Payload's generated create type wants the fully typed shape; this
        // script is authoritative for these fields and is only run as tsx.
      } as never,
        overrideAccess: true,
      });

  // Published article — home → article spec navigates to this.
  const existingArticle = await payload.find({
    collection: "articles",
    where: { slug: { equals: SMOKE_ARTICLE_SLUG } },
    limit: 1,
    overrideAccess: true,
  });
  if (!existingArticle.docs.length) {
    await payload.create({
      collection: "articles",
      data: {
        title: SMOKE_ARTICLE_TITLE,
        slug: SMOKE_ARTICLE_SLUG,
        excerpt: SMOKE_ARTICLE_EXCERPT,
        body: textToLexical(SMOKE_ARTICLE_BODY_TEXT),
        categories: [category.id],
        status: "published",
        publishedAt: new Date().toISOString(),
        // Payload's generated create type wants the fully typed shape; this
        // script is authoritative for these fields and is only run as tsx.
      } as never,
      overrideAccess: true,
    });
    console.log(`[e2e/seed] Created article: ${SMOKE_ARTICLE_SLUG}`);
  } else {
    console.log(`[e2e/seed] Article exists: ${SMOKE_ARTICLE_SLUG}`);
  }

  console.log("[e2e/seed] Done.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[e2e/seed] Failed:", error);
    process.exit(1);
  });
