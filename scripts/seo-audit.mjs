#!/usr/bin/env node
/**
 * SEO audit — walks a running Kiribé server and checks each public route
 * for the metadata + structured-data hygiene we care about.
 *
 * Usage:
 *   npm run dev  # in another terminal
 *   node scripts/seo-audit.mjs                      # audit localhost:3000
 *   node scripts/seo-audit.mjs https://kiribeonline.com
 *
 * Report is human-readable to stdout with a summary at the end; exits 1
 * when any route is missing a required field so it can gate CI later.
 *
 * Not run in CI by default — dependencies are stdlib only, no puppeteer.
 * HTML parsing is a set of regexes, deliberately narrow: we're not
 * validating the whole page, we're checking whether the specific meta tags
 * we author actually reached the response.
 */

const DEFAULT_BASE = "http://localhost:3000";
const base = (process.argv[2] || DEFAULT_BASE).replace(/\/$/, "");

/** Routes to audit. Category/tag slugs are seed-based; adjust if yours differ. */
const ROUTES = [
  { path: "/", type: "home" },
  { path: "/articles", type: "list" },
  { path: "/categories", type: "list" },
  { path: "/categories/film", type: "category" },
  { path: "/categories/spotlight", type: "category-special" },
  { path: "/categories/videos", type: "category-special" },
  { path: "/tags/nollywood", type: "tag" },
  { path: "/about", type: "static" },
  { path: "/contact", type: "static" },
  { path: "/privacy", type: "static" },
  { path: "/terms", type: "static" },
  { path: "/search", type: "search" },
  { path: "/sitemap.xml", type: "sitemap" },
  { path: "/robots.txt", type: "robots" },
  { path: "/llms.txt", type: "llms" },
];

/** Regex extractors — narrow on purpose. */
function extractMeta(html, name) {
  const attrs = [`name=["']${name}["']`, `property=["']${name}["']`];
  for (const attr of attrs) {
    const rx = new RegExp(`<meta[^>]*${attr}[^>]*content=["']([^"']+)["']`, "i");
    const m = html.match(rx);
    if (m) return m[1];
  }
  return null;
}

function extractLink(html, rel) {
  const rx = new RegExp(`<link[^>]*rel=["']${rel}["'][^>]*href=["']([^"']+)["']`, "i");
  const m = html.match(rx);
  return m ? m[1] : null;
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1] : null;
}

function extractJsonLdTypes(html) {
  const types = new Set();
  const rx = /<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = rx.exec(html))) {
    try {
      const payload = JSON.parse(match[1]);
      const walk = (node) => {
        if (!node || typeof node !== "object") return;
        if (typeof node["@type"] === "string") types.add(node["@type"]);
        if (Array.isArray(node["@graph"])) node["@graph"].forEach(walk);
      };
      walk(payload);
    } catch {
      // Skip malformed JSON — the audit reports the *presence* problem
      // via the check below, not the specific parse error.
      types.add("(malformed json-ld)");
    }
  }
  return types;
}

/** Per-type expectations. */
const REQUIRED = {
  home: {
    metas: ["description", "og:title", "og:description", "og:type"],
    canonical: true,
    schemas: ["Organization", "WebSite"],
  },
  list: {
    metas: ["description", "og:title", "og:type"],
    canonical: true,
    schemas: ["Organization", "WebSite", "CollectionPage", "BreadcrumbList"],
  },
  category: {
    metas: ["description", "og:title", "og:type"],
    canonical: true,
    schemas: ["Organization", "WebSite", "CollectionPage", "BreadcrumbList"],
  },
  "category-special": {
    metas: ["description", "og:title"],
    canonical: true,
    schemas: ["Organization", "WebSite", "CollectionPage", "BreadcrumbList"],
  },
  tag: {
    metas: ["description", "og:title"],
    canonical: true,
    schemas: ["Organization", "WebSite", "CollectionPage", "BreadcrumbList"],
  },
  static: {
    metas: ["description", "og:title"],
    canonical: true,
    schemas: ["Organization", "WebSite", "BreadcrumbList"],
  },
  search: {
    metas: ["description"],
    canonical: true,
    schemas: ["Organization", "WebSite"],
    robots: "noindex",
  },
  sitemap: { rawXml: true, mustInclude: ["<urlset"] },
  robots: { rawText: true, mustInclude: ["Sitemap:", "GPTBot"] },
  llms: { rawText: true, mustInclude: ["# Kiribé Online", "## Categories"] },
};

async function fetchRoute(path) {
  const res = await fetch(`${base}${path}`, {
    headers: { "user-agent": "kiribe-seo-audit/1.0" },
  });
  const body = await res.text();
  return { status: res.status, body };
}

const results = [];

for (const { path, type } of ROUTES) {
  const spec = REQUIRED[type];
  const issues = [];
  try {
    const { status, body } = await fetchRoute(path);
    if (status !== 200) {
      issues.push(`HTTP ${status}`);
      results.push({ path, type, issues });
      continue;
    }

    if (spec.rawText || spec.rawXml) {
      for (const needle of spec.mustInclude ?? []) {
        if (!body.includes(needle)) issues.push(`missing "${needle}"`);
      }
      results.push({ path, type, issues });
      continue;
    }

    if (!extractTitle(body)) issues.push("missing <title>");
    for (const name of spec.metas ?? []) {
      if (!extractMeta(body, name)) issues.push(`missing meta ${name}`);
    }
    if (spec.canonical && !extractLink(body, "canonical")) {
      issues.push("missing <link rel=canonical>");
    }
    if (spec.robots) {
      const robotsMeta = extractMeta(body, "robots");
      if (!robotsMeta?.includes(spec.robots)) {
        issues.push(`robots meta should include "${spec.robots}" (got "${robotsMeta ?? "none"}")`);
      }
    }
    if (spec.schemas?.length) {
      const found = extractJsonLdTypes(body);
      for (const schema of spec.schemas) {
        if (!found.has(schema)) issues.push(`missing JSON-LD ${schema}`);
      }
    }
  } catch (err) {
    issues.push(`fetch failed: ${err.message}`);
  }

  results.push({ path, type, issues });
}

// Report
const okCount = results.filter((r) => r.issues.length === 0).length;
const failCount = results.length - okCount;

console.log(`\nSEO audit — ${base}\n${"─".repeat(48)}`);
for (const { path, type, issues } of results) {
  if (issues.length === 0) {
    console.log(`✓ ${path}  [${type}]`);
  } else {
    console.log(`✗ ${path}  [${type}]`);
    for (const issue of issues) console.log(`    - ${issue}`);
  }
}
console.log(`${"─".repeat(48)}\n${okCount} passed, ${failCount} failed\n`);

process.exit(failCount === 0 ? 0 : 1);
