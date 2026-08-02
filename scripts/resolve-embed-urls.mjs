#!/usr/bin/env node
/**
 * One-off: walk every place we store an embed URL and rewrite short redirects
 * (vm.tiktok.com/…, www.tiktok.com/t/…) to their canonical form so
 * `parseEmbed` can extract a video id at render time.
 *
 * The Reels `beforeChange` hook (src/payload/hooks/resolve-reel-url.ts) does
 * this for new saves, but rows written before that hook shipped need a
 * back-fill. This script covers:
 *   - reels.externalUrl
 *   - articles.body — rich-text embed nodes (type: "embed", field: url)
 *   - pages.body    — same shape as articles
 *
 * Usage:
 *   npm run resolve:embeds -- --dry-run   # preview only
 *   npm run resolve:embeds                # rewrite in place
 *
 * Loads .env.local automatically so it works from a fresh shell without
 * exporting DATABASE_URL / PAYLOAD_SECRET first.
 *
 * Idempotent — running it twice is a no-op; already-canonical URLs are
 * filtered out by `needsResolution` before any network call.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocalPath = resolve(__dirname, "../.env.local");

function loadEnvLocal() {
  if (!existsSync(envLocalPath)) return;
  const content = readFileSync(envLocalPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  loadEnvLocal();
}

const { values } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    limit: { type: "string", default: "1000" },
  },
});

const dryRun = values["dry-run"];
const perCollectionLimit = Number.parseInt(values.limit, 10) || 1000;

process.env.PAYLOAD_MIGRATING = "true";

const { getPayload } = await import("payload");
const config = (await import("../src/payload.config.ts")).default;
const { needsResolution, resolveShortUrl } = await import(
  "../src/lib/embeds/resolve-url.ts"
);

const payload = await getPayload({ config });

console.log(
  `\n▶ resolve-embed-urls  (${dryRun ? "DRY RUN — no writes" : "LIVE — will update docs"})\n`
);

const summary = {
  reels: { scanned: 0, changed: 0, errors: 0 },
  articles: { scanned: 0, changed: 0, errors: 0 },
  pages: { scanned: 0, changed: 0, errors: 0 },
};

// ── Reels ────────────────────────────────────────────────────────────
const reelsRes = await payload.find({
  collection: "reels",
  limit: perCollectionLimit,
  overrideAccess: true,
  depth: 0,
});
summary.reels.scanned = reelsRes.docs.length;

for (const doc of reelsRes.docs) {
  const url = typeof doc.externalUrl === "string" ? doc.externalUrl.trim() : "";
  if (!url || !needsResolution(url)) continue;
  try {
    const canonical = await resolveShortUrl(url);
    if (canonical === url) {
      console.log(`  reel  ${doc.id}  no-op (resolver returned unchanged)`);
      continue;
    }
    console.log(`  reel  ${doc.id}\n    from: ${url}\n    to:   ${canonical}`);
    if (!dryRun) {
      await payload.update({
        collection: "reels",
        id: doc.id,
        data: { externalUrl: canonical },
        overrideAccess: true,
      });
    }
    summary.reels.changed += 1;
  } catch (err) {
    summary.reels.errors += 1;
    console.error(`  reel  ${doc.id}  ERROR:`, err.message ?? err);
  }
}

// ── Article + Page bodies (rich-text embed nodes) ────────────────────
for (const collection of ["articles", "pages"]) {
  const res = await payload.find({
    collection,
    limit: perCollectionLimit,
    overrideAccess: true,
    depth: 0,
  });
  summary[collection].scanned = res.docs.length;

  for (const doc of res.docs) {
    const body = doc.body;
    if (!body || typeof body !== "object") continue;
    let changed = false;
    let count = 0;
    try {
      await walkEmbedNodes(body, async (node) => {
        const url = typeof node.url === "string" ? node.url.trim() : "";
        if (!url || !needsResolution(url)) return;
        const canonical = await resolveShortUrl(url);
        if (canonical === url) return;
        console.log(
          `  ${collection}  ${doc.id}  embed[${count}]\n    from: ${url}\n    to:   ${canonical}`
        );
        node.url = canonical;
        // `embedUrl` in the stored node is a stale cache the public renderer
        // never trusts (it re-derives from `url`). Null it so the shape stays
        // honest and any admin preview that reads it doesn't show a stale id.
        if ("embedUrl" in node) node.embedUrl = null;
        changed = true;
        count += 1;
      });
      if (!changed) continue;
      if (!dryRun) {
        await payload.update({
          collection,
          id: doc.id,
          data: { body },
          overrideAccess: true,
        });
      }
      summary[collection].changed += 1;
    } catch (err) {
      summary[collection].errors += 1;
      console.error(
        `  ${collection}  ${doc.id}  ERROR:`,
        err.message ?? err
      );
    }
  }
}

// ── Report ───────────────────────────────────────────────────────────
console.log("\n── summary ──────────────────────────────────────────");
for (const [name, stats] of Object.entries(summary)) {
  console.log(
    `  ${name.padEnd(9)}  scanned=${stats.scanned}  changed=${stats.changed}  errors=${stats.errors}`
  );
}
if (dryRun) {
  console.log("\n(dry run — no rows were modified)");
} else {
  console.log("\ndone.");
}
process.exit(0);

/**
 * Depth-first walk of a Lexical/Slate rich-text tree. Any node with
 * `type: "embed"` and a `url` property gets passed to the visitor.
 * Awaits each visitor to keep network calls serial (short-link resolution
 * hits third-party servers — parallelism buys nothing and just risks rate
 * limits).
 */
async function walkEmbedNodes(node, visit) {
  if (!node || typeof node !== "object") return;
  if (node.type === "embed" && typeof node.url === "string") {
    await visit(node);
  }
  const root = node.root;
  if (root && Array.isArray(root.children)) {
    for (const child of root.children) await walkEmbedNodes(child, visit);
  }
  if (Array.isArray(node.children)) {
    for (const child of node.children) await walkEmbedNodes(child, visit);
  }
}
