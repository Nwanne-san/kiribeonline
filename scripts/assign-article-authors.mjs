#!/usr/bin/env node
/**
 * Round-robin any un-authored articles across the pool of active admins and
 * editors. Idempotent: articles that already have an `author` are skipped, so
 * re-running the script only touches the newest orphans.
 *
 * Usage:
 *   npm run assign-article-authors           # apply the changes
 *   npm run assign-article-authors -- --dry  # preview only, no writes
 *
 * Loads .env.local when DATABASE_URL / PAYLOAD_SECRET are not already set,
 * mirroring the other Payload bootstrap scripts (create-admin.mjs, seed-*.mjs).
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
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) loadEnvLocal();

const { values } = parseArgs({
  options: {
    dry: { type: "boolean", default: false },
    /** Restrict assignment to a single role. Default: admin,editor. */
    roles: { type: "string", default: "admin,editor" },
  },
});

const dry = Boolean(values.dry);
const roleFilter = String(values.roles)
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean);

process.env.PAYLOAD_MIGRATING = "true";

const { getPayload } = await import("payload");
const config = (await import("../src/payload.config.ts")).default;

const payload = await getPayload({ config });

// --- 1. Load the assignee pool ----------------------------------------------
const assigneeResult = await payload.find({
  collection: "users",
  where: {
    and: [
      { status: { equals: "active" } },
      { role: { in: roleFilter } },
    ],
  },
  sort: "createdAt",
  limit: 500,
  depth: 0,
  overrideAccess: true,
  pagination: false,
});

const assignees = assigneeResult.docs.map((u) => ({
  id: String(u.id),
  email: u.email,
  role: u.role,
}));

if (assignees.length === 0) {
  console.error(
    `[assign] no active users with role in [${roleFilter.join(",")}] — aborting.`
  );
  process.exit(1);
}

console.log(
  `[assign] round-robin pool: ${assignees
    .map((u) => `${u.email} (${u.role})`)
    .join(", ")}`
);

// --- 2. Fetch un-authored articles in stable order --------------------------
const orphans = [];
let page = 1;
// Page through so we don't OOM on a huge archive.
// eslint-disable-next-line no-constant-condition
while (true) {
  const batch = await payload.find({
    collection: "articles",
    where: { author: { exists: false } },
    sort: "createdAt",
    page,
    limit: 100,
    depth: 0,
    overrideAccess: true,
  });
  orphans.push(...batch.docs);
  if (!batch.hasNextPage) break;
  page += 1;
}

if (orphans.length === 0) {
  console.log("[assign] no articles missing an author — nothing to do.");
  process.exit(0);
}

console.log(`[assign] found ${orphans.length} article(s) with no author`);

// --- 3. Round-robin assign --------------------------------------------------
let updated = 0;
let failed = 0;
for (let i = 0; i < orphans.length; i++) {
  const article = orphans[i];
  const assignee = assignees[i % assignees.length];
  const line = `  ${article.id.toString().padStart(6, " ")} · ${article.title ?? "(untitled)"} → ${assignee.email}`;

  if (dry) {
    console.log(`[dry] ${line}`);
    continue;
  }

  try {
    await payload.update({
      collection: "articles",
      id: article.id,
      data: { author: assignee.id },
      // Skip the audit + revalidation hooks so a bulk backfill doesn't spam
      // the audit log with N synthetic "updated" events — the script itself
      // is the audit trail.
      context: { skipHooks: true },
      overrideAccess: true,
    });
    updated += 1;
    console.log(line);
  } catch (err) {
    failed += 1;
    console.error(`[error] ${line}`, err.message ?? err);
  }
}

console.log(
  `[assign] done — ${updated} updated, ${failed} failed, ${orphans.length - updated - failed} skipped${dry ? " (dry run)" : ""}`
);

process.exit(0);
