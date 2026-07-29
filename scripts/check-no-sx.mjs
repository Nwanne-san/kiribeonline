#!/usr/bin/env node
/**
 * Fails if new MUI layout/visual `sx={{ ... }}` objects appear under src/.
 *
 * Allowed: wrappers that only forward `sx={sx}` for migration back-compat
 * (KiribeButton, KiribeLink, EditorialContainer, etc.). Those use `sx={sx}`,
 * not inline `sx={{` objects.
 *
 * Escape hatch: add a file path to ALLOWLIST only for true MUI deep-slot cases,
 * and keep a `// MUI slot escape hatch` comment next to the usage.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SRC = join(ROOT, "src");

/** Paths (repo-relative) allowed to contain `sx={{` — keep empty unless unavoidable. */
const ALLOWLIST = new Set([
  // Example: "src/modules/foo/Bar.tsx",
]);

const SX_OBJECT = /sx=\{\{/;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === "node_modules" || name === ".next") continue;
      walk(full, out);
    } else if (/\.(tsx|ts|jsx|js)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

const offenders = [];
for (const file of walk(SRC)) {
  const rel = relative(ROOT, file);
  if (ALLOWLIST.has(rel)) continue;
  const text = readFileSync(file, "utf8");
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (SX_OBJECT.test(line)) {
      offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
    }
  });
}

if (offenders.length > 0) {
  console.error(
    "Found MUI sx={{ ... }} object literals. Prefer Tailwind className (see docs/DESIGN.md §14).\n"
  );
  for (const o of offenders) console.error(`  ${o}`);
  console.error(
    `\n${offenders.length} violation(s). Use className + tokens, or add a documented ALLOWLIST entry in scripts/check-no-sx.mjs.`
  );
  process.exit(1);
}

console.log("check-no-sx: ok (no sx={{ objects under src/)");
